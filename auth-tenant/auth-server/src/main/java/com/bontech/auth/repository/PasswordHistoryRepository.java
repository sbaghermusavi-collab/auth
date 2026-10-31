package com.bontech.auth.repository;

import com.bontech.auth.entity.PasswordHistory;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PasswordHistoryRepository extends JpaRepository<PasswordHistory, Long> {
    List<PasswordHistory> findTop3ByUser_UsernameOrderByCreatedAtDesc(String username);
}
