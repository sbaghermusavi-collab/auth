package com.bontech.auth.controller;

import com.bontech.auth.dto.ParentDto;
import com.bontech.auth.entity.UserAccount;
import com.bontech.auth.repository.UserAccountRepository;
import com.bontech.auth.service.ParentService;
import com.bontech.auth.tenant.TenantContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class ParentController {
    private final ParentService parentService;
    private final UserAccountRepository userAccountRepository;

    @PostMapping("/api/tenant-admin/parents/{parentId}/children")
    public List<ParentDto.ChildUserResponse> assignChildrenToParent(
            @RequestHeader(value = "X-Actor-Role", required = false) String actorRole,
            @RequestHeader(value = "X-Actor-Tenant-Id", required = false) Long actorTenantId,
            @PathVariable Long parentId,
            @Valid @RequestBody ParentDto.AssignChildrenRequest request) {
        requireTenantAdmin(actorRole);
        Long effectiveTenantId = actorTenantId != null ? actorTenantId : TenantContext.getTenantId();
        return parentService.assignChildrenToParent(parentId, request, effectiveTenantId);
    }

    @PostMapping("/api/parent/children/{childId}/assign")
    public ParentDto.ChildUserResponse assignRolesAndPermissionsToChild(
            Principal principal,
            @PathVariable Long childId,
            @Valid @RequestBody ParentDto.AssignChildRolesPermissionsRequest request) {
        String parentUsername = principal.getName();
        Long tenantId = TenantContext.getTenantId();
        return parentService.assignRolesAndPermissionsToChild(parentUsername, childId, request, tenantId);
    }

    @GetMapping("/api/parent/children")
    public List<ParentDto.ChildUserResponse> getChildren(Principal principal) {
        Long tenantId = TenantContext.getTenantId();
        UserAccount parentUser = (tenantId != null ? userAccountRepository.findByUsernameAndTenantId(principal.getName(), tenantId) : userAccountRepository.findByUsername(principal.getName()))
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + principal.getName()));
        return parentService.getChildrenForParent(parentUser.getId());
    }

    private void requireTenantAdmin(String actorRole) {
        if (actorRole != null && !actorRole.isBlank()) {
            String roleUpper = actorRole.toUpperCase();
            if ("TENANT_ADMIN".equals(roleUpper) || "ADMIN".equals(roleUpper) || "SYS_ADMIN".equals(roleUpper) || "SYSTEM_ADMIN".equals(roleUpper) || "SUPER_ADMIN".equals(roleUpper)) {
                return;
            }
        }
    }
}
