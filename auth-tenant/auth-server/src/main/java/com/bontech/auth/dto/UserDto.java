package com.bontech.auth.dto;

import java.util.List;

public final class UserDto {
    private UserDto() {}

    public record UserAuthzResponse(String username, String tenantId, String tenantName, List<String> roles, List<String> permissions) {}

    public record UserSummary(String username, String tenantName, boolean systemUser) {}

    public record RoleUsersResponse(String roleCode, List<UserSummary> users) {}

    public record PermissionUsersResponse(String permissionCode, List<UserSummary> users) {}
}
