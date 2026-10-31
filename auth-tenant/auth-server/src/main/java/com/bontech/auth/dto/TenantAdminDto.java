package com.bontech.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.Set;

public final class TenantAdminDto {
    private TenantAdminDto() {}

    public record UserCreateRequest(@NotBlank String username, @NotBlank String password, boolean systemUser, @NotNull Long tenantId, Set<Long> roleIds) {}
    public record UserUpdateRequest(@NotBlank String username, boolean systemUser, Set<Long> roleIds) {}
    public record UserResponse(Long id, String username, Long tenantId, boolean enabled, boolean systemUser, Set<String> roles) {}
}
