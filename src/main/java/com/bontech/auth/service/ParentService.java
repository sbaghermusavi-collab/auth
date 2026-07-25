package com.bontech.auth.service;

import com.bontech.auth.dto.ParentDto;
import com.bontech.auth.entity.Permission;
import com.bontech.auth.entity.Role;
import com.bontech.auth.entity.UserAccount;
import com.bontech.auth.repository.PermissionRepository;
import com.bontech.auth.repository.RoleRepository;
import com.bontech.auth.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class ParentService {
    private final UserAccountRepository userAccountRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    @Transactional
    public List<ParentDto.ChildUserResponse> assignChildrenToParent(Long parentUserId, ParentDto.AssignChildrenRequest request, Long tenantId) {
        UserAccount parentUser = userAccountRepository.findById(parentUserId)
                .orElseThrow(() -> new IllegalArgumentException("Parent user not found with ID: " + parentUserId));

        if (tenantId != null && !tenantId.equals(parentUser.getTenantId())) {
            throw new IllegalArgumentException("Parent user does not belong to target tenant");
        }

        boolean hasParentRole = parentUser.getRoles() != null && parentUser.getRoles().stream()
                .anyMatch(r -> "PARENT".equalsIgnoreCase(r.getCode()));

        if (!hasParentRole) {
            throw new IllegalArgumentException("Target user does not have the PARENT role");
        }

        List<UserAccount> assignedChildren = new ArrayList<>();
        for (Long childId : request.childUserIds()) {
            UserAccount child = userAccountRepository.findById(childId)
                    .orElseThrow(() -> new IllegalArgumentException("Child user not found with ID: " + childId));

            if (!parentUser.getTenantId().equals(child.getTenantId())) {
                throw new IllegalArgumentException("Child user " + child.getUsername() + " is not in the same tenant as parent");
            }

            child.setParentUserId(parentUserId);
            assignedChildren.add(userAccountRepository.save(child));
        }

        return assignedChildren.stream().map(this::toChildResponse).toList();
    }

    @Transactional
    public ParentDto.ChildUserResponse assignRolesAndPermissionsToChild(String parentUsername, Long childUserId, ParentDto.AssignChildRolesPermissionsRequest request, Long tenantId) {
        UserAccount parentUser = (tenantId != null ? userAccountRepository.findByUsernameAndTenantId(parentUsername, tenantId) : userAccountRepository.findByUsername(parentUsername))
                .orElseThrow(() -> new IllegalArgumentException("Parent user not found with username: " + parentUsername));

        boolean hasParentRole = parentUser.getRoles() != null && parentUser.getRoles().stream()
                .anyMatch(r -> "PARENT".equalsIgnoreCase(r.getCode()));

        if (!hasParentRole) {
            throw new IllegalArgumentException("Actor user does not have the PARENT role");
        }

        UserAccount childUser = userAccountRepository.findById(childUserId)
                .orElseThrow(() -> new IllegalArgumentException("Child user not found with ID: " + childUserId));

        if (childUser.getParentUserId() == null || !childUser.getParentUserId().equals(parentUser.getId())) {
            throw new IllegalArgumentException("User " + childUser.getUsername() + " is not a child of parent " + parentUser.getUsername());
        }

        // Extract parent's roles and permissions
        Set<Role> parentRoles = parentUser.getRoles() != null ? parentUser.getRoles() : Set.of();
        Set<Long> parentRoleIds = parentRoles.stream().map(Role::getId).collect(Collectors.toSet());

        Set<Permission> parentPermissions = parentRoles.stream()
                .flatMap(r -> r.getPermissions() != null ? r.getPermissions().stream() : Stream.empty())
                .collect(Collectors.toSet());
        Set<Long> parentPermissionIds = parentPermissions.stream().map(Permission::getId).collect(Collectors.toSet());

        // Validate requested roles
        if (request.roleIds() != null && !request.roleIds().isEmpty()) {
            for (Long requestedRoleId : request.roleIds()) {
                if (!parentRoleIds.contains(requestedRoleId)) {
                    Role role = roleRepository.findById(requestedRoleId).orElse(null);
                    String roleCode = role != null ? role.getCode() : String.valueOf(requestedRoleId);
                    throw new IllegalArgumentException("Parent cannot assign role '" + roleCode + "' because parent does not possess it");
                }
            }

            if (childUser.getRoles() == null) {
                childUser.setRoles(new LinkedHashSet<>());
            }
            childUser.getRoles().clear();
            request.roleIds().forEach(rid -> roleRepository.findById(rid).ifPresent(childUser.getRoles()::add));
        }

        // Validate requested permissions
        if (request.permissionIds() != null && !request.permissionIds().isEmpty()) {
            for (Long requestedPermId : request.permissionIds()) {
                if (!parentPermissionIds.contains(requestedPermId)) {
                    Permission perm = permissionRepository.findById(requestedPermId).orElse(null);
                    String permCode = perm != null ? perm.getCode() : String.valueOf(requestedPermId);
                    throw new IllegalArgumentException("Parent cannot assign permission '" + permCode + "' because parent does not possess it");
                }
            }
        }

        UserAccount saved = userAccountRepository.save(childUser);
        return toChildResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ParentDto.ChildUserResponse> getChildrenForParent(Long parentUserId) {
        return userAccountRepository.findByParentUserId(parentUserId).stream()
                .map(this::toChildResponse)
                .toList();
    }

    private ParentDto.ChildUserResponse toChildResponse(UserAccount user) {
        Set<String> roles = user.getRoles() != null
                ? user.getRoles().stream().map(Role::getCode).collect(Collectors.toSet())
                : Set.of();
        Set<String> permissions = user.getRoles() != null
                ? user.getRoles().stream()
                    .flatMap(r -> r.getPermissions() != null ? r.getPermissions().stream() : Stream.empty())
                    .map(Permission::getCode)
                    .collect(Collectors.toSet())
                : Set.of();
        return new ParentDto.ChildUserResponse(user.getId(), user.getUsername(), user.getTenantId(), user.getParentUserId(), roles, permissions);
    }
}
