package com.bontech.auth.repository;

import com.bontech.auth.entity.UserAccount;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {
    @EntityGraph(attributePaths = {"roles", "roles.permissions", "tenant"})
    Optional<UserAccount> findByUsername(String username);
    @EntityGraph(attributePaths = {"roles", "roles.permissions", "tenant"})
    Optional<UserAccount> findByUsernameAndTenantId(String username, Long tenantId);
    List<UserAccount> findByRoles_Code(String roleCode);
    List<UserAccount> findByRoles_CodeAndTenantId(String roleCode, Long tenantId);
    List<UserAccount> findByRoles_Permissions_Code(String permissionCode);
    List<UserAccount> findByRoles_Permissions_CodeAndTenantId(String permissionCode, Long tenantId);
}
