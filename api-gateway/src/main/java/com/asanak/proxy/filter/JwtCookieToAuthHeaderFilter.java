package com.asanak.proxy.filter;

import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class JwtCookieToAuthHeaderFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, org.springframework.cloud.gateway.filter.GatewayFilterChain chain) {
        return exchange.getSession().flatMap(session -> {
            String impersonatedToken = (String) session.getAttributes().get("IMPERSONATED_ACCESS_TOKEN");
            if (impersonatedToken != null && !impersonatedToken.isBlank()) {
                ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + impersonatedToken)
                        .build();
                return chain.filter(exchange.mutate().request(mutatedRequest).build());
            }

            String jwt = extractJwtFromCookies(exchange);
            if (jwt != null && !jwt.isBlank()) {
                ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + jwt)
                        .build();
                return chain.filter(exchange.mutate().request(mutatedRequest).build());
            }

            return chain.filter(exchange);
        });
    }

    private String extractJwtFromCookies(ServerWebExchange exchange) {
        if (exchange.getRequest().getCookies().getFirst("Authorization") != null) {
            return exchange.getRequest().getCookies().getFirst("Authorization").getValue();
        }
        if (exchange.getRequest().getCookies().getFirst("access_token") != null) {
            return exchange.getRequest().getCookies().getFirst("access_token").getValue();
        }
        if (exchange.getRequest().getCookies().getFirst("__Host-access_token") != null) {
            return exchange.getRequest().getCookies().getFirst("__Host-access_token").getValue();
        }
        return null;
    }

    @Override
    public int getOrder() {
        return -2;
    }
}
