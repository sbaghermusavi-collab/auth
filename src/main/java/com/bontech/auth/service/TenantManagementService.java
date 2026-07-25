package com.bontech.auth.service;

import com.bontech.auth.dto.AdminDto;
import com.bontech.auth.dto.TenantAdminDto;
import com.bontech.auth.entity.Permission;
import com.bontech.auth.entity.Role;
import com.bontech.auth.entity.Tenant;
import com.bontech.auth.entity.UserAccount;
import com.bontech.auth.repository.PermissionRepository;
import com.bontech.auth.repository.RoleRepository;
import com.bontech.auth.repository.TenantRepository;
import com.bontech.auth.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TenantManagementService {
    private final TenantRepository tenantRepository;
    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;
    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public AdminDto.TenantResponse createTenant(AdminDto.TenantCreateRequest request) {
        Tenant tenant = Tenant.builder()
                .code(request.code())
                .name(request.name())
                .baseUrl(request.baseUrl())
                .build();
        Tenant savedTenant = tenantRepository.save(tenant);

        if (request.sourceTenantId() != null) {
            cloneRolesAndPermissions(request.sourceTenantId(), savedTenant.getId());
        }

        return new AdminDto.TenantResponse(savedTenant.getId(), savedTenant.getCode(), savedTenant.getName(), savedTenant.getBaseUrl());
    }

    @Transactional
    public TenantAdminDto.UserResponse assignTenantAdmin(AdminDto.AssignTenantAdminRequest request) {
        Tenant tenant = tenantRepository.findById(request.tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found with ID: " + request.tenantId()));

        Role adminRole = roleRepository.findByCodeAndTenantId("ADMIN", tenant.getId())
                .or(() -> roleRepository.findByCodeAndTenantId("TENANT_ADMIN", tenant.getId()))
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .code("ADMIN")
                        .tenantId(tenant.getId())
                        .permissions(new LinkedHashSet<>())
                        .build()));

        UserAccount user = userAccountRepository.findByUsernameAndTenantId(request.username(), tenant.getId())
                .orElseGet(() -> UserAccount.builder()
                        .username(request.username())
                        .tenantId(tenant.getId())
                        .roles(new LinkedHashSet<>())
                        .build());

        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setSystemUser(request.systemUser() != null ? request.systemUser() : false);
        user.setPasswordExpiresAt(Instant.now().plus(90, ChronoUnit.DAYS));
        user.setPasswordChangeRequired(false);
        if (user.getRoles() == null) {
            user.setRoles(new LinkedHashSet<>());
        }
        user.getRoles().add(adminRole);

        UserAccount savedUser = userAccountRepository.save(user);
        Set<String> roleCodes = savedUser.getRoles().stream().map(Role::getCode).collect(Collectors.toSet());
        return new TenantAdminDto.UserResponse(savedUser.getId(), savedUser.getUsername(), savedUser.getTenantId(), savedUser.isSystemUser(), roleCodes);
    }

    @Transactional
    public void cloneRolesAndPermissions(Long sourceTenantId, Long targetTenantId) {
        List<Permission> sourcePermissions = permissionRepository.findByTenantId(sourceTenantId);
        Map<Long, Permission> clonedPermissionsMap = new HashMap<>();

        for (Permission srcPerm : sourcePermissions) {
            Permission clonedPerm = permissionRepository.save(Permission.builder()
                    .code(srcPerm.getCode())
                    .description(srcPerm.getDescription())
                    .tenantId(targetTenantId)
                    .active(srcPerm.isActive())
                    .build());
            clonedPermissionsMap.put(srcPerm.getId(), clonedPerm);
        }

        List<Role> sourceRoles = roleRepository.findByTenantId(sourceTenantId);
        for (Role srcRole : sourceRoles) {
            Set<Permission> clonedRolePerms = new LinkedHashSet<>();
            if (srcRole.getPermissions() != null) {
                for (Permission srcPerm : srcRole.getPermissions()) {
                    Permission clonedPerm = clonedPermissionsMap.get(srcPerm.getId());
                    if (clonedPerm != null) {
                        clonedRolePerms.add(clonedPerm);
                    }
                }
            }
            roleRepository.save(Role.builder()
                    .code(srcRole.getCode())
                    .tenantId(targetTenantId)
                    .permissions(clonedRolePerms)
                    .build());
        }
    }
}
