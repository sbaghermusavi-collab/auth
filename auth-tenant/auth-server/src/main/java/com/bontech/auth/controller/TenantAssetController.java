package com.bontech.auth.controller;

import com.bontech.auth.config.AppProperties;
import com.bontech.auth.tenant.TenantConfigCacheService;
import com.bontech.auth.tenant.TenantResolutionFilter;
import com.bontech.auth.tenant.TenantUiConfig;
import com.bontech.auth.tenantmanagement.storage.TenantAssetStorageService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Serves tenant-specific static resources (theme CSS and logo) from
 * {@code classpath:/static/resources/tenants/<tenant-code>/} or dynamically generated from
 * in-memory DB configuration cache / uploaded disk files.
 */
@RestController
@RequiredArgsConstructor
@Slf4j
public class TenantAssetController {

    private static final String BASE = "static/resources/tenants/";
    private static final Pattern SAFE_CODE = Pattern.compile("[a-z0-9_-]{1,64}");
    private static final Map<String, MediaType> LOGO_TYPES = Map.of(
            "logo.svg", MediaType.valueOf("image/svg+xml"),
            "logo.png", MediaType.IMAGE_PNG,
            "logo.jpg", MediaType.IMAGE_JPEG);

    private final AppProperties properties;
    private final TenantConfigCacheService tenantConfigCacheService;
    private final TenantAssetStorageService assetStorageService;

    @GetMapping("/tenant-assets/theme.css")
    public ResponseEntity<Resource> theme(HttpServletRequest request) {
        return serveTheme(request, resolveCode(request));
    }

    @GetMapping("/tenant-assets/{tenantId}/theme.css")
    public ResponseEntity<Resource> themeByPath(@PathVariable("tenantId") String tenantId, HttpServletRequest request) {
        String code = normalizeCode(tenantId);
        return serveTheme(request, code);
    }

    @GetMapping("/tenant-assets/logo")
    public ResponseEntity<Resource> logo(HttpServletRequest request) {
        return serveLogo(request, resolveCode(request));
    }

    @GetMapping("/tenant-assets/{tenantId}/logo")
    public ResponseEntity<Resource> logoByPath(@PathVariable("tenantId") String tenantId, HttpServletRequest request) {
        return serveLogo(request, normalizeCode(tenantId));
    }

    @GetMapping("/tenant-assets/animation.js")
    public ResponseEntity<Resource> animation(HttpServletRequest request) {
        return serveAnimation(request, resolveCode(request));
    }

    @GetMapping("/tenant-assets/{tenantId}/animation.js")
    public ResponseEntity<Resource> animationByPath(@PathVariable("tenantId") String tenantId, HttpServletRequest request) {
        return serveAnimation(request, normalizeCode(tenantId));
    }

    private ResponseEntity<Resource> serveAnimation(HttpServletRequest request, String code) {
        // 1. Try static file in classpath: static/resources/tenants/{code}/animation.js
        Resource res = new ClassPathResource(BASE + code + "/animation.js");
        if (res.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.valueOf("application/javascript;charset=UTF-8"))
                    .header(HttpHeaders.VARY, TenantResolutionFilter.TENANT_HEADER)
                    .header("X-Tenant-Asset", code)
                    .cacheControl(CacheControl.noCache())
                    .body(res);
        }

        // 2. Try default tenant animation.js
        String defCode = defaultCode();
        Resource defRes = new ClassPathResource(BASE + defCode + "/animation.js");
        if (defRes.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.valueOf("application/javascript;charset=UTF-8"))
                    .header(HttpHeaders.VARY, TenantResolutionFilter.TENANT_HEADER)
                    .header("X-Tenant-Asset", defCode)
                    .cacheControl(CacheControl.noCache())
                    .body(defRes);
        }

        return ResponseEntity.notFound().build();
    }

    private ResponseEntity<Resource> serveTheme(HttpServletRequest request, String code) {
        // 1. Try static file in classpath: static/resources/tenants/{code}/theme.css
        Resource res = new ClassPathResource(BASE + code + "/theme.css");
        if (res.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.valueOf("text/css;charset=UTF-8"))
                    .header(HttpHeaders.VARY, TenantResolutionFilter.TENANT_HEADER)
                    .header("X-Tenant-Asset", code)
                    .cacheControl(CacheControl.noCache())
                    .body(res);
        }

        // 2. Generate dynamic CSS from RAM cached tenant UI config
        TenantUiConfig uiConfig = tenantConfigCacheService.getUiConfigByCode(code);
        String primary = uiConfig.getPrimaryColor() != null ? uiConfig.getPrimaryColor() : "#0C747C";
        String secondary = uiConfig.getSecondaryColor() != null ? uiConfig.getSecondaryColor() : "#FABD09";
        String authBg = uiConfig.getAuthBg() != null ? uiConfig.getAuthBg() : "#072b2f";

        String cssContent = String.format(
                "/* Dynamically generated tenant theme: %s */\n:root {\n  --accent: %s !important;\n  --auth-c1: %s !important;\n  --gold: %s !important;\n  --auth-c2: %s !important;\n  --auth-bg: %s !important;\n}\n",
                code, primary, primary, secondary, secondary, authBg
        );

        Resource dynamicResource = new ByteArrayResource(cssContent.getBytes(StandardCharsets.UTF_8));
        return ResponseEntity.ok()
                .contentType(MediaType.valueOf("text/css;charset=UTF-8"))
                .header(HttpHeaders.VARY, TenantResolutionFilter.TENANT_HEADER)
                .header("X-Tenant-Asset", code)
                .cacheControl(CacheControl.noCache())
                .body(dynamicResource);
    }

    private ResponseEntity<Resource> serveLogo(HttpServletRequest request, String code) {
        // 1. Try uploaded file in TenantAssetStorageService (/tmp/tenants/{code}/logo.*)
        Path uploadedLogo = assetStorageService.getLogoPath(code);
        if (uploadedLogo != null) {
            String filename = uploadedLogo.getFileName().toString().toLowerCase(Locale.ROOT);
            MediaType mediaType = filename.endsWith(".svg") ? MediaType.valueOf("image/svg+xml")
                    : filename.endsWith(".png") ? MediaType.IMAGE_PNG : MediaType.IMAGE_JPEG;
            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(HttpHeaders.VARY, TenantResolutionFilter.TENANT_HEADER)
                    .header("X-Tenant-Asset", code)
                    .cacheControl(CacheControl.noCache())
                    .body(new FileSystemResource(uploadedLogo.toFile()));
        }

        // 2. Try classpath static assets for given tenant
        for (var entry : LOGO_TYPES.entrySet()) {
            Resource res = new ClassPathResource(BASE + code + "/" + entry.getKey());
            if (res.exists()) {
                return ResponseEntity.ok()
                        .contentType(entry.getValue())
                        .header(HttpHeaders.VARY, TenantResolutionFilter.TENANT_HEADER)
                        .header("X-Tenant-Asset", code)
                        .cacheControl(CacheControl.noCache())
                        .body(res);
            }
        }

        // 3. Fallback to default tenant logo
        String defCode = defaultCode();
        Path defaultUploaded = assetStorageService.getLogoPath(defCode);
        if (defaultUploaded != null) {
            String filename = defaultUploaded.getFileName().toString().toLowerCase(Locale.ROOT);
            MediaType mediaType = filename.endsWith(".svg") ? MediaType.valueOf("image/svg+xml")
                    : filename.endsWith(".png") ? MediaType.IMAGE_PNG : MediaType.IMAGE_JPEG;
            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(HttpHeaders.VARY, TenantResolutionFilter.TENANT_HEADER)
                    .header("X-Tenant-Asset", defCode)
                    .cacheControl(CacheControl.noCache())
                    .body(new FileSystemResource(defaultUploaded.toFile()));
        }

        for (var entry : LOGO_TYPES.entrySet()) {
            Resource res = new ClassPathResource(BASE + defCode + "/" + entry.getKey());
            if (res.exists()) {
                return ResponseEntity.ok()
                        .contentType(entry.getValue())
                        .header(HttpHeaders.VARY, TenantResolutionFilter.TENANT_HEADER)
                        .header("X-Tenant-Asset", defCode)
                        .cacheControl(CacheControl.noCache())
                        .body(res);
            }
        }

        return ResponseEntity.notFound().build();
    }

    private String resolveCode(HttpServletRequest request) {
        String header = request.getHeader(TenantResolutionFilter.TENANT_HEADER);
        if (header != null && !header.isBlank()) {
            return normalizeCode(header);
        }
        Object attr = request.getAttribute(TenantResolutionFilter.TENANT_CODE_ATTR);
        if (attr instanceof String s && !s.isBlank()) {
            return normalizeCode(s);
        }
        return defaultCode();
    }

    private String normalizeCode(String code) {
        if (code == null) return defaultCode();
        String c = code.trim().toLowerCase(Locale.ROOT);
        return SAFE_CODE.matcher(c).matches() ? c : defaultCode();
    }

    private String defaultCode() {
        String d = properties.getDefaultTenant();
        return d != null && SAFE_CODE.matcher(d.trim().toLowerCase(Locale.ROOT)).matches() ? d.trim().toLowerCase(Locale.ROOT) : "default";
    }
}
