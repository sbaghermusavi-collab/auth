package com.bontech.auth.controller;

import com.bontech.auth.dto.GroupDto;
import com.bontech.auth.entity.GroupPermission;
import com.bontech.auth.entity.Permission;
import com.bontech.auth.entity.UserGroup;
import com.bontech.auth.repository.GroupPermissionRepository;
import com.bontech.auth.repository.PermissionRepository;
import com.bontech.auth.repository.UserGroupRepository;
import jakarta.validation.Valid;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {
    private final UserGroupRepository userGroupRepository;
    private final GroupPermissionRepository groupPermissionRepository;
    private final PermissionRepository permissionRepository;

    @PostMapping
    public GroupDto.GroupResponse create(@Valid @RequestBody GroupDto.GroupCreateRequest request) {
        UserGroup group = UserGroup.builder()
                .name(request.name())
                .tenantId(request.tenantId())
                .fatherUserId(request.fatherUserId())
                .build();
        UserGroup saved = userGroupRepository.save(group);
        return new GroupDto.GroupResponse(saved.getId(), saved.getName(), saved.getTenantId(), saved.getFatherUserId(), Set.of());
    }

    @GetMapping("/{groupId}")
    public GroupDto.GroupResponse get(@PathVariable Long groupId) {
        UserGroup group = userGroupRepository.findById(groupId).orElseThrow();
        Set<String> permissions = groupPermissionRepository.findByGroupId(groupId).stream()
                .map(gp -> gp.getPermission().getCode())
                .collect(Collectors.toSet());
        return new GroupDto.GroupResponse(group.getId(), group.getName(), group.getTenantId(), group.getFatherUserId(), permissions);
    }

    @PostMapping("/{groupId}/permissions")
    public GroupDto.GroupResponse assignPermissionByFather(@PathVariable Long groupId,
                                                           @Valid @RequestBody GroupDto.AssignPermissionRequest request) {
        UserGroup group = userGroupRepository.findById(groupId).orElseThrow();
        if (!group.getFatherUserId().equals(request.actorUserId())) {
            throw new IllegalArgumentException("Only group father can assign permissions to own group");
        }
        Permission permission = permissionRepository.findById(request.permissionId()).orElseThrow();
        if (!group.getTenantId().equals(permission.getTenantId())) {
            throw new IllegalArgumentException("Permission is not in group tenant");
        }
        if (!permission.isActive()) {
            throw new IllegalArgumentException("Permission is inactive for tenant");
        }
        groupPermissionRepository.findByGroupIdAndPermissionId(groupId, permission.getId())
                .orElseGet(() -> groupPermissionRepository.save(GroupPermission.builder()
                        .groupId(groupId)
                        .permissionId(permission.getId())
                        .tenantId(group.getTenantId())
                        .build()));
        return get(groupId);
    }
}
