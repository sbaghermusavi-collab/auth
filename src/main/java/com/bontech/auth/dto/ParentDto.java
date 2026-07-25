package com.bontech.auth.dto;

import jakarta.validation.constraints.NotNull;
import java.util.Set;

public final class ParentDto {
    private ParentDto() {}

    public record AssignChildrenRequest(
            @NotNull Set<Long> childUserIds
    ) {}

    public record AssignChildRolesPermissionsRequest(
            Set<Long> roleIds,
            Set<Long> permissionIds
    ) {}

    public record ChildUserResponse(
            Long id,
            String username,
            Long tenantId,
            Long parentUserId,
            Set<String> roles,
            Set<String> permissions
    ) {}
}
