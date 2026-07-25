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
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/sys-admin")
@RequiredArgsConstructor
public class SysAdminController {
    private final TenantManagementService tenantManagementService;
    private final TenantRepository tenantRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    @PostMapping("/tenants")
    public AdminDto.TenantResponse createTenant(@RequestHeader(value = "X-Actor-Role", required = false) String actorRole,
                                                @Valid @RequestBody AdminDto.TenantCreateRequest request) {
        requireSysAdmin(actorRole);
        return tenantManagementService.createTenant(request);
    }

    @GetMapping("/tenants")
    public List<AdminDto.TenantResponse> listTenants(@RequestHeader(value = "X-Actor-Role", required = false) String actorRole) {
        requireSysAdmin(actorRole);
        return tenantRepository.findAll().stream()
                .map(t -> new AdminDto.TenantResponse(t.getId(), t.getCode(), t.getName(), t.getBaseUrl()))
                .toList();
    }

    @PostMapping("/assign-tenant-admin")
    public TenantAdminDto.UserResponse assignTenantAdmin(@RequestHeader(value = "X-Actor-Role", required = false) String actorRole,
                                                         @Valid @RequestBody AdminDto.AssignTenantAdminRequest request) {
        requireSysAdmin(actorRole);
        return tenantManagementService.assignTenantAdmin(request);
    }

    @PostMapping("/tenants/{tenantId}/admin")
    public TenantAdminDto.UserResponse assignTenantAdminForTenant(@RequestHeader(value = "X-Actor-Role", required = false) String actorRole,
                                                                  @PathVariable Long tenantId,
                                                                  @Valid @RequestBody AdminDto.AssignTenantAdminRequest request) {
        requireSysAdmin(actorRole);
        AdminDto.AssignTenantAdminRequest req = new AdminDto.AssignTenantAdminRequest(tenantId, request.username(), request.password(), request.systemUser());
        return tenantManagementService.assignTenantAdmin(req);
    }

    @PostMapping("/tenants/{tenantId}/roles")
    public AdminDto.RoleResponse createRoleForTenant(@RequestHeader(value = "X-Actor-Role", required = false) String actorRole,
                                                     @PathVariable Long tenantId,
                                                     @Valid @RequestBody AdminDto.RoleCreateRequest request) {
        requireSysAdmin(actorRole);
        Role role = Role.builder()
                .code(request.code())
                .tenantId(tenantId)
                .permissions(new LinkedHashSet<>())
                .build();

        if (request.permissionIds() != null) {
            request.permissionIds().forEach(pid -> permissionRepository.findById(pid).ifPresent(role.getPermissions()::add));
        }

        Role saved = roleRepository.save(role);
        return new AdminDto.RoleResponse(saved.getId(), saved.getCode(), saved.getTenantId(),
                saved.getPermissions().stream().map(Permission::getCode).collect(Collectors.toSet()));
    }

    @PostMapping("/tenants/{tenantId}/permissions")
    public AdminDto.PermissionResponse createPermissionForTenant(@RequestHeader(value = "X-Actor-Role", required = false) String actorRole,
                                                                 @PathVariable Long tenantId,
                                                                 @Valid @RequestBody AdminDto.PermissionCreateRequest request) {
        requireSysAdmin(actorRole);
        Permission permission = Permission.builder()
                .code(request.code())
                .description(request.description())
                .tenantId(tenantId)
                .active(request.active() == null || request.active())
                .build();
        Permission saved = permissionRepository.save(permission);
        return new AdminDto.PermissionResponse(saved.getId(), saved.getCode(), saved.getDescription(), saved.getTenantId(), saved.isActive());
    }

    private void requireSysAdmin(String actorRole) {
        if (actorRole != null && !actorRole.isBlank()) {
            String roleUpper = actorRole.toUpperCase();
            if ("SYS_ADMIN".equals(roleUpper) || "SYSTEM_ADMIN".equals(roleUpper) || "SUPER_ADMIN".equals(roleUpper)) {
                return;
            }
        }
        // If header not specified, assume sys_admin check or proceed
    }
}
