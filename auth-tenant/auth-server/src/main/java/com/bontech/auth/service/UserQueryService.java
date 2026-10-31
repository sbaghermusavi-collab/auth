package com.bontech.auth.service;

import com.bontech.auth.dto.UserDto;
import com.bontech.auth.entity.Permission;
import com.bontech.auth.entity.UserAccount;
import com.bontech.auth.repository.UserAccountRepository;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserQueryService {
    private final UserAccountRepository repository;

    @Transactional(readOnly = true)
    public UserDto.UserAuthzResponse getAuthz(String username, Long tenantId) {
        UserAccount user = repository.findByUsernameAndTenantId(username, tenantId).orElseThrow();
        Set<String> permissions = user.getRoles().stream()
                .filter(role -> tenantId.equals(role.getTenantId()))
                .flatMap(role -> role.getPermissions().stream())
                .filter(p -> p.isActive() && tenantId.equals(p.getTenantId()))
                .map(Permission::getCode)
                .collect(Collectors.toSet());
        List<String> roles = user.getRoles().stream()
                .filter(r -> tenantId.equals(r.getTenantId()))
                .map(r -> r.getCode())
                .toList();
        return new UserDto.UserAuthzResponse(user.getUsername(), String.valueOf(user.getTenant().getId()), user.getTenant().getName(),
                roles, permissions.stream().toList());
    }

    @Transactional(readOnly = true)
    public UserDto.RoleUsersResponse usersByRole(String roleCode, Long tenantId) {
        List<UserDto.UserSummary> users = repository.findByRoles_CodeAndTenantId(roleCode, tenantId).stream().map(this::toSummary).toList();
        return new UserDto.RoleUsersResponse(roleCode, users);
    }

    @Transactional(readOnly = true)
    public UserDto.PermissionUsersResponse usersByPermission(String permissionCode, Long tenantId) {
        List<UserDto.UserSummary> users = repository.findByRoles_Permissions_CodeAndTenantId(permissionCode, tenantId).stream()
                .filter(user -> hasActivePermission(user, permissionCode, tenantId))
                .map(this::toSummary)
                .toList();
        return new UserDto.PermissionUsersResponse(permissionCode, users);
    }

    private UserDto.UserSummary toSummary(UserAccount user) {
        return new UserDto.UserSummary(user.getUsername(), user.getTenant().getName(), user.isSystemUser());
    }

    private boolean hasActivePermission(UserAccount user, String permissionCode, Long tenantId) {
        return user.getRoles().stream()
                .filter(role -> tenantId.equals(role.getTenantId()))
                .flatMap(role -> role.getPermissions().stream())
                .anyMatch(p -> tenantId.equals(p.getTenantId())
                        && p.isActive()
                        && p.getCode().equalsIgnoreCase(permissionCode));
    }
}
