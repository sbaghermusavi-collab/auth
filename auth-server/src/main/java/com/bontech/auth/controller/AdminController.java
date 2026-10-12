package com.bontech.auth.controller;

import com.bontech.auth.dto.AdminDto;
import com.bontech.auth.entity.Permission;
import com.bontech.auth.entity.PermissionGroup;
import com.bontech.auth.entity.Role;
import com.bontech.auth.entity.Tenant;
import com.bontech.auth.entity.UserAccount;
import com.bontech.auth.repository.*;
import com.bontech.auth.service.PermissionGroupService;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import java.util.Iterator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {
    private final TenantRepository tenantRepository;
    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;
    private final PermissionGroupRepository permissionGroupRepository;
    private final PermissionGroupService permissionGroupService;
    private final UserAccountRepository userAccountRepository;
    private final UserSessionRepository userSessionRepository;
    private final RefreshTokenRecordRepository refreshTokenRecordRepository;
    private final com.bontech.auth.security.CustomPasswordEncoder passwordEncoder;
    private final UserPhoneNumberRepository userPhoneNumberRepository;

    // --- Permissions ---

    @PostMapping("/permissions")
    public AdminDto.PermissionResponse createPermission(@Valid @RequestBody AdminDto.PermissionCreateRequest request) {
        Permission permission = Permission.builder()
                .code(request.code())
                .description(request.description())
                .tenantId(request.tenantId())
                .active(request.active() == null || request.active())
                .build();
        Permission saved = permissionRepository.save(permission);
        return new AdminDto.PermissionResponse(saved.getId(), saved.getCode(), saved.getDescription(), saved.getTenantId(), saved.isActive());
    }

    @GetMapping("/permissions")
    public List<AdminDto.PermissionResponse> listPermissions(@RequestParam(required = false) Long tenantId) {
        if (tenantId != null && !tenantId.equals(1L)) {
            AdminDto.TenantEntitlementResponse ent = permissionGroupService.getTenantEntitlements(tenantId);
            Set<String> entitledCodes = ent.permissions();
            return permissionRepository.findAll().stream()
                    .filter(p -> entitledCodes.contains(p.getCode()))
                    .map(p -> new AdminDto.PermissionResponse(p.getId(), p.getCode(), p.getDescription(), p.getTenantId(), p.isActive()))
                    .toList();
        }
        return permissionRepository.findAll().stream()
                .map(p -> new AdminDto.PermissionResponse(p.getId(), p.getCode(), p.getDescription(), p.getTenantId(), p.isActive()))
                .toList();
    }

    @GetMapping("/permissions/{id}")
    public AdminDto.PermissionResponse getPermission(@PathVariable Long id) {
        Permission p = permissionRepository.findById(id).orElseThrow();
        return new AdminDto.PermissionResponse(p.getId(), p.getCode(), p.getDescription(), p.getTenantId(), p.isActive());
    }

    @PutMapping("/permissions/{id}")
    public AdminDto.PermissionResponse updatePermission(@PathVariable Long id, @Valid @RequestBody AdminDto.PermissionCreateRequest request) {
        Permission permission = permissionRepository.findById(id).orElseThrow();
        permission.setCode(request.code());
        permission.setDescription(request.description());
        permission.setTenantId(request.tenantId());
        permission.setActive(request.active() == null || request.active());
        Permission saved = permissionRepository.save(permission);
        return new AdminDto.PermissionResponse(saved.getId(), saved.getCode(), saved.getDescription(), saved.getTenantId(), saved.isActive());
    }

    @DeleteMapping("/permissions/{id}")
    public void deletePermission(@PathVariable Long id) { permissionRepository.deleteById(id); }

    // --- Roles ---

    @PostMapping("/roles")
    public AdminDto.RoleResponse createRole(@Valid @RequestBody AdminDto.RoleCreateRequest request) {
        if (request.tenantId() != null && !request.tenantId().equals(1L) && request.permissionIds() != null) {
            for (Long pid : request.permissionIds()) {
                if (!permissionGroupService.isPermissionEntitled(request.tenantId(), pid)) {
                    throw new IllegalArgumentException("PERMISSION_NOT_ENTITLED: Permission ID " + pid + " is not entitled to tenant " + request.tenantId());
                }
            }
        }
        Role role = Role.builder()
                .code(request.code())
                .name(request.name())
                .description(request.description())
                .tenantId(request.tenantId())
                .isDefault(Boolean.TRUE.equals(request.isDefault()))
                .permissions(new LinkedHashSet<>())
                .groups(new LinkedHashSet<>())
                .build();
        if (request.permissionIds() != null) request.permissionIds().forEach(pid -> permissionRepository.findById(pid).ifPresent(role.getPermissions()::add));
        Role saved = roleRepository.save(role);
        return toRoleResponse(saved);
    }

    @GetMapping("/roles")
    public List<AdminDto.RoleResponse> listRoles(@RequestParam(required = false) Long tenantId) {
        List<Role> roles = tenantId != null && !tenantId.equals(1L)
                ? roleRepository.findAll().stream().filter(r -> tenantId.equals(r.getTenantId()) || r.getTenantId() == null).toList()
                : roleRepository.findAll();
        return roles.stream().map(this::toRoleResponse).toList();
    }

    @GetMapping("/roles/{id}")
    public AdminDto.RoleResponse getRole(@PathVariable Long id) {
        Role r = roleRepository.findById(id).orElseThrow();
        return toRoleResponse(r);
    }

    @PutMapping("/roles/{id}")
    public AdminDto.RoleResponse updateRole(@PathVariable Long id, @Valid @RequestBody AdminDto.RoleCreateRequest request) {
        Role role = roleRepository.findById(id).orElseThrow();
        Long tenantId = request.tenantId() != null ? request.tenantId() : role.getTenantId();
        if (tenantId != null && !tenantId.equals(1L) && request.permissionIds() != null) {
            for (Long pid : request.permissionIds()) {
                if (!permissionGroupService.isPermissionEntitled(tenantId, pid)) {
                    throw new IllegalArgumentException("PERMISSION_NOT_ENTITLED: Permission ID " + pid + " is not entitled to tenant " + tenantId);
                }
            }
        }
        role.setCode(request.code());
        if (request.name() != null) role.setName(request.name());
        if (request.description() != null) role.setDescription(request.description());
        if (request.isDefault() != null) role.setDefault(request.isDefault());
        role.setTenantId(request.tenantId());
        role.getPermissions().clear();
        if (request.permissionIds() != null) request.permissionIds().forEach(pid -> permissionRepository.findById(pid).ifPresent(role.getPermissions()::add));
        Role saved = roleRepository.save(role);
        return toRoleResponse(saved);
    }

    @DeleteMapping("/roles/{id}")
    public void deleteRole(@PathVariable Long id) { roleRepository.deleteById(id); }

    // --- One-Click Group to Role Attach / Detach (Section 6.2 & 6.3 in admin.md) ---

    @PostMapping("/roles/{roleId}/groups/{groupId}")
    @Transactional
    public AdminDto.RoleGroupAttachResponse attachGroupToRole(@PathVariable Long roleId, @PathVariable Long groupId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new IllegalArgumentException("Role not found with id: " + roleId));
        PermissionGroup group = permissionGroupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Permission group not found with id: " + groupId));

        int added = 0;
        int skipped = 0;
        String reason = null;

        Long tenantId = role.getTenantId();
        role.getGroups().add(group);

        for (Permission perm : group.getPermissions()) {
            if (tenantId != null && !tenantId.equals(1L)) {
                if (!permissionGroupService.isPermissionEntitled(tenantId, perm.getId())) {
                    skipped++;
                    reason = "not entitled to tenant " + tenantId;
                    continue;
                }
            }
            if (!role.getPermissions().contains(perm)) {
                role.getPermissions().add(perm);
                added++;
            }
        }

        roleRepository.save(role);
        return new AdminDto.RoleGroupAttachResponse(added, skipped, reason);
    }

    @DeleteMapping("/roles/{roleId}/groups/{groupId}")
    @Transactional
    public AdminDto.RoleGroupAttachResponse detachGroupFromRole(@PathVariable Long roleId, @PathVariable Long groupId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new IllegalArgumentException("Role not found with id: " + roleId));
        PermissionGroup targetGroup = permissionGroupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Permission group not found with id: " + groupId));

        role.getGroups().remove(targetGroup);

        // Find permissions contributed ONLY by this group (not present in remaining groups)
        Set<Permission> permsInOtherGroups = role.getGroups().stream()
                .flatMap(g -> g.getPermissions().stream())
                .collect(Collectors.toSet());

        int removed = 0;
        Iterator<Permission> it = role.getPermissions().iterator();
        while (it.hasNext()) {
            Permission p = it.next();
            if (targetGroup.getPermissions().contains(p) && !permsInOtherGroups.contains(p)) {
                it.remove();
                removed++;
            }
        }

        roleRepository.save(role);
        return new AdminDto.RoleGroupAttachResponse(removed, 0, "detached successfully");
    }

    private AdminDto.RoleResponse toRoleResponse(Role r) {
        Set<String> perms = r.getPermissions() != null
                ? r.getPermissions().stream().map(Permission::getCode).collect(Collectors.toSet())
                : Set.of();
        Set<String> groupCodes = r.getGroups() != null
                ? r.getGroups().stream().map(PermissionGroup::getCode).collect(Collectors.toSet())
                : Set.of();
        return new AdminDto.RoleResponse(
                r.getId(),
                r.getCode(),
                r.getName(),
                r.getDescription(),
                r.getTenantId(),
                r.isDefault(),
                perms,
                groupCodes
        );
    }

    // --- Permission Groups (task 2.3) ---

    @PostMapping("/permission-groups")
    public AdminDto.PermissionGroupResponse createPermissionGroup(@Valid @RequestBody AdminDto.PermissionGroupCreateRequest request) {
        return permissionGroupService.createGroup(request);
    }

    @GetMapping("/permission-groups")
    public List<AdminDto.PermissionGroupResponse> listPermissionGroups(@RequestParam(required = false) Long tenantId) {
        return permissionGroupService.listGroups(tenantId);
    }

    @GetMapping("/permission-groups/{id}")
    public AdminDto.PermissionGroupResponse getPermissionGroup(@PathVariable Long id) {
        return permissionGroupService.getGroup(id);
    }

    @PutMapping("/permission-groups/{id}")
    public AdminDto.PermissionGroupResponse updatePermissionGroup(@PathVariable Long id, @Valid @RequestBody AdminDto.PermissionGroupCreateRequest request) {
        return permissionGroupService.updateGroup(id, request);
    }

    @DeleteMapping("/permission-groups/{id}")
    public void deletePermissionGroup(@PathVariable Long id) {
        permissionGroupService.deleteGroup(id);
    }

    // --- Tenant Entitlements (task 2.4) ---

    @GetMapping("/tenants/{tenantId}/permissions")
    public AdminDto.TenantEntitlementResponse getTenantPermissions(@PathVariable Long tenantId) {
        return permissionGroupService.getTenantEntitlements(tenantId);
    }

    @PostMapping("/tenants/{tenantId}/permissions/{permissionId}")
    public void grantPermissionToTenant(@PathVariable Long tenantId, @PathVariable Long permissionId) {
        permissionGroupService.grantPermissionToTenant(tenantId, permissionId);
    }

    @DeleteMapping("/tenants/{tenantId}/permissions/{permissionId}")
    public void revokePermissionFromTenant(@PathVariable Long tenantId, @PathVariable Long permissionId) {
        permissionGroupService.revokePermissionFromTenant(tenantId, permissionId);
    }

    @PostMapping("/tenants/{tenantId}/permission-groups/{groupId}")
    public void grantGroupToTenant(@PathVariable Long tenantId, @PathVariable Long groupId) {
        permissionGroupService.grantGroupToTenant(tenantId, groupId);
    }

    @DeleteMapping("/tenants/{tenantId}/permission-groups/{groupId}")
    public void revokeGroupFromTenant(@PathVariable Long tenantId, @PathVariable Long groupId) {
        permissionGroupService.revokeGroupFromTenant(tenantId, groupId);
    }

    @PutMapping("/tenants/{tenantId}/default-role")
    public void setTenantDefaultRole(@PathVariable Long tenantId, @Valid @RequestBody AdminDto.TenantDefaultRoleRequest request) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found with id: " + tenantId));
        tenant.setDefaultRoleId(request.defaultRoleId());
        tenantRepository.save(tenant);
    }

    // --- User Management & Status (task 2.6) ---

    @GetMapping("/users")
    public List<AdminDto.UserDetailResponse> listUsers(@RequestParam(required = false) Long tenantId) {
        List<UserAccount> users;
        if (tenantId != null) {
            users = userAccountRepository.findAll().stream()
                    .filter(u -> tenantId.equals(u.getTenantId()))
                    .toList();
        } else {
            users = userAccountRepository.findAll();
        }
        return users.stream().map(this::toUserDetailResponse).toList();
    }

    @GetMapping("/users/{id}")
    public AdminDto.UserDetailResponse getUser(@PathVariable Long id) {
        UserAccount u = userAccountRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        return toUserDetailResponse(u);
    }

    @PutMapping("/users/{id}/status")
    @Transactional
    public AdminDto.UserDetailResponse updateUserStatus(@PathVariable Long id, @Valid @RequestBody AdminDto.UserStatusUpdateRequest request) {
        UserAccount user = userAccountRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        user.setEnabled(request.enabled());
        UserAccount saved = userAccountRepository.save(user);

        if (!request.enabled()) {
            // Immediately revoke active sessions and refresh tokens
            userSessionRepository.deactivateAllUserSessions(user.getId());
            refreshTokenRecordRepository.revokeAllForUser(user.getId());
        }

        return toUserDetailResponse(saved);
    }

    @PutMapping("/users/{id}/roles")
    @Transactional
    public AdminDto.UserDetailResponse updateUserRoles(@PathVariable Long id, @RequestBody Set<Long> roleIds) {
        UserAccount user = userAccountRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        user.getRoles().clear();
        if (roleIds != null) {
            roleIds.forEach(rid -> roleRepository.findById(rid).ifPresent(r -> {
                if (user.getTenantId() != null && !user.getTenantId().equals(1L) && !r.getTenantId().equals(user.getTenantId())) {
                    throw new IllegalArgumentException("Role does not belong to user tenant");
                }
                user.getRoles().add(r);
            }));
        }
        UserAccount saved = userAccountRepository.save(user);
        return toUserDetailResponse(saved);
    }

    @PostMapping("/users")
    @Transactional
    public AdminDto.UserDetailResponse createUser(@Valid @RequestBody AdminDto.UserCreateAdminRequest request) {
        String pwd = request.password() != null && !request.password().isBlank() ? request.password() : "password";
        UserAccount user = UserAccount.builder()
                .username(request.username())
                .passwordHash(passwordEncoder.encode(request.username(), pwd))
                .tenantId(request.tenantId() != null ? request.tenantId() : 1L)
                .enabled(true)
                .systemUser(false)
                .roles(new LinkedHashSet<>())
                .build();
        if (request.roles() != null && !request.roles().isEmpty()) {
            for (String rCode : request.roles()) {
                roleRepository.findByCode(rCode).ifPresent(user.getRoles()::add);
            }
        }
        UserAccount saved = userAccountRepository.save(user);
        String phone = request.phoneNumber();
        if (phone == null || phone.isBlank()) {
            long seed = Math.abs((saved.getId() * 37 + (saved.getTenantId() != null ? saved.getTenantId() : 1))) % 10000000;
            phone = "0912" + String.format("%07d", seed);
        }
        userPhoneNumberRepository.save(com.bontech.auth.entity.UserPhoneNumber.builder()
                .userId(saved.getId())
                .phoneNumber(phone.trim())
                .tenantId(saved.getTenantId())
                .preferredNumber(true)
                .createdAt(java.time.Instant.now())
                .updatedAt(java.time.Instant.now())
                .version(0L)
                .build());
        return toUserDetailResponse(saved);
    }

    @DeleteMapping("/users/{id}")
    @Transactional
    public void deleteUser(@PathVariable Long id) {
        userSessionRepository.deactivateAllUserSessions(id);
        refreshTokenRecordRepository.revokeAllForUser(id);
        userAccountRepository.deleteById(id);
    }

    private AdminDto.UserDetailResponse toUserDetailResponse(UserAccount u) {
        Set<String> roleCodes = u.getRoles().stream().map(Role::getCode).collect(Collectors.toSet());
        String phone = userPhoneNumberRepository.findByUser_Username(u.getUsername())
                .stream().findFirst().map(com.bontech.auth.entity.UserPhoneNumber::getPhoneNumber).orElse(null);
        return new AdminDto.UserDetailResponse(u.getId(), u.getUsername(), u.getTenantId(), phone, u.isEnabled(), u.isSystemUser(), roleCodes);
    }
}
