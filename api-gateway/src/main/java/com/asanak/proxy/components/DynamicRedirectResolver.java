package com.asanak.proxy.components;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.oauth2.client.registration.ReactiveClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.server.DefaultServerOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.server.ServerOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class DynamicRedirectResolver implements ServerOAuth2AuthorizationRequestResolver {

    private final DefaultServerOAuth2AuthorizationRequestResolver defaultResolver;
    private static final Logger log = LoggerFactory.getLogger(DynamicRedirectResolver.class);

    public DynamicRedirectResolver(ReactiveClientRegistrationRepository repo) {
        this.defaultResolver = new DefaultServerOAuth2AuthorizationRequestResolver(repo);
    }

    @Override
    public Mono<OAuth2AuthorizationRequest> resolve(ServerWebExchange exchange) {
        return customizeRedirect(exchange, defaultResolver.resolve(exchange));
    }

    @Override
    public Mono<OAuth2AuthorizationRequest> resolve(ServerWebExchange exchange, String clientRegistrationId) {
        return customizeRedirect(exchange, defaultResolver.resolve(exchange, clientRegistrationId));
    }

    private Mono<OAuth2AuthorizationRequest> customizeRedirect(ServerWebExchange exchange,
                                                               Mono<OAuth2AuthorizationRequest> reqMono) {
        return reqMono.map(req -> {
            var request = exchange.getRequest();
            String fwdHost = request.getHeaders().getFirst("X-Forwarded-Host");
            String fwdProto = request.getHeaders().getFirst("X-Forwarded-Proto");
            String origin;

            if (fwdHost != null && !fwdHost.isBlank()) {
                String proto = (fwdProto != null && !fwdProto.isBlank()) ? fwdProto : request.getURI().getScheme();
                origin = proto + "://" + fwdHost.split(",")[0].trim();
            } else {
                String host = request.getHeaders().getFirst("Host");
                if (host != null && !host.isBlank()) {
                    origin = request.getURI().getScheme() + "://" + host;
                } else {
                    var uri = request.getURI();
                    origin = uri.getScheme() + "://" + uri.getHost();
                    if (uri.getPort() > 0 &&
                            ((uri.getScheme().equals("http") && uri.getPort() != 80) ||
                             (uri.getScheme().equals("https") && uri.getPort() != 443))) {
                        origin += ":" + uri.getPort();
                    }
                }
            }

            String regId = "keycloak";
            String host = exchange.getRequest().getHeaders().getFirst("Host");
            if (host != null && host.startsWith("admin.")) {
                regId = "admin-client";
            } else if (req.getRedirectUri() != null && req.getRedirectUri().contains("admin-client")) {
                regId = "admin-client";
            } else if (request.getURI().getPath().contains("/admin-client")) {
                regId = "admin-client";
            }
            String redirectUri = origin + "/login/oauth2/code/" + regId;
            String authorizationUri = origin + "/auth/oauth2/authorize";

            String tenant = (String) exchange.getAttribute("TENANT_ID");
            if (tenant == null || tenant.isBlank()) {
                tenant = "default";
            }

            log.info("[OAuth2 DynamicRedirectResolver] Origin: {}, authorizationUri: {}, redirectUri: {}, tenant: {}",
                    origin, authorizationUri, redirectUri, tenant);

            final String effectiveTenant = tenant;
            return OAuth2AuthorizationRequest.from(req)
                    .authorizationUri(authorizationUri)
                    .redirectUri(redirectUri)
                    .additionalParameters(params -> {
                        params.put("tenant", effectiveTenant);
                        params.put("login_hint", effectiveTenant);
                    })
                    .build();
        });
    }
}
