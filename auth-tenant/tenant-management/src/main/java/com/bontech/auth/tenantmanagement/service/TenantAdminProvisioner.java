package com.bontech.auth.tenantmanagement.service;

import java.util.Set;

public interface TenantAdminProvisioner {
    /**
     * Creates an initial tenant administrator user account with TENANT_ADMIN & ADMIN roles for this tenant.
     */
    void provisionTenantAdmin(Long tenantId, String tenantCode, String username, String password, String email, String fullName);

    /**
     * Clones roles, permissions, and group templates from source tenant to new target tenant.
     */
    void cloneTenantRolesAndPermissions(Long sourceTenantId, Long targetTenantId, Set<String> activeModules);

    /**
     * Issues an impersonation token for Super Admin to act inside the tenant.
     */
    String generateImpersonationToken(Long tenantId, String targetUsername, String adminUsername);
}
