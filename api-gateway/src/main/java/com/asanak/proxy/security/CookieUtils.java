package com.asanak.proxy.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseCookie;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.web.server.ServerWebExchange;

@Slf4j
public final class CookieUtils {

    private static final String[] COOKIE_NAMES = {
            "SESSION",
            "access_token",
            "refresh_token"
    };

    private CookieUtils() {}

    /**
     * Resolves the cookie domain from Host/X-Forwarded-Host header dynamically.
     * E.g. "app.peykasa.ir" -> ".peykasa.ir" or "milky.peykasa.ir" -> ".peykasa.ir"
     * For localhost or IP addresses, returns null (host-only cookie).
     */
    public static String resolveCookieDomain(ServerWebExchange exchange) {
        ServerHttpRequest request = exchange.getRequest();
        String host = request.getHeaders().getFirst("X-Forwarded-Host");
        if (host == null || host.isBlank()) {
            host = request.getHeaders().getFirst("Host");
        }
        if (host == null || host.isBlank()) {
            return null;
        }

        String hostWithoutPort = host.split(":")[0].trim();
        if ("localhost".equalsIgnoreCase(hostWithoutPort) || hostWithoutPort.matches("\\d+\\.\\d+\\.\\d+\\.\\d+")) {
            return null;
        }

        String[] parts = hostWithoutPort.split("\\.");
        if (parts.length >= 2) {
            return "." + parts[parts.length - 2] + "." + parts[parts.length - 1];
        }
        return "." + hostWithoutPort;
    }

    /**
     * Clears all authentication cookies cleanly across host and root-domain.
     */
    public static void clearAuthenticationCookies(ServerWebExchange exchange) {
        ServerHttpResponse response = exchange.getResponse();
        if (response.isCommitted()) {
            return;
        }
        ServerHttpRequest request = exchange.getRequest();

        boolean isSecure = request.getSslInfo() != null ||
                "https".equalsIgnoreCase(request.getHeaders().getFirst("X-Forwarded-Proto"));

        String domain = resolveCookieDomain(exchange);

        for (String cookieName : COOKIE_NAMES) {
            // 1. Clear without domain (host-level)
            response.addCookie(ResponseCookie.from(cookieName, "")
                    .path("/")
                    .maxAge(0)
                    .secure(isSecure)
                    .httpOnly(true)
                    .sameSite("Lax")
                    .build());

            // 2. Clear with domain (production shared domain level, e.g. .peykasa.ir)
            if (domain != null) {
                response.addCookie(ResponseCookie.from(cookieName, "")
                        .domain(domain)
                        .path("/")
                        .maxAge(0)
                        .secure(isSecure)
                        .httpOnly(true)
                        .sameSite("Lax")
                        .build());
            }
        }
        log.info("[CookieUtils] Cleared cookies {} with domain: {}, secure: {}", COOKIE_NAMES, domain, isSecure);
    }
}
