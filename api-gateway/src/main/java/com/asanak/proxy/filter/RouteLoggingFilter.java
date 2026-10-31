package com.asanak.proxy.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.gateway.route.Route;
import org.springframework.cloud.gateway.support.ServerWebExchangeUtils;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.URI;

@Component
@Slf4j
public class RouteLoggingFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String originalPath = exchange.getRequest().getURI().getPath();
        
        String authHeader = exchange.getRequest().getHeaders().getFirst("Authorization");
        if (authHeader != null && authHeader.toLowerCase().startsWith("bearer ")) {
            log.info("🔑 Token value being sent: {}", authHeader.substring(7));
        } else {
            var cookie = exchange.getRequest().getCookies().getFirst("access_token");
            if (cookie != null) {
                log.info("🔑 Token value being sent (from cookie): {}", cookie.getValue());
            }
        }


        return chain.filter(exchange).doFinally((throwable) -> {
            Route route = exchange.getAttribute(ServerWebExchangeUtils.GATEWAY_ROUTE_ATTR);
            URI routeUri = exchange.getAttribute(ServerWebExchangeUtils.GATEWAY_REQUEST_URL_ATTR);

            if (route != null && routeUri != null) {
                log.info("🔁 Routed request [{}] to route ID [{}] → [{}]", originalPath, route.getId(), routeUri);
            } else {
                log.warn("⚠️ Could not determine route for request [{}]", originalPath);
            }
        });
    }

    @Override
    public int getOrder() {
        return 10000; // Run late in the chain so we can see headers injected by other filters like TokenRelay
    }
}
