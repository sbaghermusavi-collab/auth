package com.bontech.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.Set;

public final class AdminDto {
    private AdminDto() {}

    public record TenantCreateRequest(@NotBlank String code, @NotBlank String name, @NotBlank String baseUrl) {}
    public record TenantResponse(Long id, String code, String name, String baseUrl) {}

    public record PermissionCreateRequest(@NotBlank String code,
                                          @NotBlank String description,
                                          @NotNull Long tenantId,
                                          Boolean active) {}
    public record PermissionResponse(Long id, String code, String description, Long tenantId, boolean active) {}

    public record RoleCreateRequest(@NotBlank String code, String name, String description, Long tenantId, Boolean isDefault, Set<Long> permissionIds) {}
    public record RoleResponse(Long id, String code, String name, String description, Long tenantId, boolean isDefault, Set<String> permissions, Set<String> groupCodes) {}

    public record RoleGroupAttachResponse(int added, int skipped, String reason) {}

    public record PermissionGroupCreateRequest(@NotBlank String code,
                                               @NotBlank String name,
                                               String description,
                                               Long tenantId,
                                               Set<Long> permissionIds) {}
    public record PermissionGroupResponse(Long id, String code, String name, String description, Long tenantId, Set<String> permissions) {}

    public record TenantDefaultRoleRequest(@NotNull Long defaultRoleId) {}
    public record TenantEntitlementResponse(Long tenantId, Set<String> permissions, Set<String> permissionGroups) {}

    public record UserStatusUpdateRequest(@NotNull Boolean enabled) {}
    public record UserCreateAdminRequest(@NotBlank String username, String password, Long tenantId, String phoneNumber, Set<String> roles) {}
    public record UserDetailResponse(Long id, String username, Long tenantId, String phoneNumber, boolean enabled, boolean systemUser, Set<String> roles) {}
}
