package com.asanak.proxy.filter;

import org.springframework.security.web.server.csrf.CsrfToken;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

/**
 * Ensures the CsrfToken Mono is subscribed to on every request so that
 * the CSRF cookie (XSRF-TOKEN) is generated and sent to the browser.
 */
@Component
public class CsrfCookieWebFilter implements WebFilter {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        Mono<CsrfToken> csrfTokenMono = exchange.getAttribute(CsrfToken.class.getName());
        if (csrfTokenMono != null) {
            return csrfTokenMono.flatMap(token -> chain.filter(exchange));
        }
        return chain.filter(exchange);
    }
}
