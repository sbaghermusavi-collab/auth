package com.asanak.proxy.filter;

import com.asanak.proxy.security.DynamicTenantLookupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Dynamic Edge Security Filter:
 * 1. Validates incoming Host against registered tenant domains from MySQL auth.tenants.
 * 2. Header Sanitization: Strips untrusted client-supplied X-Tenant-Id / X-TENANT-ID.
 * 3. Authoritative Tenant Resolution dynamically resolved from Database via DynamicTenantLookupService.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class EdgeSecurityAndHostAllowlistFilter implements GlobalFilter, Ordered {

    public static final String TENANT_ATTR = "TENANT_ID";
    public static final String TENANT_HEADER = "X-Tenant-Id";
    public static final String TENANT_HEADER_UPPER = "X-TENANT-ID";

    private final DynamicTenantLookupService tenantLookupService;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();

        // 1. Host Validation
        String host = extractCleanHost(request);
        if (!tenantLookupService.isHostAllowed(host)) {
            log.warn("[HostValidation] Rejected untrusted Host: '{}' for URI: {}", host, request.getURI());
            exchange.getResponse().setStatusCode(HttpStatus.BAD_REQUEST);
            return exchange.getResponse().setComplete();
        }

        // 2. Resolve Authoritative Tenant dynamically from Host domain via Database lookup
        String authoritativeTenant = tenantLookupService.resolveTenantCodeFromHost(host);

        ServerHttpRequest.Builder reqBuilder = request.mutate();
        reqBuilder.headers(headers -> {
            headers.remove(TENANT_HEADER);
            headers.remove(TENANT_HEADER_UPPER);
            if (authoritativeTenant != null) {
                headers.set(TENANT_HEADER, authoritativeTenant);
                headers.set(TENANT_HEADER_UPPER, authoritativeTenant);
            }
        });

        ServerHttpRequest sanitizedRequest = reqBuilder.build();

        // 4. Attach to exchange attributes
        if (authoritativeTenant != null) {
            exchange.getAttributes().put(TENANT_ATTR, authoritativeTenant);
        }

        // 5. Propagate tenant via Reactor Context
        return chain.filter(exchange.mutate().request(sanitizedRequest).build())
                .contextWrite(context -> {
                    if (authoritativeTenant != null) {
                        return context.put(TENANT_ATTR, authoritativeTenant);
                    }
                    return context;
                });
    }

    private String extractCleanHost(ServerHttpRequest request) {
        String fwdHost = request.getHeaders().getFirst("X-Forwarded-Host");
        String rawHost = (fwdHost != null && !fwdHost.isBlank())
                ? fwdHost.split(",")[0].trim()
                : request.getHeaders().getFirst("Host");

        if (rawHost == null || rawHost.isBlank()) {
            rawHost = request.getURI().getHost();
        }

        if (rawHost != null) {
            if (rawHost.contains(":")) {
                rawHost = rawHost.split(":")[0].trim();
            }
            return rawHost.toLowerCase();
        }
        return "";
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
