package com.bontech.auth.repository;

import com.bontech.auth.entity.GroupPermission;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GroupPermissionRepository extends JpaRepository<GroupPermission, Long> {
    List<GroupPermission> findByGroupId(Long groupId);
    Optional<GroupPermission> findByGroupIdAndPermissionId(Long groupId, Long permissionId);
}
