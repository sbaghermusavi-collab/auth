package com.bontech.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.Set;

public final class AdminDto {
    private AdminDto() {}

    public record TenantCreateRequest(@NotBlank String code, @NotBlank String name, @NotBlank String baseUrl, Long sourceTenantId) {}
    public record TenantResponse(Long id, String code, String name, String baseUrl) {}

    public record AssignTenantAdminRequest(Long tenantId, @NotBlank String username, @NotBlank String password, Boolean systemUser) {}

    public record PermissionCreateRequest(@NotBlank String code,
                                          @NotBlank String description,
                                          Long tenantId,
                                          Boolean active) {}
    public record PermissionResponse(Long id, String code, String description, Long tenantId, boolean active) {}

    public record RoleCreateRequest(@NotBlank String code, Long tenantId, Set<Long> permissionIds) {}
    public record RoleResponse(Long id, String code, Long tenantId, Set<String> permissions) {}
}
