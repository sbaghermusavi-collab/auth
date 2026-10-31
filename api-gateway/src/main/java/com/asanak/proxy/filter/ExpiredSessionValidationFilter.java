package com.asanak.proxy.filter;

import com.asanak.proxy.security.CookieUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseCookie;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.oauth2.client.OAuth2AuthorizeRequest;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.ReactiveOAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.client.web.server.ServerOAuth2AuthorizedClientRepository;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import org.springframework.web.server.WebSession;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
public class ExpiredSessionValidationFilter implements WebFilter, Ordered {

    private final ServerOAuth2AuthorizedClientRepository authorizedClientRepository;

    private static final List<String> PUBLIC_PREFIXES = Arrays.asList(
            "/api/user-service/captcha/",
            "/api/v1/permission/logout",
            "/logout",
            "/actuator/health",
            "/login/oauth2/",
            "/oauth2/",
            "/public/"
    );

    @Override
    public int getOrder() {
        // Run BEFORE Spring Security WebFilter (-100)
        return -200;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();

        // Never interfere with public paths, auth flow, or swagger
        boolean isPublic = PUBLIC_PREFIXES.stream().anyMatch(path::startsWith);
        if (isPublic) {
            return chain.filter(exchange);
        }

        // Only inspect session for non-GET or internal paths; avoid interrupting initial parallel API hydration
        boolean hasSessionCookie = exchange.getRequest().getCookies().containsKey("SESSION");
        if (!hasSessionCookie) {
            return chain.filter(exchange);
        }

        return exchange.getSession().flatMap(session -> {
            // Check if there is an existing session or session cookie
            if (session.isStarted() || hasSessionCookie) {
                return ReactiveSecurityContextHolder.getContext()
                        .map(SecurityContext::getAuthentication)
                        .flatMap(auth -> {
                            if (auth != null && auth.isAuthenticated()) {
                                String clientRegId = (exchange.getRequest().getHeaders().getFirst("Host") != null &&
                                        exchange.getRequest().getHeaders().getFirst("Host").startsWith("admin.")) ? "admin-client" : "keycloak";
                                return authorizedClientRepository.loadAuthorizedClient(clientRegId, auth, exchange)
                                        .flatMap(client -> {
                                            Instant expiresAt = client.getAccessToken().getExpiresAt();
                                            Instant now = Instant.now();
                                            boolean isExpired = expiresAt != null && expiresAt.isBefore(now.plusSeconds(10));
                                            boolean hasRefreshToken = client.getRefreshToken() != null;

                                            log.info("[ExpiredSessionFilter] Path: {}, SessionId: {}, Token expiresAt: {}, now: {}, isExpired: {}, hasRefreshToken: {}",
                                                    path, session.getId(), expiresAt, now, isExpired, hasRefreshToken);

                                            if (isExpired && !hasRefreshToken) {
                                                log.warn("[ExpiredSessionFilter] AccessToken expired and no RefreshToken. Invalidating session for path: {}", path);
                                                return handleSessionExpiration(exchange, chain, session, path);
                                            }
                                            return chain.filter(exchange);
                                        })
                                        .switchIfEmpty(chain.filter(exchange));
                            }
                            return chain.filter(exchange);
                        })
                        .switchIfEmpty(chain.filter(exchange));
            }
            return chain.filter(exchange);
        }).switchIfEmpty(chain.filter(exchange));
    }

    private Mono<Void> handleSessionExpiration(ServerWebExchange exchange, WebFilterChain chain, WebSession session, String path) {
        log.info("[ExpiredSessionFilter] Handling session expiration for path: {}", path);
        // Clear cookies across host and production domain
        CookieUtils.clearAuthenticationCookies(exchange);

        return session.invalidate().onErrorResume(e -> Mono.empty()).then(Mono.defer(() -> {
            ServerHttpResponse response = exchange.getResponse();
            if (response.isCommitted()) {
                return Mono.empty();
            }

            // If it is a public path like captcha, clean context and let it proceed as unauthenticated guest!
            boolean isPublic = PUBLIC_PREFIXES.stream().anyMatch(path::startsWith);
            if (isPublic) {
                log.info("[ExpiredSessionFilter] Public path matched ({}), proceeding with cleared security context", path);
                return chain.filter(exchange)
                        .contextWrite(ReactiveSecurityContextHolder.clearContext());
            }

            // For protected API endpoints (except logout), return 401 JSON immediately without 302 redirect
            if (path.startsWith("/api/") && !path.contains("/logout")) {
                log.warn("[ExpiredSessionFilter] Returning 401 UNAUTHORIZED JSON response for protected API path: {}", path);
                response.setStatusCode(HttpStatus.UNAUTHORIZED);
                response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
                byte[] bytes = "{\"error\":\"UNAUTHORIZED\",\"message\":\"Session expired, please login again\"}".getBytes(StandardCharsets.UTF_8);
                return response.writeWith(Mono.just(response.bufferFactory().wrap(bytes)));
            }

            // Direct browser navigation: redirect to home (/) with clean cookie
            log.info("[ExpiredSessionFilter] Returning 302 Found redirecting to / for navigation path: {}", path);
            response.setStatusCode(HttpStatus.FOUND);
            response.getHeaders().setLocation(java.net.URI.create("/"));
            return response.setComplete();
        }));
    }
}
