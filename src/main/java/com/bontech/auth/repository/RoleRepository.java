package com.bontech.auth.repository;

import com.bontech.auth.entity.Role;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByCodeAndTenantId(String code, Long tenantId);
    List<Role> findByTenantId(Long tenantId);
    List<Role> findByPermissions_Code(String permissionCode);
}
