package com.bontech.auth.repository;

import com.bontech.auth.entity.TwoStepChallenge;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TwoStepChallengeRepository extends JpaRepository<TwoStepChallenge, Long> {
    Optional<TwoStepChallenge> findByUser_UsernameAndCodeAndUsedFalse(String username, String code);
    Optional<TwoStepChallenge> findTopByUser_UsernameAndUsedFalseOrderByCreatedAtDesc(String username);
}
