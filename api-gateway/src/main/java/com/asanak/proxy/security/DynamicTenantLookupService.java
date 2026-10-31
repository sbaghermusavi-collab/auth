package com.asanak.proxy.security;

import com.asanak.proxy.entity.GatewayTenant;
import com.asanak.proxy.repository.GatewayTenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class DynamicTenantLookupService {

    private final GatewayTenantRepository tenantRepository;

    // Fast memory caches for high-throughput Gateway routing
    private final Map<String, String> hostToTenantCodeCache = new ConcurrentHashMap<>();
    private final Map<String, String> idToTenantCodeCache = new ConcurrentHashMap<>();

    @EventListener(ApplicationReadyEvent.class)
    public void onStartup() {
        refreshCache();
    }

    @Scheduled(fixedDelay = 60_000)
    public void scheduledRefresh() {
        refreshCache();
    }

    public synchronized void refreshCache() {
        try {
            List<GatewayTenant> tenants = tenantRepository.findAll();
            Map<String, String> newHostMap = new ConcurrentHashMap<>();
            Map<String, String> newIdMap = new ConcurrentHashMap<>();

            for (GatewayTenant t : tenants) {
                if (!t.isActive() || t.getCode() == null || t.getCode().isBlank()) {
                    continue;
                }
                String code = t.getCode().trim().toLowerCase(Locale.ROOT);
                if (t.getId() != null) {
                    newIdMap.put(t.getId().toString(), code);
                }

                String baseUrl = t.getBaseUrl();
                if (baseUrl != null && !baseUrl.isBlank()) {
                    try {
                        String clean = baseUrl.trim();
                        if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
                            clean = "http://" + clean;
                        }
                        URI uri = URI.create(clean);
                        String host = uri.getHost();
                        if (host != null && !host.isBlank()) {
                            host = host.toLowerCase(Locale.ROOT);
                            newHostMap.put(host, code);
                            // Also map admin.<host> to this tenant
                            if (!host.startsWith("admin.")) {
                                newHostMap.put("admin." + host, code);
                            }
                        }
                    } catch (Exception e) {
                        log.debug("Could not parse tenant baseUrl '{}': {}", baseUrl, e.getMessage());
                    }
                }
            }

            hostToTenantCodeCache.clear();
            hostToTenantCodeCache.putAll(newHostMap);
            idToTenantCodeCache.clear();
            idToTenantCodeCache.putAll(newIdMap);

            log.info("[DynamicTenantLookupService] Loaded {} tenants into Gateway cache. Distinct host patterns: {}",
                    tenants.size(), hostToTenantCodeCache.size());
        } catch (Exception e) {
            log.warn("[DynamicTenantLookupService] Failed to refresh tenant cache from database: {}", e.getMessage());
        }
    }

    /**
     * Resolves tenant code dynamically from incoming Host header.
     */
    public String resolveTenantCodeFromHost(String rawHost) {
        if (rawHost == null || rawHost.isBlank()) {
            return "default";
        }
        String clean = rawHost.toLowerCase(Locale.ROOT);
        if (clean.contains(":")) {
            clean = clean.split(":")[0].trim();
        }

        // Direct lookup from database cache
        String cached = hostToTenantCodeCache.get(clean);
        if (cached != null) {
            return cached;
        }

        // Strip admin. prefix if present and re-check
        if (clean.startsWith("admin.")) {
            String parent = clean.substring("admin.".length());
            String parentCached = hostToTenantCodeCache.get(parent);
            if (parentCached != null) {
                return parentCached;
            }
        }

        // Localhost fallbacks
        if (clean.equals("localhost") || clean.equals("127.0.0.1") || clean.contains("bagherlocal")) {
            return "default";
        }

        // Dynamic prefix fallback if host pattern like "tenantcode.domain.com"
        String firstPart = clean.split("\\.")[0].trim();
        if (!firstPart.isBlank() && !firstPart.equals("www") && !firstPart.equals("api") && !firstPart.equals("admin")) {
            return firstPart;
        }

        return "default";
    }

    /**
     * Normalizes tenant code or numeric ID dynamically to the official tenant code from DB.
     */
    public String normalizeTenant(String raw) {
        if (raw == null || raw.isBlank()) {
            return "default";
        }
        String s = raw.trim().toLowerCase(Locale.ROOT);
        String mapped = idToTenantCodeCache.get(s);
        if (mapped != null) {
            return mapped;
        }
        return s;
    }

    /**
     * Checks if a host is allowed based on known tenant domains or local patterns.
     */
    public boolean isHostAllowed(String rawHost) {
        if (rawHost == null || rawHost.isBlank()) {
            return false;
        }
        String clean = rawHost.toLowerCase(Locale.ROOT);
        if (clean.contains(":")) {
            clean = clean.split(":")[0].trim();
        }

        if (clean.equals("localhost") || clean.equals("127.0.0.1") || clean.equals("host.docker.internal") ||
                clean.endsWith(".local") || clean.endsWith(".ir")) {
            return true;
        }

        return hostToTenantCodeCache.containsKey(clean);
    }
}
