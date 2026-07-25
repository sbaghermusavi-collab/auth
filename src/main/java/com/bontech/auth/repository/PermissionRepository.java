package com.bontech.auth.repository;

import com.bontech.auth.entity.Permission;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PermissionRepository extends JpaRepository<Permission, Long> {
    Optional<Permission> findByCode(String code);
    Optional<Permission> findByCodeAndTenantId(String code, Long tenantId);
    List<Permission> findByTenantId(Long tenantId);
}
