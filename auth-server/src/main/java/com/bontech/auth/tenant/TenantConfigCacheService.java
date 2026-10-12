package com.bontech.auth.tenant;

import com.bontech.auth.config.AppProperties;
import com.bontech.auth.entity.Tenant;
import com.bontech.auth.repository.TenantRepository;
import com.bontech.auth.tenantmanagement.service.TenantConfigChangeNotifier;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class TenantConfigCacheService implements TenantConfigChangeNotifier {

    private final TenantRepository tenantRepository;
    private final AppProperties properties;

    @Override
    public void onTenantConfigChanged(String tenantCode) {
        refresh(tenantCode);
    }

    @Override
    public void onTenantConfigChanged(Long tenantId) {
        refresh(tenantId);
    }

    private final Map<String, TenantUiConfig> cacheByCode = new ConcurrentHashMap<>();
    private final Map<Long, TenantUiConfig> cacheById = new ConcurrentHashMap<>();

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        log.info("[TenantConfigCache] Application ready, pre-loading tenant configurations into RAM...");
        refreshAll();
    }

    public synchronized void refreshAll() {
        try {
            var tenants = tenantRepository.findAll();
            cacheByCode.clear();
            cacheById.clear();

            for (Tenant tenant : tenants) {
                TenantUiConfig config = mapToUiConfig(tenant);
                if (tenant.getCode() != null) {
                    cacheByCode.put(tenant.getCode().trim().toLowerCase(Locale.ROOT), config);
                }
                if (tenant.getId() != null) {
                    cacheById.put(tenant.getId(), config);
                }
            }
            log.info("[TenantConfigCache] Successfully loaded {} tenant configurations into RAM cache.", tenants.size());
        } catch (Exception e) {
            log.error("[TenantConfigCache] Error loading tenant configurations into RAM: {}", e.getMessage(), e);
        }
    }

    public void refresh(String tenantCode) {
        if (tenantCode == null || tenantCode.isBlank()) {
            return;
        }
        String normalizedCode = tenantCode.trim().toLowerCase(Locale.ROOT);
        tenantRepository.findByCode(normalizedCode).ifPresentOrElse(tenant -> {
            TenantUiConfig config = mapToUiConfig(tenant);
            cacheByCode.put(normalizedCode, config);
            if (tenant.getId() != null) {
                cacheById.put(tenant.getId(), config);
            }
            log.info("[TenantConfigCache] Refreshed cache in RAM for tenant '{}'", normalizedCode);
        }, () -> {
            cacheByCode.remove(normalizedCode);
            log.warn("[TenantConfigCache] Tenant '{}' not found in DB, evicted from RAM cache", normalizedCode);
        });
    }

    public void refresh(Long tenantId) {
        if (tenantId == null) {
            return;
        }
        tenantRepository.findById(tenantId).ifPresentOrElse(tenant -> {
            TenantUiConfig config = mapToUiConfig(tenant);
            cacheById.put(tenantId, config);
            if (tenant.getCode() != null) {
                cacheByCode.put(tenant.getCode().trim().toLowerCase(Locale.ROOT), config);
            }
            log.info("[TenantConfigCache] Refreshed cache in RAM for tenant ID {}", tenantId);
        }, () -> {
            cacheById.remove(tenantId);
        });
    }

    public TenantUiConfig getUiConfigByCode(String tenantCode) {
        if (tenantCode != null && !tenantCode.isBlank()) {
            String normalizedCode = tenantCode.trim().toLowerCase(Locale.ROOT);
            TenantUiConfig cached = cacheByCode.get(normalizedCode);
            if (cached != null) {
                return cached;
            }
            // Lazy load from DB if not in cache yet
            var tenantOpt = tenantRepository.findByCode(normalizedCode);
            if (tenantOpt.isPresent()) {
                TenantUiConfig config = mapToUiConfig(tenantOpt.get());
                cacheByCode.put(normalizedCode, config);
                if (tenantOpt.get().getId() != null) {
                    cacheById.put(tenantOpt.get().getId(), config);
                }
                return config;
            }
        }
        return getDefaultUiConfig();
    }

    public TenantUiConfig getUiConfigById(Long tenantId) {
        if (tenantId != null) {
            TenantUiConfig cached = cacheById.get(tenantId);
            if (cached != null) {
                return cached;
            }
            var tenantOpt = tenantRepository.findById(tenantId);
            if (tenantOpt.isPresent()) {
                TenantUiConfig config = mapToUiConfig(tenantOpt.get());
                cacheById.put(tenantId, config);
                if (tenantOpt.get().getCode() != null) {
                    cacheByCode.put(tenantOpt.get().getCode().trim().toLowerCase(Locale.ROOT), config);
                }
                return config;
            }
        }
        return getDefaultUiConfig();
    }

    public TenantUiConfig resolveUiConfig(Tenant tenant, String requestedTenantCode) {
        if (requestedTenantCode != null && !requestedTenantCode.isBlank()) {
            String norm = requestedTenantCode.trim().toLowerCase(Locale.ROOT);
            TenantUiConfig cfg = cacheByCode.get(norm);
            if (cfg != null) {
                return cfg;
            }
        }
        if (tenant != null) {
            if (tenant.getId() != null && cacheById.containsKey(tenant.getId())) {
                return cacheById.get(tenant.getId());
            }
            if (tenant.getCode() != null && cacheByCode.containsKey(tenant.getCode().trim().toLowerCase(Locale.ROOT))) {
                return cacheByCode.get(tenant.getCode().trim().toLowerCase(Locale.ROOT));
            }
            return mapToUiConfig(tenant);
        }
        return getDefaultUiConfig();
    }

    public TenantUiConfig getDefaultUiConfig() {
        String defaultCode = properties.getDefaultTenant();
        if (defaultCode != null && !defaultCode.isBlank()) {
            String norm = defaultCode.trim().toLowerCase(Locale.ROOT);
            TenantUiConfig cached = cacheByCode.get(norm);
            if (cached != null) {
                return cached;
            }
        }

        var def = properties.getDefaultTenantConfig();
        return TenantUiConfig.builder()
                .brandName(def != null && def.getBrandName() != null ? def.getBrandName() : "آسانک")
                .title(def != null && def.getTitle() != null ? def.getTitle() : "آسانک — سامانه پیامک و ارتباطات")
                .logoUrl("/auth/tenant-assets/logo")
                .themeTone(def != null && def.getThemeTone() != null ? def.getThemeTone() : "dark")
                .animationType(def != null && def.getAnimationType() != null ? def.getAnimationType() : "orbit")
                .primaryColor(def != null && def.getPrimaryColor() != null ? def.getPrimaryColor() : "#0C747C")
                .secondaryColor(def != null && def.getSecondaryColor() != null ? def.getSecondaryColor() : "#FABD09")
                .authBg(def != null && def.getAuthBg() != null ? def.getAuthBg() : "#072b2f")
                .otpEnabled(def == null || def.isOtpEnabled())
                .passwordEnabled(def == null || def.isPasswordEnabled())
                .captchaEnabled(def != null && def.isCaptchaEnabled())
                .build();
    }

    public TenantUiConfig mapToUiConfig(Tenant tenant) {
        String code = tenant.getCode() != null ? tenant.getCode() : "default";
        String brand = tenant.getName() != null && !tenant.getName().isBlank() ? tenant.getName() : "آسانک";
        String title = tenant.getTitle() != null && !tenant.getTitle().isBlank()
                ? tenant.getTitle()
                : (brand + " — ورود، ثبت‌نام");

        return TenantUiConfig.builder()
                .brandName(brand)
                .title(title)
                .logoUrl("/auth/tenant-assets/" + code + "/logo")
                .themeTone(tenant.getThemeTone() != null ? tenant.getThemeTone() : "dark")
                .animationType(tenant.getAnimationType() != null ? tenant.getAnimationType() : "orbit")
                .primaryColor(tenant.getPrimaryColor() != null ? tenant.getPrimaryColor() : "#0C747C")
                .secondaryColor(tenant.getSecondaryColor() != null ? tenant.getSecondaryColor() : "#FABD09")
                .authBg(tenant.getAuthBg() != null ? tenant.getAuthBg() : "#072b2f")
                .otpEnabled(tenant.isOtpEnabled())
                .passwordEnabled(tenant.isPasswordEnabled())
                .captchaEnabled(tenant.isCaptchaEnabled())
                .build();
    }
}
