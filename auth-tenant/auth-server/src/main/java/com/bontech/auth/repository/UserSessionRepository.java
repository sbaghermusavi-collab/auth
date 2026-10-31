package com.bontech.auth.repository;

import com.bontech.auth.entity.UserSession;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserSessionRepository extends JpaRepository<UserSession, Long> {
    List<UserSession> findByUser_UsernameAndActiveTrue(String username);
    List<UserSession> findByUserIdAndActiveTrue(Long userId);
    List<UserSession> findByTenantIdAndActiveTrue(Long tenantId);
    Optional<UserSession> findBySessionTokenId(String tokenId);

    @Modifying
    @Query("UPDATE UserSession s SET s.active = false WHERE s.id = :id AND s.userId = :userId")
    int deactivateSession(@Param("id") Long id, @Param("userId") Long userId);

    @Modifying
    @Query("UPDATE UserSession s SET s.active = false WHERE s.userId = :userId AND s.sessionTokenId <> :currentTokenId")
    int deactivateOtherSessions(@Param("userId") Long userId, @Param("currentTokenId") String currentTokenId);

    @Modifying
    @Query("UPDATE UserSession s SET s.active = false WHERE s.userId = :userId")
    int deactivateAllUserSessions(@Param("userId") Long userId);
}
