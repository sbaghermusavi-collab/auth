package com.asanak.proxy.filter;

import com.asanak.proxy.security.DynamicTenantLookupService;
import com.nimbusds.jwt.SignedJWT;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.Map;

/**
 * Validates Tenant Binding:
 * Compares the token's tenant claim against the domain/edge tenant dynamically loaded from DB.
 * If a token issued for tenant A is presented to a domain bound to tenant B,
 * the request is rejected with 403 Forbidden.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TenantBindingValidationFilter implements GlobalFilter, Ordered {

    private final DynamicTenantLookupService tenantLookupService;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String domainTenant = (String) exchange.getAttribute(EdgeSecurityAndHostAllowlistFilter.TENANT_ATTR);
        if (domainTenant == null || domainTenant.isBlank() || "default".equalsIgnoreCase(domainTenant)) {
            return chain.filter(exchange);
        }

        String rawToken = extractToken(exchange);
        if (rawToken == null || rawToken.isBlank()) {
            return chain.filter(exchange);
        }

        try {
            SignedJWT jwt = SignedJWT.parse(rawToken);
            Map<String, Object> claims = jwt.getJWTClaimsSet().getClaims();

            if ("superadmin".equalsIgnoreCase(String.valueOf(claims.get("preferred_username")))
                    || "superadmin".equalsIgnoreCase(String.valueOf(claims.get("actor")))) {
                return chain.filter(exchange);
            }

            String tokenTenant = extractTenantClaim(claims);

            if (tokenTenant != null && !tokenTenant.isBlank()) {
                String normalizedDomainTenant = normalize(domainTenant);
                String normalizedTokenTenant = normalize(tokenTenant);

                if (!normalizedDomainTenant.equalsIgnoreCase(normalizedTokenTenant)) {
                    log.warn("[TenantBinding] VIOLATION: Domain tenant '{}' does not match Token tenant '{}' for path: {}",
                            normalizedDomainTenant, normalizedTokenTenant, exchange.getRequest().getURI().getPath());
                    exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
                    return exchange.getResponse().setComplete();
                }
            }
        } catch (Exception e) {
            log.trace("[TenantBinding] Could not parse token for binding check: {}", e.getMessage());
        }

        return chain.filter(exchange);
    }

    private String extractToken(ServerWebExchange exchange) {
        String authHeader = exchange.getRequest().getHeaders().getFirst("Authorization");
        if (authHeader != null && authHeader.regionMatches(true, 0, "Bearer ", 0, 7)) {
            return authHeader.substring(7).trim();
        }

        // Also check access_token cookie
        if (exchange.getRequest().getCookies().containsKey("access_token")) {
            var cookie = exchange.getRequest().getCookies().getFirst("access_token");
            if (cookie != null) return cookie.getValue();
        }
        if (exchange.getRequest().getCookies().containsKey("__Host-access_token")) {
            var cookie = exchange.getRequest().getCookies().getFirst("__Host-access_token");
            if (cookie != null) return cookie.getValue();
        }
        return null;
    }

    private String extractTenantClaim(Map<String, Object> claims) {
        if (claims == null) return null;
        Object tenantClaim = claims.get("tenant_id");
        if (tenantClaim == null) {
            tenantClaim = claims.get("tenantId");
        }
        if (tenantClaim == null) {
            tenantClaim = claims.get("tenant");
        }
        if (tenantClaim == null && claims.get("customer") instanceof Map<?, ?> cust) {
            tenantClaim = cust.get("tenant_id");
        }
        return tenantClaim != null ? tenantClaim.toString().trim() : null;
    }

    private String normalize(String t) {
        if (t == null) return "";
        return tenantLookupService.normalizeTenant(t);
    }

    @Override
    public int getOrder() {
        // Runs right after EdgeSecurityAndHostAllowlistFilter and before downstream TokenRelay
        return Ordered.HIGHEST_PRECEDENCE + 5;
    }
}
