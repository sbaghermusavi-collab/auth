package com.bontech.auth.repository;

import com.bontech.auth.entity.RefreshTokenRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RefreshTokenRecordRepository extends JpaRepository<RefreshTokenRecord, Long> {

    Optional<RefreshTokenRecord> findByTokenId(String tokenId);

    List<RefreshTokenRecord> findByFamilyId(String familyId);

    @Modifying
    @Query("UPDATE RefreshTokenRecord r SET r.revoked = true WHERE r.familyId = :familyId")
    void revokeFamily(@Param("familyId") String familyId);

    @Modifying
    @Query("UPDATE RefreshTokenRecord r SET r.revoked = true WHERE r.userId = :userId")
    void revokeAllForUser(@Param("userId") Long userId);
}
