package com.bontech.auth.repository;

import com.bontech.auth.entity.PermissionGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PermissionGroupRepository extends JpaRepository<PermissionGroup, Long> {
    Optional<PermissionGroup> findByCode(String code);
    List<PermissionGroup> findByTenantId(Long tenantId);
    List<PermissionGroup> findByTenantIdIsNull();
}
