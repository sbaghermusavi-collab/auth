package com.bontech.auth.repository;

import com.bontech.auth.entity.ActivityLog;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    List<ActivityLog> findTop100ByUser_UsernameOrderByActionAtDesc(String username);
}
