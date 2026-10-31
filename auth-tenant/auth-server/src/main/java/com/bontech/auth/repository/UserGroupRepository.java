package com.bontech.auth.repository;

import com.bontech.auth.entity.UserGroup;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserGroupRepository extends JpaRepository<UserGroup, Long> {
    List<UserGroup> findByTenantId(Long tenantId);
}
