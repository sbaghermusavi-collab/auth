package com.bontech.auth.tenantmanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Builder;

import java.time.Instant;
import java.util.List;
import java.util.Set;

public class TenantDto {

    public record TenantResponse(
            Long id,
            String code,
            String name,
            String baseUrl,
            String description,
            String logoUrl,
            String faviconUrl,
            String primaryColor,
            String secondaryColor,
            List<String> activeModules,
            String themeConfig,
            String title,
            String themeTone,
            String animationType,
            String authBg,
            boolean otpEnabled,
            boolean passwordEnabled,
            boolean captchaEnabled,
            boolean active,
            String adminUsername,
            Instant createdAt,
            Instant updatedAt
    ) {}

    public record TenantCreateRequest(
            @NotBlank(message = "کد تننت الزامی است")
            @Pattern(regexp = "^[a-z0-9_-]{2,32}$", message = "کد تننت باید شامل حروف کوچک انگلیسی، اعداد یا خط تیره باشد")
            String code,

            @NotBlank(message = "نام تننت الزامی است")
            String name,

            @NotBlank(message = "آدرس دامنه پایه الزامی است")
            String baseUrl,

            String description,
            String primaryColor,
            String secondaryColor,
            List<String> activeModules,
            String themeConfig,
            String title,
            String themeTone,
            String animationType,
            String authBg,
            Boolean otpEnabled,
            Boolean passwordEnabled,
            Boolean captchaEnabled,

            // Optional initial tenant admin details
            String adminUsername,
            String adminPassword,
            String adminEmail,
            String adminFullName
    ) {}

    public record TenantUpdateRequest(
            @NotBlank(message = "نام تننت الزامی است")
            String name,

            @NotBlank(message = "آدرس دامنه پایه الزامی است")
            String baseUrl,

            String description,
            String primaryColor,
            String secondaryColor,
            List<String> activeModules,
            String themeConfig,
            String title,
            String themeTone,
            String animationType,
            String authBg,
            Boolean otpEnabled,
            Boolean passwordEnabled,
            Boolean captchaEnabled,
            Boolean active,
            String adminUsername
    ) {}

    public record TenantCloneRequest(
            Long sourceTenantId,

            @NotBlank(message = "کد تننت جدید الزامی است")
            @Pattern(regexp = "^[a-z0-9_-]{2,32}$", message = "کد تننت باید شامل حروف کوچک انگلیسی، اعداد یا خط تیره باشد")
            String targetCode,

            @NotBlank(message = "نام تننت جدید الزامی است")
            String targetName,

            @NotBlank(message = "آدرس دامنه پایه تننت جدید الزامی است")
            String targetBaseUrl,

            String description,
            Boolean copyBranding,
            Boolean copyModules,
            Boolean copyRoles,

            // Optional new admin account for the cloned tenant
            String adminUsername,
            String adminPassword,
            String adminEmail,
            String adminFullName
    ) {}

    public record ModuleInfoDto(
            String code,
            String name,
            String description,
            String icon,
            String category,
            boolean defaultEnabled
    ) {}

    public record ImpersonateTenantRequest(
            String targetUsername
    ) {}

    public record ImpersonateTenantResponse(
            String accessToken,
            String tokenType,
            long expiresIn,
            String targetUsername,
            String tenantCode,
            String redirectUrl
    ) {}
}
