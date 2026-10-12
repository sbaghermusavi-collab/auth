package com.bontech.auth.service;

import com.bontech.auth.dto.AdminDto;
import com.bontech.auth.entity.Permission;
import com.bontech.auth.entity.PermissionGroup;
import com.bontech.auth.entity.TenantPermission;
import com.bontech.auth.entity.TenantPermissionGroup;
import com.bontech.auth.repository.PermissionGroupRepository;
import com.bontech.auth.repository.PermissionRepository;
import com.bontech.auth.repository.TenantPermissionGroupRepository;
import com.bontech.auth.repository.TenantPermissionRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PermissionGroupService {

    private final PermissionGroupRepository groupRepository;
    private final PermissionRepository permissionRepository;
    private final TenantPermissionRepository tenantPermissionRepository;
    private final TenantPermissionGroupRepository tenantPermissionGroupRepository;

    @Transactional
    public AdminDto.PermissionGroupResponse createGroup(AdminDto.PermissionGroupCreateRequest request) {
        if (groupRepository.findByCode(request.code()).isPresent()) {
            throw new IllegalArgumentException("Permission group code already exists: " + request.code());
        }

        PermissionGroup group = PermissionGroup.builder()
                .code(request.code())
                .name(request.name())
                .description(request.description())
                .tenantId(request.tenantId())
                .permissions(new LinkedHashSet<>())
                .build();

        if (request.permissionIds() != null && !request.permissionIds().isEmpty()) {
            List<Permission> permissions = permissionRepository.findAllById(request.permissionIds());
            group.getPermissions().addAll(permissions);
        }

        PermissionGroup saved = groupRepository.save(group);
        return toResponse(saved);
    }

    public List<AdminDto.PermissionGroupResponse> listGroups(Long tenantId) {
        if (tenantId != null && !tenantId.equals(1L)) {
            java.util.List<TenantPermissionGroup> assignedGroups = tenantPermissionGroupRepository.findByTenantId(tenantId);
            java.util.Set<Long> groupIds = assignedGroups.stream().map(TenantPermissionGroup::getGroupId).collect(Collectors.toSet());
            java.util.List<PermissionGroup> direct = groupRepository.findByTenantId(tenantId);
            direct.forEach(g -> groupIds.add(g.getId()));
            return groupRepository.findAllById(groupIds).stream().map(this::toResponse).toList();
        }
        List<PermissionGroup> groups = groupRepository.findAll();
        return groups.stream().map(this::toResponse).toList();
    }

    public AdminDto.PermissionGroupResponse getGroup(Long id) {
        PermissionGroup group = groupRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Permission group not found with id: " + id));
        return toResponse(group);
    }

    @Transactional
    public AdminDto.PermissionGroupResponse updateGroup(Long id, AdminDto.PermissionGroupCreateRequest request) {
        PermissionGroup group = groupRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Permission group not found with id: " + id));

        group.setCode(request.code());
        group.setName(request.name());
        group.setDescription(request.description());
        group.setTenantId(request.tenantId());
        group.getPermissions().clear();

        if (request.permissionIds() != null && !request.permissionIds().isEmpty()) {
            List<Permission> permissions = permissionRepository.findAllById(request.permissionIds());
            group.getPermissions().addAll(permissions);
        }

        PermissionGroup saved = groupRepository.save(group);
        return toResponse(saved);
    }

    @Transactional
    public void deleteGroup(Long id) {
        groupRepository.deleteById(id);
    }

    @Transactional
    public void grantPermissionToTenant(Long tenantId, Long permissionId) {
        if (tenantPermissionRepository.findByTenantIdAndPermissionId(tenantId, permissionId).isEmpty()) {
            tenantPermissionRepository.save(TenantPermission.builder()
                    .tenantId(tenantId)
                    .permissionId(permissionId)
                    .build());
        }
    }

    @Transactional
    public void revokePermissionFromTenant(Long tenantId, Long permissionId) {
        tenantPermissionRepository.deleteByTenantIdAndPermissionId(tenantId, permissionId);
    }

    @Transactional
    public void grantGroupToTenant(Long tenantId, Long groupId) {
        if (tenantPermissionGroupRepository.findByTenantIdAndGroupId(tenantId, groupId).isEmpty()) {
            tenantPermissionGroupRepository.save(TenantPermissionGroup.builder()
                    .tenantId(tenantId)
                    .groupId(groupId)
                    .build());
        }
    }

    @Transactional
    public void revokeGroupFromTenant(Long tenantId, Long groupId) {
        tenantPermissionGroupRepository.deleteByTenantIdAndGroupId(tenantId, groupId);
    }

    public AdminDto.TenantEntitlementResponse getTenantEntitlements(Long tenantId) {
        Set<String> effectivePermissions = new LinkedHashSet<>();
        Set<String> assignedGroupCodes = new LinkedHashSet<>();

        // 1. Direct tenant permissions
        List<TenantPermission> directPerms = tenantPermissionRepository.findByTenantId(tenantId);
        for (TenantPermission tp : directPerms) {
            permissionRepository.findById(tp.getPermissionId())
                    .ifPresent(p -> effectivePermissions.add(p.getCode()));
        }

        // 2. Permissions from tenant permission groups
        List<TenantPermissionGroup> assignedGroups = tenantPermissionGroupRepository.findByTenantId(tenantId);
        for (TenantPermissionGroup tpg : assignedGroups) {
            groupRepository.findById(tpg.getGroupId()).ifPresent(g -> {
                assignedGroupCodes.add(g.getCode());
                g.getPermissions().forEach(p -> effectivePermissions.add(p.getCode()));
            });
        }

        return new AdminDto.TenantEntitlementResponse(tenantId, effectivePermissions, assignedGroupCodes);
    }

    public boolean isPermissionEntitled(Long tenantId, Long permissionId) {
        if (tenantId == null || tenantId.equals(1L)) {
            return true; // Super admin / default tenant has global entitlement
        }

        // Check if direct permission
        if (tenantPermissionRepository.findByTenantIdAndPermissionId(tenantId, permissionId).isPresent()) {
            return true;
        }

        // Check if within assigned groups
        List<TenantPermissionGroup> assignedGroups = tenantPermissionGroupRepository.findByTenantId(tenantId);
        for (TenantPermissionGroup tpg : assignedGroups) {
            Optional<PermissionGroup> g = groupRepository.findById(tpg.getGroupId());
            if (g.isPresent() && g.get().getPermissions().stream().anyMatch(p -> p.getId().equals(permissionId))) {
                return true;
            }
        }

        return false;
    }

    private AdminDto.PermissionGroupResponse toResponse(PermissionGroup group) {
        Set<String> permissionCodes = group.getPermissions() != null
                ? group.getPermissions().stream().map(Permission::getCode).collect(Collectors.toSet())
                : Set.of();
        return new AdminDto.PermissionGroupResponse(
                group.getId(),
                group.getCode(),
                group.getName(),
                group.getDescription(),
                group.getTenantId(),
                permissionCodes
        );
    }
}
