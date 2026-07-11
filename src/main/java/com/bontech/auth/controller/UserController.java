package com.bontech.auth.controller;

import com.bontech.auth.dto.UserDto;
import com.bontech.auth.service.UserQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    @GetMapping("/me")
    public UserDto.UserAuthzResponse me(@RequestHeader(value = "X-Actor-Tenant-Id", required = false) Long actorTenantId, Principal principal) {
        return service.getAuthz(principal.getName(), actorTenantId);
    }

    private final UserQueryService service;


    @GetMapping("/{username}/authorization")
    public UserDto.UserAuthzResponse userAuthz(@RequestHeader(value = "X-Actor-Tenant-Id", required = false) Long actorTenantId,
                                               @PathVariable String username) {
        return service.getAuthz(username, actorTenantId);
    }

    @GetMapping("/by-role/{roleCode}")
    public UserDto.RoleUsersResponse usersByRole(@RequestHeader(value = "X-Actor-Tenant-Id", required = false) Long actorTenantId,
                                                 @PathVariable String roleCode) {
        return service.usersByRole(roleCode, actorTenantId);
    }

    @GetMapping("/by-permission/{permissionCode}")
    public UserDto.PermissionUsersResponse usersByPermission(@RequestHeader(value = "X-Actor-Tenant-Id", required = false) Long actorTenantId,
                                                             @PathVariable String permissionCode) {
        return service.usersByPermission(permissionCode, actorTenantId);
    }
}
