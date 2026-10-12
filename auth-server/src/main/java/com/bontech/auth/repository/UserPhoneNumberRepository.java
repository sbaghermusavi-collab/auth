package com.bontech.auth.repository;

import com.bontech.auth.entity.UserPhoneNumber;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserPhoneNumberRepository extends JpaRepository<UserPhoneNumber, Long> {
    List<UserPhoneNumber> findByUser_Username(String username);
    Optional<UserPhoneNumber> findByPhoneNumber(String phoneNumber);
    Optional<UserPhoneNumber> findByPhoneNumberAndTenantId(String phoneNumber, Long tenantId);
}
