package com.bontech.auth.repository;

import com.bontech.auth.entity.TenantPermission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TenantPermissionRepository extends JpaRepository<TenantPermission, Long> {
    List<TenantPermission> findByTenantId(Long tenantId);
    Optional<TenantPermission> findByTenantIdAndPermissionId(Long tenantId, Long permissionId);
    void deleteByTenantIdAndPermissionId(Long tenantId, Long permissionId);
    void deleteByTenantId(Long tenantId);
}
