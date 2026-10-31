package com.asanak.proxy.filter;

import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.GatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;

import java.net.URI;

@Component
public class AuthRedirectFilter implements GatewayFilterFactory<AuthRedirectFilter.Config> {

    public static class Config {
        // Optional config if needed
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();
            HttpHeaders headers = request.getHeaders();

            if (headers.containsKey(HttpHeaders.AUTHORIZATION)) {
                // Redirect to /bb
                ServerHttpResponse response = exchange.getResponse();
                response.setStatusCode(HttpStatus.FOUND); // 302
                response.getHeaders().setLocation(URI.create("/app/captcha/generate"));
                return response.setComplete();
            }

            return chain.filter(exchange);
        };
    }

    @Override
    public Class<Config> getConfigClass() {
        return Config.class;
    }
}
