package com.bontech.auth.tenant;

import com.bontech.auth.config.AppProperties;
import com.bontech.auth.entity.Tenant;
import com.bontech.auth.repository.TenantRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class TenantResolutionFilter extends OncePerRequestFilter {

    public static final String TENANT_REQ_ATTR = "currentTenant";
    public static final String TENANT_CODE_ATTR = "currentTenantCode";
    /** Header names are case-insensitive, so this also matches X-Tenant-Id. */
    public static final String TENANT_HEADER = "X-TENANT-ID";
    public static final String TENANT_PARAM = "tenant";
    public static final String TENANT_ID_PARAM = "tenantId";

    private final TenantRepository tenantRepository;
    private final AppProperties appProperties;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            Tenant tenant = resolveTenant(request);
            String effectiveCode = resolveRequestedTenantCode(request);
            if (effectiveCode == null && tenant != null) {
                effectiveCode = tenant.getCode();
            }
            if (effectiveCode != null) {
                request.setAttribute(TENANT_CODE_ATTR, effectiveCode);
            }
            if (tenant != null) {
                TenantContext.setTenantId(tenant.getId());
                request.setAttribute(TENANT_REQ_ATTR, tenant);
                log.debug("[TenantResolution] Resolved tenant id={} code={}", tenant.getId(), tenant.getCode());
            } else {
                log.warn("[TenantResolution] No tenant could be resolved or defaulted.");
            }

            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }

    private Tenant resolveTenant(HttpServletRequest request) {
        // 1. Try query param: ?tenant=... or ?tenantId=... or ?login_hint=...
        String tenantParam = request.getParameter(TENANT_PARAM);
        if (tenantParam == null || tenantParam.isBlank()) {
            tenantParam = request.getParameter(TENANT_ID_PARAM);
        }
        if (tenantParam == null || tenantParam.isBlank()) {
            tenantParam = request.getParameter("login_hint");
        }
        if (tenantParam != null && !tenantParam.isBlank()) {
            Optional<Tenant> byParam = findTenantByIdOrCode(tenantParam.trim());
            if (byParam.isPresent()) {
                return byParam.get();
            }
        }

        // 2. Try HTTP header: X-Tenant-Id
        String tenantHeader = request.getHeader(TENANT_HEADER);
        if (tenantHeader != null && !tenantHeader.isBlank()) {
            Optional<Tenant> byHeader = findTenantByIdOrCode(tenantHeader.trim());
            if (byHeader.isPresent()) {
                return byHeader.get();
            }
        }

        // 3. Try Host header
        String host = request.getHeader("Host");
        if (host != null && !host.isBlank()) {
            // strip port if present (e.g. asan.local:8090)
            String cleanHost = host.split(":")[0].trim();
            Optional<Tenant> byHost = tenantRepository.findByBaseUrlContaining(cleanHost);
            if (byHost.isPresent()) {
                return byHost.get();
            }
            if (cleanHost.startsWith("admin.")) {
                String parentHost = cleanHost.substring("admin.".length());
                Optional<Tenant> byParentHost = tenantRepository.findByBaseUrlContaining(parentHost);
                if (byParentHost.isPresent()) {
                    return byParentHost.get();
                }
            }
        }

        // 4. Fallback to default configured tenant
        String defaultTenantCode = appProperties.getDefaultTenant();
        if (defaultTenantCode != null && !defaultTenantCode.isBlank()) {
            return findTenantByIdOrCode(defaultTenantCode).orElse(null);
        }

        return null;
    }

    /**
     * Returns the tenant code requested via query param or X-TENANT-ID header, stored in DB or falling back to input.
     */
    private String resolveRequestedTenantCode(HttpServletRequest request) {
        String[] candidates = {
                request.getParameter(TENANT_PARAM),
                request.getParameter(TENANT_ID_PARAM),
                request.getHeader(TENANT_HEADER)
        };
        for (String candidate : candidates) {
            if (candidate == null || candidate.isBlank()) {
                continue;
            }
            String code = candidate.trim();
            Optional<Tenant> inDb = findTenantByIdOrCode(code);
            if (inDb.isPresent()) {
                return inDb.get().getCode();
            }
            return code;
        }
        return null;
    }

    private Optional<Tenant> findTenantByIdOrCode(String identifier) {
        // If numeric, try by ID first
        if (identifier.matches("\\d+")) {
            try {
                Long id = Long.parseLong(identifier);
                Optional<Tenant> byId = tenantRepository.findById(id);
                if (byId.isPresent()) {
                    return byId;
                }
            } catch (NumberFormatException ignored) {
            }
        }
        return tenantRepository.findByCode(identifier);
    }
}
