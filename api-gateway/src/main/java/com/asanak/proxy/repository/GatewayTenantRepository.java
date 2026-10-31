package com.asanak.proxy.repository;

import com.asanak.proxy.entity.GatewayTenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GatewayTenantRepository extends JpaRepository<GatewayTenant, Long> {
    Optional<GatewayTenant> findByCode(String code);
}
