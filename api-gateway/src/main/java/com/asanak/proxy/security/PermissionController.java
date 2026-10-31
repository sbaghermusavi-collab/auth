package com.asanak.proxy.security;

import com.asanak.proxy.security.CookieUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.annotation.RegisteredOAuth2AuthorizedClient;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebSession;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/permission")
@RequiredArgsConstructor
public class PermissionController {
    private final KeycloakService keycloakService;


    @Value("${spring.security.oauth2.client.provider.keycloak.token-uri}")
    private String issuerUri;


    // You should configure this property in your application.yml or application.properties
    @Value("${post.logout.redirect.uri:http://localhost:8080/}")
    private String postLogoutRedirectUri;


    @GetMapping
    public Mono<ServiceResult<List<Permission>>> getPermissions(
            @RegisteredOAuth2AuthorizedClient("keycloak") OAuth2AuthorizedClient authorizedClient
    ) {
        String accessToken = authorizedClient.getAccessToken().getTokenValue();
        return keycloakService.getPermissions(accessToken)
                .map(ServiceResult::success)
                .onErrorResume(e -> Mono.just(
                        ServiceResult.fail(
                                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                                "Failed to retrieve permissions.",
                                e.getMessage()
                        ))
                );
    }

    @GetMapping("/me")
    public Mono<ServiceResult<Map<String, Object>>> me(ServerWebExchange exchange,
            @RegisteredOAuth2AuthorizedClient("keycloak") OAuth2AuthorizedClient authorizedClient
    ) {
        String accessToken = authorizedClient.getAccessToken().getTokenValue();
        return keycloakService.getUserInfo(accessToken)
                .map(result -> {
                    // ----------------------------------------------
                    // DUPLICATE SESSION COOKIE FOR LOCALHOST (DEV)
                    // ----------------------------------------------
                        var sessionCookie = exchange.getRequest().getCookies().getFirst("SESSION");
                        if (sessionCookie != null) {
                            String sessionId = sessionCookie.getValue();

                            ResponseCookie localhostCookie = ResponseCookie.from("SESSION", sessionId)
                                    .domain("localhost")
                                    .path("/")
                                    .sameSite("None")
                                    .secure(true)    // because not HTTPS in dev
                                    .httpOnly(true)
                                    .build();

                            exchange.getResponse().addCookie(localhostCookie);
                        }
                    // ----------------------------------------------

                    return ServiceResult.success(result);
                }).onErrorResume(e -> Mono.just(
                        ServiceResult.fail(
                                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                                "Failed to retrieve permissions.",
                                e.getMessage()
                        ))
                );
    }
    @GetMapping("/token")
    public Mono<String> getToken(
            ServerWebExchange exchange,
            @RegisteredOAuth2AuthorizedClient("keycloak") OAuth2AuthorizedClient authorizedClient
    ) {
        String accessToken = authorizedClient.getAccessToken().getTokenValue();
        
        ResponseCookie tokenCookie = ResponseCookie.from("access_token", accessToken)
                .path("/")
                .build();
        exchange.getResponse().addCookie(tokenCookie);
        
        return Mono.just(accessToken);
    }

    @GetMapping("/logout")
    public Mono<Void> logout(ServerWebExchange exchange) {
        return exchange.getSession()
                .flatMap(WebSession::invalidate)
                .onErrorResume(e -> Mono.empty())
                .then(Mono.defer(() -> {
                    CookieUtils.clearAuthenticationCookies(exchange);
                    ServerHttpResponse response = exchange.getResponse();
                    ResponseCookie deleteSessionCookie = ResponseCookie.from("SESSION", "")
                            .maxAge(0)
                            .path("/")
                            .httpOnly(true)
                            .build();
                    response.addCookie(deleteSessionCookie);

                    String host = exchange.getRequest().getHeaders().getFirst("Host");
                    String logoutRedirectUrl = (host != null && !host.isBlank())
                            ? "http://" + host + "/auth/logout"
                            : "/auth/logout";

                    response.setStatusCode(HttpStatus.FOUND);
                    response.getHeaders().setLocation(URI.create(logoutRedirectUrl));
                    return response.setComplete();
                }))
                .onErrorResume(e -> {
                    CookieUtils.clearAuthenticationCookies(exchange);
                    ServerHttpResponse response = exchange.getResponse();
                    response.setStatusCode(HttpStatus.FOUND);
                    response.getHeaders().setLocation(URI.create("/auth/logout"));
                    return response.setComplete();
                });
    }
}
