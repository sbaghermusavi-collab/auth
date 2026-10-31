package com.bontech.auth.repository;

import com.bontech.auth.entity.Tenant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantRepository extends JpaRepository<Tenant, Long> {
    Optional<Tenant> findByCode(String code);
    Optional<Tenant> findByBaseUrl(String baseUrl);
    Optional<Tenant> findByBaseUrlContaining(String host);
}
