package com.bontech.auth.repository;

import com.bontech.auth.entity.TenantPermissionGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TenantPermissionGroupRepository extends JpaRepository<TenantPermissionGroup, Long> {
    List<TenantPermissionGroup> findByTenantId(Long tenantId);
    Optional<TenantPermissionGroup> findByTenantIdAndGroupId(Long tenantId, Long groupId);
    void deleteByTenantIdAndGroupId(Long tenantId, Long groupId);
    void deleteByTenantId(Long tenantId);
}
