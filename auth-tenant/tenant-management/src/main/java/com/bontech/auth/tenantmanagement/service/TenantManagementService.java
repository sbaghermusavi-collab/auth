package com.bontech.auth.tenantmanagement.service;

import com.bontech.auth.entity.Tenant;
import com.bontech.auth.repository.TenantRepository;
import com.bontech.auth.tenantmanagement.dto.TenantDto.*;
import com.bontech.auth.tenantmanagement.storage.TenantAssetStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TenantManagementService {

    private final TenantRepository tenantRepository;
    private final TenantAssetStorageService assetStorageService;

    @Autowired(required = false)
    private TenantAdminProvisioner tenantAdminProvisioner;

    @Autowired(required = false)
    private TenantConfigChangeNotifier configChangeNotifier;

    private static final List<ModuleInfoDto> AVAILABLE_MODULES = List.of(
            new ModuleInfoDto("phonebook", "دفترچه تلفن و مخاطبین", "مدیریت گروه‌ها، مخاطبین، ورود اکسل و گزارشات تماس", "RiContactsBook3Line", "core", true),
            new ModuleInfoDto("sms_single", "ارسال تکی و وب‌پنل", "ارسال پیامک تکی، یادآوری و پاسخگوی خودکار", "RiChat1Line", "core", true),
            new ModuleInfoDto("sms_bulk", "ارسال گروهی و انبوه", "ارسال نظیر به نظیر، پیامک هوشمند و ارسال به بانک شماره", "RiChatUploadLine", "marketing", true),
            new ModuleInfoDto("reports", "گزارشات و تحلیل ترافیک", "گزارش پیام‌های ارسالی، دریافتی، دلیوری و تحلیل آماری", "RiBarChartLine", "analytics", true),
            new ModuleInfoDto("webservice", "وب‌سرویس و کلیدهای API", "مدیریت کلیدهای دسترسی API، وب‌هوک‌ها و قالب‌های پیامکی", "RiCodeSSlashLine", "developer", true),
            new ModuleInfoDto("finance", "مدیریت مالی و شارژ", "گزارش تراکنش‌ها، افزایش اعتبار آنلاین و صورتحساب", "RiWallet3Line", "billing", true),
            new ModuleInfoDto("ticketing", "پشتیبانی و تیکتینگ", "سامانه پشتیبانی آنلاین، ارسال تیکت و گفتگوی کارشناس", "RiCustomerService2Line", "support", false)
    );

    @Transactional(readOnly = true)
    public List<TenantResponse> getAllTenants() {
        return tenantRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TenantResponse getTenantById(Long id) {
        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("مستأجر با شناسه " + id + " یافت نشد"));
        return toResponse(tenant);
    }

    @Transactional(readOnly = true)
    public TenantResponse getTenantByCode(String code) {
        Tenant tenant = tenantRepository.findByCode(code.trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new IllegalArgumentException("مستأجر با کد " + code + " یافت نشد"));
        return toResponse(tenant);
    }

    @Transactional
    public TenantResponse createTenant(TenantCreateRequest request, String createdBy) {
        String code = request.code().trim().toLowerCase(Locale.ROOT);
        if (tenantRepository.findByCode(code).isPresent()) {
            throw new IllegalArgumentException("کد تننت '" + code + "' تکراری است");
        }
        if (tenantRepository.findByBaseUrl(request.baseUrl().trim()).isPresent()) {
            throw new IllegalArgumentException("دامنه '" + request.baseUrl() + "' قبلاً ثبت شده است");
        }

        String modules = request.activeModules() != null && !request.activeModules().isEmpty()
                ? String.join(",", request.activeModules())
                : "phonebook,sms,reports,webservice";

        String primaryColor = (request.primaryColor() != null && !request.primaryColor().isBlank())
                ? request.primaryColor().trim() : "#2563eb";
        String secondaryColor = (request.secondaryColor() != null && !request.secondaryColor().isBlank())
                ? request.secondaryColor().trim() : "#1e40af";

        Tenant tenant = Tenant.builder()
                .code(code)
                .name(request.name().trim())
                .baseUrl(request.baseUrl().trim())
                .description(request.description())
                .primaryColor(primaryColor)
                .secondaryColor(secondaryColor)
                .activeModules(modules)
                .themeConfig(request.themeConfig())
                .title(request.title())
                .themeTone(request.themeTone() != null ? request.themeTone() : "dark")
                .animationType(request.animationType() != null ? request.animationType() : "orbit")
                .authBg(request.authBg() != null ? request.authBg() : "#072b2f")
                .otpEnabled(request.otpEnabled() != null ? request.otpEnabled() : true)
                .passwordEnabled(request.passwordEnabled() != null ? request.passwordEnabled() : true)
                .captchaEnabled(request.captchaEnabled() != null ? request.captchaEnabled() : false)
                .active(true)
                .adminUsername(request.adminUsername())
                .createdBy(createdBy != null ? createdBy : "system")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .version(0L)
                .build();

        Tenant savedTenant = tenantRepository.save(tenant);
        log.info("[TenantManagement] Created new tenant '{}' (id: {})", savedTenant.getCode(), savedTenant.getId());

        if (configChangeNotifier != null) {
            configChangeNotifier.onTenantConfigChanged(savedTenant.getCode());
        }

        // Provision initial admin if requested
        if (request.adminUsername() != null && !request.adminUsername().isBlank()) {
            if (tenantAdminProvisioner != null) {
                tenantAdminProvisioner.provisionTenantAdmin(
                        savedTenant.getId(),
                        savedTenant.getCode(),
                        request.adminUsername().trim(),
                        request.adminPassword() != null ? request.adminPassword() : "password",
                        request.adminEmail(),
                        request.adminFullName()
                );
            }
        }

        return toResponse(savedTenant);
    }

    @Transactional
    public TenantResponse updateTenant(Long id, TenantUpdateRequest request, String updatedBy) {
        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("مستأجر با شناسه " + id + " یافت نشد"));

        tenant.setName(request.name().trim());
        tenant.setBaseUrl(request.baseUrl().trim());
        tenant.setDescription(request.description());

        if (request.primaryColor() != null && !request.primaryColor().isBlank()) {
            tenant.setPrimaryColor(request.primaryColor().trim());
        }
        if (request.secondaryColor() != null && !request.secondaryColor().isBlank()) {
            tenant.setSecondaryColor(request.secondaryColor().trim());
        }
        if (request.activeModules() != null) {
            tenant.setActiveModules(String.join(",", request.activeModules()));
        }
        if (request.themeConfig() != null) {
            tenant.setThemeConfig(request.themeConfig());
        }
        if (request.title() != null) {
            tenant.setTitle(request.title());
        }
        if (request.themeTone() != null) {
            tenant.setThemeTone(request.themeTone());
        }
        if (request.animationType() != null) {
            tenant.setAnimationType(request.animationType());
        }
        if (request.authBg() != null) {
            tenant.setAuthBg(request.authBg());
        }
        if (request.otpEnabled() != null) {
            tenant.setOtpEnabled(request.otpEnabled());
        }
        if (request.passwordEnabled() != null) {
            tenant.setPasswordEnabled(request.passwordEnabled());
        }
        if (request.captchaEnabled() != null) {
            tenant.setCaptchaEnabled(request.captchaEnabled());
        }
        if (request.active() != null) {
            tenant.setActive(request.active());
        }
        if (request.adminUsername() != null) {
            tenant.setAdminUsername(request.adminUsername());
        }

        tenant.setUpdatedBy(updatedBy != null ? updatedBy : "system");
        tenant.setUpdatedAt(Instant.now());

        Tenant updated = tenantRepository.save(tenant);
        log.info("[TenantManagement] Updated tenant '{}' (id: {})", updated.getCode(), updated.getId());

        if (configChangeNotifier != null) {
            configChangeNotifier.onTenantConfigChanged(updated.getCode());
        }
        return toResponse(updated);
    }

    @Transactional
    public void deleteTenant(Long id) {
        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("مستأجر با شناسه " + id + " یافت نشد"));

        if ("default".equalsIgnoreCase(tenant.getCode()) || id.equals(1L)) {
            throw new IllegalArgumentException("تننت پیش‌فرض سیستم قابل حذف نیست");
        }

        String code = tenant.getCode();
        tenantRepository.delete(tenant);
        log.info("[TenantManagement] Deleted tenant '{}' (id: {})", tenant.getCode(), id);

        if (configChangeNotifier != null) {
            configChangeNotifier.onTenantConfigChanged(code);
        }
    }

    @Transactional
    public TenantResponse cloneTenant(Long sourceTenantId, TenantCloneRequest request, String createdBy) {
        Tenant source = tenantRepository.findById(sourceTenantId)
                .orElseThrow(() -> new IllegalArgumentException("مستأجر مبدا با شناسه " + sourceTenantId + " یافت نشد"));

        String targetCode = request.targetCode().trim().toLowerCase(Locale.ROOT);
        if (tenantRepository.findByCode(targetCode).isPresent()) {
            throw new IllegalArgumentException("کد تننت جدید '" + targetCode + "' تکراری است");
        }
        if (tenantRepository.findByBaseUrl(request.targetBaseUrl().trim()).isPresent()) {
            throw new IllegalArgumentException("دامنه تننت جدید '" + request.targetBaseUrl() + "' قبلاً ثبت شده است");
        }

        boolean copyBranding = request.copyBranding() == null || request.copyBranding();
        boolean copyModules = request.copyModules() == null || request.copyModules();

        Tenant clone = Tenant.builder()
                .code(targetCode)
                .name(request.targetName().trim())
                .baseUrl(request.targetBaseUrl().trim())
                .description(request.description() != null ? request.description() : "کلون شده از " + source.getName())
                .primaryColor(copyBranding ? source.getPrimaryColor() : "#2563eb")
                .secondaryColor(copyBranding ? source.getSecondaryColor() : "#1e40af")
                .logoUrl(copyBranding ? source.getLogoUrl() : null)
                .faviconUrl(copyBranding ? source.getFaviconUrl() : null)
                .themeConfig(copyBranding ? source.getThemeConfig() : null)
                .title(copyBranding ? source.getTitle() : null)
                .themeTone(copyBranding ? source.getThemeTone() : "dark")
                .animationType(copyBranding ? source.getAnimationType() : "orbit")
                .authBg(copyBranding ? source.getAuthBg() : "#072b2f")
                .otpEnabled(source.isOtpEnabled())
                .passwordEnabled(source.isPasswordEnabled())
                .captchaEnabled(source.isCaptchaEnabled())
                .activeModules(copyModules ? source.getActiveModules() : "phonebook,sms,reports,webservice")
                .active(true)
                .adminUsername(request.adminUsername())
                .createdBy(createdBy != null ? createdBy : "system")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .version(0L)
                .build();

        Tenant savedClone = tenantRepository.save(clone);
        log.info("[TenantManagement] Successfully cloned tenant '{}' from source '{}'", savedClone.getCode(), source.getCode());

        // Clone roles & permissions if requested
        if (tenantAdminProvisioner != null) {
            Set<String> modules = Arrays.stream(savedClone.getActiveModules().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toSet());

            if (request.copyRoles() == null || request.copyRoles()) {
                tenantAdminProvisioner.cloneTenantRolesAndPermissions(source.getId(), savedClone.getId(), modules);
            }

            if (request.adminUsername() != null && !request.adminUsername().isBlank()) {
                tenantAdminProvisioner.provisionTenantAdmin(
                        savedClone.getId(),
                        savedClone.getCode(),
                        request.adminUsername().trim(),
                        request.adminPassword() != null ? request.adminPassword() : "password",
                        request.adminEmail(),
                        request.adminFullName()
                );
            }
        }

        if (configChangeNotifier != null) {
            configChangeNotifier.onTenantConfigChanged(savedClone.getCode());
        }

        return toResponse(savedClone);
    }

    @Transactional
    public String uploadLogo(Long id, MultipartFile file) throws IOException {
        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("مستأجر با شناسه " + id + " یافت نشد"));

        String logoUrl = assetStorageService.storeLogo(tenant.getCode(), file);
        tenant.setLogoUrl(logoUrl);
        tenant.setUpdatedAt(Instant.now());
        tenantRepository.save(tenant);

        log.info("[TenantManagement] Updated logo for tenant '{}': {}", tenant.getCode(), logoUrl);

        if (configChangeNotifier != null) {
            configChangeNotifier.onTenantConfigChanged(tenant.getCode());
        }
        return logoUrl;
    }

    public ImpersonateTenantResponse impersonateTenant(Long id, ImpersonateTenantRequest request, String adminUsername) {
        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("مستأجر با شناسه " + id + " یافت نشد"));

        String targetUser = request.targetUsername();
        if (targetUser == null || targetUser.isBlank()) {
            targetUser = tenant.getAdminUsername();
        }
        if (targetUser == null || targetUser.isBlank()) {
            throw new IllegalArgumentException("کاربری برای جانشینی در این مستأجر مشخص نشده است");
        }

        if (tenantAdminProvisioner == null) {
            throw new IllegalStateException("سیستم صدور توکن جانشینی فعال نیست");
        }

        String token = tenantAdminProvisioner.generateImpersonationToken(tenant.getId(), targetUser, adminUsername);

        String redirectUrl = tenant.getBaseUrl();
        if (redirectUrl == null || redirectUrl.isBlank()) {
            redirectUrl = "/";
        }

        return new ImpersonateTenantResponse(token, "Bearer", 3600L, targetUser, tenant.getCode(), redirectUrl);
    }

    public List<ModuleInfoDto> getAvailableModules() {
        return AVAILABLE_MODULES;
    }

    private TenantResponse toResponse(Tenant tenant) {
        List<String> modules = (tenant.getActiveModules() != null && !tenant.getActiveModules().isBlank())
                ? Arrays.stream(tenant.getActiveModules().split(",")).map(String::trim).toList()
                : List.of("phonebook", "sms", "reports", "webservice");

        return new TenantResponse(
                tenant.getId(),
                tenant.getCode(),
                tenant.getName(),
                tenant.getBaseUrl(),
                tenant.getDescription(),
                tenant.getLogoUrl(),
                tenant.getFaviconUrl(),
                tenant.getPrimaryColor() != null ? tenant.getPrimaryColor() : "#2563eb",
                tenant.getSecondaryColor() != null ? tenant.getSecondaryColor() : "#1e40af",
                modules,
                tenant.getThemeConfig(),
                tenant.getTitle(),
                tenant.getThemeTone() != null ? tenant.getThemeTone() : "dark",
                tenant.getAnimationType() != null ? tenant.getAnimationType() : "orbit",
                tenant.getAuthBg() != null ? tenant.getAuthBg() : "#072b2f",
                tenant.isOtpEnabled(),
                tenant.isPasswordEnabled(),
                tenant.isCaptchaEnabled(),
                tenant.isActive(),
                tenant.getAdminUsername(),
                tenant.getCreatedAt(),
                tenant.getUpdatedAt()
        );
    }
}
