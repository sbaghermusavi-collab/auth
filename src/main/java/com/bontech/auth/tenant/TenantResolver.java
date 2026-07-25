package com.bontech.auth.tenant;

import com.bontech.auth.entity.Tenant;
import com.bontech.auth.repository.TenantRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TenantResolver {
    private final TenantRepository tenantRepository;

    public Tenant getDefaultTenant() {
        return tenantRepository.findByCode("default")
                .or(() -> tenantRepository.findById(1L))
                .orElseGet(() -> tenantRepository.save(Tenant.builder()
                        .code("default")
                        .name("default")
                        .baseUrl("https://default.example.com")
                        .build()));
    }

    public Long resolveTenantId(HttpServletRequest request) {
        String headerValue = request.getHeader("X-TENANT-ID");
        if (headerValue == null || headerValue.isBlank()) {
            headerValue = request.getHeader("X-Actor-Tenant-Id");
        }
        if (headerValue == null || headerValue.isBlank()) {
            return getDefaultTenant().getId();
        }

        try {
            Long tenantId = Long.parseLong(headerValue.trim());
            if (tenantRepository.existsById(tenantId)) {
                return tenantId;
            }
            return getDefaultTenant().getId();
        } catch (NumberFormatException e) {
            String codeOrName = headerValue.trim();
            return tenantRepository.findByCode(codeOrName)
                    .map(Tenant::getId)
                    .orElseGet(() -> getDefaultTenant().getId());
        }
    }
}
