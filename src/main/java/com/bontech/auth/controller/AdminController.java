package com.bontech.auth.controller;

import com.bontech.auth.dto.AdminDto;
import com.bontech.auth.dto.TenantAdminDto;
import com.bontech.auth.entity.Permission;
import com.bontech.auth.entity.Role;
import com.bontech.auth.entity.Tenant;
import com.bontech.auth.repository.PermissionRepository;
import com.bontech.auth.repository.RoleRepository;
import com.bontech.auth.repository.TenantRepository;
import com.bontech.auth.service.TenantManagementService;
import com.bontech.auth.tenant.TenantContext;
import jakarta.validation.Valid;
import java.util.LinkedHashSet;
import java.util.List;
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
    private final TenantManagementService tenantManagementService;

    @PostMapping("/tenants")
    public AdminDto.TenantResponse createTenant(@RequestHeader(value = "X-Actor-Role", required = false) String actorRole,
                                                @Valid @RequestBody AdminDto.TenantCreateRequest request) {
        requireSuperAdmin(actorRole);
        return tenantManagementService.createTenant(request);
    }

    @GetMapping("/tenants")
    public List<AdminDto.TenantResponse> listTenants(@RequestHeader(value = "X-Actor-Role", required = false) String actorRole) {
        requireSuperAdmin(actorRole);
        return tenantRepository.findAll().stream()
                .map(t -> new AdminDto.TenantResponse(t.getId(), t.getCode(), t.getName(), t.getBaseUrl()))
                .toList();
    }

    @PutMapping("/tenants/{id}")
    public AdminDto.TenantResponse updateTenant(@RequestHeader(value = "X-Actor-Role", required = false) String actorRole,
                                                @PathVariable Long id,
                                                @Valid @RequestBody AdminDto.TenantCreateRequest request) {
        requireSuperAdmin(actorRole);
        Tenant tenant = tenantRepository.findById(id).orElseThrow();
        tenant.setCode(request.code());
        tenant.setName(request.name());
        tenant.setBaseUrl(request.baseUrl());
        Tenant saved = tenantRepository.save(tenant);
        return new AdminDto.TenantResponse(saved.getId(), saved.getCode(), saved.getName(), saved.getBaseUrl());
    }

    @DeleteMapping("/tenants/{id}")
    public void deleteTenant(@RequestHeader(value = "X-Actor-Role", required = false) String actorRole, @PathVariable Long id) {
        requireSuperAdmin(actorRole);
        tenantRepository.deleteById(id);
    }

    @PostMapping("/assign-tenant-admin")
    public TenantAdminDto.UserResponse assignTenantAdmin(@RequestHeader(value = "X-Actor-Role", required = false) String actorRole,
                                                         @Valid @RequestBody AdminDto.AssignTenantAdminRequest request) {
        requireSuperAdmin(actorRole);
        return tenantManagementService.assignTenantAdmin(request);
    }

    @PostMapping("/permissions")
    public AdminDto.PermissionResponse createPermission(@Valid @RequestBody AdminDto.PermissionCreateRequest request) {
        Long targetTenantId = request.tenantId() != null ? request.tenantId() : TenantContext.getTenantId();
        Permission permission = Permission.builder()
                .code(request.code())
                .description(request.description())
                .tenantId(targetTenantId)
                .active(request.active() == null || request.active())
                .build();
        Permission saved = permissionRepository.save(permission);
        return new AdminDto.PermissionResponse(saved.getId(), saved.getCode(), saved.getDescription(), saved.getTenantId(), saved.isActive());
    }

    @GetMapping("/permissions")
    public List<AdminDto.PermissionResponse> listPermissions() {
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
        if (request.tenantId() != null) {
            permission.setTenantId(request.tenantId());
        }
        permission.setActive(request.active() == null || request.active());
        Permission saved = permissionRepository.save(permission);
        return new AdminDto.PermissionResponse(saved.getId(), saved.getCode(), saved.getDescription(), saved.getTenantId(), saved.isActive());
    }

    @DeleteMapping("/permissions/{id}")
    public void deletePermission(@PathVariable Long id) {
        permissionRepository.deleteById(id);
    }

    @PostMapping("/roles")
    public AdminDto.RoleResponse createRole(@Valid @RequestBody AdminDto.RoleCreateRequest request) {
        Long targetTenantId = request.tenantId() != null ? request.tenantId() : TenantContext.getTenantId();
        Role role = Role.builder()
                .code(request.code())
                .tenantId(targetTenantId)
                .permissions(new LinkedHashSet<>())
                .build();

        if (request.permissionIds() != null) {
            request.permissionIds().forEach(pid -> permissionRepository.findById(pid).ifPresent(p -> {
                if (targetTenantId != null && p.getTenantId() != null && !targetTenantId.equals(p.getTenantId())) {
                    throw new IllegalArgumentException("Permission " + p.getCode() + " does not belong to target tenant");
                }
                role.getPermissions().add(p);
            }));
        }
        Role saved = roleRepository.save(role);
        return new AdminDto.RoleResponse(saved.getId(), saved.getCode(), saved.getTenantId(),
                saved.getPermissions().stream().map(Permission::getCode).collect(Collectors.toSet()));
    }

    @GetMapping("/roles")
    public List<AdminDto.RoleResponse> listRoles() {
        return roleRepository.findAll().stream()
                .map(r -> new AdminDto.RoleResponse(r.getId(), r.getCode(), r.getTenantId(),
                        r.getPermissions().stream().map(Permission::getCode).collect(Collectors.toSet())))
                .toList();
    }

    @GetMapping("/roles/{id}")
    public AdminDto.RoleResponse getRole(@PathVariable Long id) {
        Role r = roleRepository.findById(id).orElseThrow();
        return new AdminDto.RoleResponse(r.getId(), r.getCode(), r.getTenantId(),
                r.getPermissions().stream().map(Permission::getCode).collect(Collectors.toSet()));
    }

    @PutMapping("/roles/{id}")
    public AdminDto.RoleResponse updateRole(@PathVariable Long id, @Valid @RequestBody AdminDto.RoleCreateRequest request) {
        Role role = roleRepository.findById(id).orElseThrow();
        Long targetTenantId = request.tenantId() != null ? request.tenantId() : role.getTenantId();
        role.setCode(request.code());
        role.setTenantId(targetTenantId);
        role.getPermissions().clear();
        if (request.permissionIds() != null) {
            request.permissionIds().forEach(pid -> permissionRepository.findById(pid).ifPresent(p -> {
                if (targetTenantId != null && p.getTenantId() != null && !targetTenantId.equals(p.getTenantId())) {
                    throw new IllegalArgumentException("Permission " + p.getCode() + " does not belong to target tenant");
                }
                role.getPermissions().add(p);
            }));
        }
        Role saved = roleRepository.save(role);
        return new AdminDto.RoleResponse(saved.getId(), saved.getCode(), saved.getTenantId(),
                saved.getPermissions().stream().map(Permission::getCode).collect(Collectors.toSet()));
    }

    @DeleteMapping("/roles/{id}")
    public void deleteRole(@PathVariable Long id) {
        roleRepository.deleteById(id);
    }

    private void requireSuperAdmin(String actorRole) {
        if (actorRole != null && !actorRole.isBlank()) {
            String roleUpper = actorRole.toUpperCase();
            if ("SUPER_ADMIN".equals(roleUpper) || "SYS_ADMIN".equals(roleUpper) || "SYSTEM_ADMIN".equals(roleUpper)) {
                return;
            }
        }
    }
}
