package com.bontech.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.Set;

public final class GroupDto {
    private GroupDto() {}

    public record GroupCreateRequest(@NotBlank String name, @NotNull Long tenantId, @NotNull Long fatherUserId) {}
    public record GroupResponse(Long id, String name, Long tenantId, Long fatherUserId, Set<String> permissions) {}
    public record AssignPermissionRequest(@NotNull Long actorUserId, @NotNull Long permissionId) {}
}
