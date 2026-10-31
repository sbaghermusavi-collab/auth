package com.asanak.proxy.components;

import com.asanak.proxy.security.SessionEncryptionHelper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.registration.ReactiveClientRegistrationRepository;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.authentication.ServerAuthenticationSuccessHandler;
import org.springframework.security.web.server.csrf.CookieServerCsrfTokenRepository;
import org.springframework.web.server.session.CookieWebSessionIdResolver;
import org.springframework.web.server.session.WebSessionIdResolver;

import java.net.URI;
import java.util.ArrayList;
import java.util.Map;

import static org.springframework.security.config.Customizer.withDefaults;

@EnableWebFluxSecurity
@Slf4j
@Configuration
public class SecurityConfig {

    @Value("${security.public-paths}")
    private String[] publicPaths;

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http,
                                                            ReactiveClientRegistrationRepository repo,
                                                            ServerAuthenticationSuccessHandler oAuth2LoginSuccessHandler,
                                                            DynamicRedirectResolver dynamicRedirectResolver) {
        http.sessionManagement(withDefaults()).authorizeExchange(auth -> auth
                        .pathMatchers(publicPaths).permitAll()
                        .anyExchange().authenticated()
                )
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((exchange, ex) -> {
                            var request = exchange.getRequest();
                            String path = request.getURI().getPath();
                            String accept = request.getHeaders().getFirst("Accept");

                            // Return clean 401 JSON for AJAX/API requests so frontend can handle re-auth cleanly without CORS issues
                            if (path.startsWith("/api/") || (accept != null && accept.contains("application/json"))) {
                                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                                exchange.getResponse().getHeaders().setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
                                org.springframework.core.io.buffer.DataBuffer buffer = exchange.getResponse().bufferFactory().wrap(
                                        "{\"error\":\"UNAUTHORIZED\",\"message\":\"Authentication required\"}".getBytes(java.nio.charset.StandardCharsets.UTF_8)
                                );
                                return exchange.getResponse().writeWith(reactor.core.publisher.Mono.just(buffer));
                            }

                            // Directly redirect browser requests to the appropriate client to bypass default Spring Security login selection page
                            String host = request.getHeaders().getFirst("Host");
                            String clientRegId = (host != null && host.startsWith("admin.")) ? "admin-client" : "keycloak";

                            exchange.getResponse().setStatusCode(HttpStatus.FOUND);
                            exchange.getResponse().getHeaders().setLocation(URI.create("/oauth2/authorization/" + clientRegId));
                            return exchange.getResponse().setComplete();
                        })
                )
                .oauth2Login(oauth2 -> oauth2
                        .authorizationRequestResolver(dynamicRedirectResolver)
                        .authenticationSuccessHandler(oAuth2LoginSuccessHandler))
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessHandler((exchange, authentication) -> {
                            var request = exchange.getExchange().getRequest();
                            String fwdHost = request.getHeaders().getFirst("X-Forwarded-Host");
                            String host = (fwdHost != null && !fwdHost.isBlank())
                                    ? fwdHost.split(",")[0].trim()
                                    : request.getHeaders().getFirst("Host");

                            String origin = (host != null && !host.isBlank())
                                    ? "http://" + host
                                    : "http://localhost:8090";

                            var response = exchange.getExchange().getResponse();
                            // Invalidate cookies with both __Host- and standard names
                            response.addCookie(ResponseCookie.from("__Host-access_token", "").path("/").maxAge(0).build());
                            response.addCookie(ResponseCookie.from("access_token", "").path("/").maxAge(0).build());
                            response.addCookie(ResponseCookie.from("__Host-refresh_token", "").path("/").maxAge(0).build());
                            response.addCookie(ResponseCookie.from("refresh_token", "").path("/").maxAge(0).build());
                            response.addCookie(ResponseCookie.from("SESSION", "").path("/").maxAge(0).build());
                            response.addCookie(ResponseCookie.from("__Host-SESSION", "").path("/").maxAge(0).build());

                            log.info("[RP-Initiated Logout] Cleared local session and cookies, redirecting to Auth Server: {}/auth/logout", origin);
                            response.setStatusCode(HttpStatus.FOUND);
                            response.getHeaders().setLocation(URI.create(origin + "/auth/logout"));
                            return response.setComplete();
                        }));

        // CSRF Token support: CookieServerCsrfTokenRepository with HttpOnly=false for SPA/Axios integration
        org.springframework.security.web.server.csrf.ServerCsrfTokenRequestAttributeHandler requestHandler =
                new org.springframework.security.web.server.csrf.ServerCsrfTokenRequestAttributeHandler();

        http.csrf(csrf -> csrf
                .csrfTokenRepository(CookieServerCsrfTokenRepository.withHttpOnlyFalse())
                .csrfTokenRequestHandler(requestHandler)
                .requireCsrfProtectionMatcher(exchange -> {
                    var req = exchange.getRequest();
                    HttpMethod method = req.getMethod();
                    if (HttpMethod.GET.equals(method) || HttpMethod.HEAD.equals(method) ||
                            HttpMethod.OPTIONS.equals(method) || HttpMethod.TRACE.equals(method)) {
                        return org.springframework.security.web.server.util.matcher.ServerWebExchangeMatcher.MatchResult.notMatch();
                    }
                    if (req.getHeaders().containsKey("Authorization")) {
                        return org.springframework.security.web.server.util.matcher.ServerWebExchangeMatcher.MatchResult.notMatch();
                    }
                    String path = req.getURI().getPath();
                    // Exempt internal auth flow redirects, and ALL backend /api/** routes from CSRF
                    if (path.startsWith("/api/") ||
                            path.startsWith("/login/oauth2/") || path.startsWith("/oauth2/") ||
                            path.startsWith("/public/") || path.startsWith("/auth/")) {
                        return org.springframework.security.web.server.util.matcher.ServerWebExchangeMatcher.MatchResult.notMatch();
                    }
                    return org.springframework.security.web.server.util.matcher.ServerWebExchangeMatcher.MatchResult.match();
                })
        );

        return http.build();
    }

    @Bean
    public ServerAuthenticationSuccessHandler oAuth2LoginSuccessHandler(
            org.springframework.security.oauth2.client.web.server.ServerOAuth2AuthorizedClientRepository authorizedClientRepository,
            SessionEncryptionHelper sessionEncryptionHelper) {

        return (exchange, authentication) -> {
            var response = exchange.getExchange().getResponse();
            if (response.isCommitted()) {
                return reactor.core.publisher.Mono.empty();
            }

            if (authentication instanceof org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken oauthToken) {
                return authorizedClientRepository.loadAuthorizedClient(
                        oauthToken.getAuthorizedClientRegistrationId(),
                        authentication,
                        exchange.getExchange()
                ).flatMap(client -> exchange.getExchange().getSession().flatMap(session -> {
                    if (response.isCommitted()) {
                        return reactor.core.publisher.Mono.empty();
                    }

                    var request = exchange.getExchange().getRequest();
                    boolean isSecure = request.getSslInfo() != null ||
                            "https".equalsIgnoreCase(request.getHeaders().getFirst("X-Forwarded-Proto"));

                    String accessToken = client.getAccessToken().getTokenValue();

                    // Optional encryption for session storage
                    String encryptedAccessToken = sessionEncryptionHelper.encrypt(accessToken);
                    session.getAttributes().put("ENC_ACCESS_TOKEN", encryptedAccessToken);

                    if (isSecure) {
                        response.addCookie(ResponseCookie.from("__Host-access_token", accessToken)
                                .path("/")
                                .secure(true)
                                .httpOnly(true)
                                .sameSite("Lax")
                                .build());
                    }

                    response.addCookie(ResponseCookie.from("access_token", accessToken)
                            .path("/")
                            .secure(isSecure)
                            .httpOnly(true)
                            .sameSite("Lax")
                            .build());

                    if (client.getRefreshToken() != null) {
                        String refreshToken = client.getRefreshToken().getTokenValue();
                        if (isSecure) {
                            response.addCookie(ResponseCookie.from("__Host-refresh_token", refreshToken)
                                    .path("/")
                                    .secure(true)
                                    .httpOnly(true)
                                    .sameSite("Lax")
                                    .build());
                        }

                        response.addCookie(ResponseCookie.from("refresh_token", refreshToken)
                                .path("/")
                                .secure(isSecure)
                                .httpOnly(true)
                                .sameSite("Lax")
                                .build());
                    }

                    boolean isAdminClient = "admin-client".equals(oauthToken.getAuthorizedClientRegistrationId());
                    String targetLanding = isAdminClient ? "/admin" : "/";

                    org.springframework.security.web.server.DefaultServerRedirectStrategy redirectStrategy =
                            new org.springframework.security.web.server.DefaultServerRedirectStrategy();
                    return redirectStrategy.sendRedirect(exchange.getExchange(), URI.create(targetLanding));
                }));
            }

            org.springframework.security.web.server.DefaultServerRedirectStrategy redirectStrategy =
                    new org.springframework.security.web.server.DefaultServerRedirectStrategy();
            return redirectStrategy.sendRedirect(exchange.getExchange(), URI.create("/"));
        };
    }

    @Bean
    public WebSessionIdResolver webSessionIdResolver() {
        return new WebSessionIdResolver() {
            private final CookieWebSessionIdResolver defaultResolver = createResolver("SESSION");
            private final CookieWebSessionIdResolver adminResolver = createResolver("ADMIN_SESSION");

            private CookieWebSessionIdResolver createResolver(String name) {
                CookieWebSessionIdResolver r = new CookieWebSessionIdResolver();
                r.setCookieName(name);
                r.addCookieInitializer(builder -> builder.path("/").sameSite("Lax"));
                return r;
            }

            private boolean isAdmin(org.springframework.web.server.ServerWebExchange exchange) {
                String path = exchange.getRequest().getURI().getPath();
                String host = exchange.getRequest().getHeaders().getFirst("Host");
                if (host != null && host.startsWith("admin.")) {
                    return true;
                }
                if (path.startsWith("/admin") || path.startsWith("/api/admin") || path.contains("admin-client")) {
                    return true;
                }
                if (exchange.getRequest().getCookies().containsKey("ADMIN_SESSION") &&
                        !exchange.getRequest().getCookies().containsKey("SESSION")) {
                    return true;
                }
                return false;
            }

            @Override
            public java.util.List<String> resolveSessionIds(org.springframework.web.server.ServerWebExchange exchange) {
                if (isAdmin(exchange)) {
                    var ids = adminResolver.resolveSessionIds(exchange);
                    if (!ids.isEmpty()) return ids;
                }
                return defaultResolver.resolveSessionIds(exchange);
            }

            @Override
            public void setSessionId(org.springframework.web.server.ServerWebExchange exchange, String sessionId) {
                if (isAdmin(exchange)) {
                    adminResolver.setSessionId(exchange, sessionId);
                } else {
                    defaultResolver.setSessionId(exchange, sessionId);
                }
            }

            @Override
            public void expireSession(org.springframework.web.server.ServerWebExchange exchange) {
                adminResolver.expireSession(exchange);
                defaultResolver.expireSession(exchange);
            }
        };
    }

    @Bean
    public OAuth2UserService<OidcUserRequest, OidcUser> oidcUserService() {
        return userRequest -> {
            OidcIdToken idToken = userRequest.getIdToken();
            Map<String, Object> claims = idToken.getClaims();

            String email = claims.containsKey("email") && claims.get("email") != null
                    ? claims.get("email").toString()
                    : idToken.getSubject();

            return new DefaultOidcUser(new ArrayList<>(), idToken, email);
        };
    }
}
