package com.bontech.auth.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Filter;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@SuperBuilder
@Entity
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
@Table(name = "permissions", uniqueConstraints = {
        @UniqueConstraint(name = "uk_permission_code_tenant", columnNames = {"code", "tenant_id"})
})
public class Permission extends AuditableEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String code;

    @Column(nullable = false)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", foreignKey = @ForeignKey(name = "fk_permission_tenant"), insertable = false, updatable = false)
    private Tenant tenant;

    @Column(nullable = false)
    private boolean active = true;
}
