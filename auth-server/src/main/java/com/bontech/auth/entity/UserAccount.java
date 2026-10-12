package com.bontech.auth.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;
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
@Table(name = "users", uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_username_tenant", columnNames = {"username", "tenant_id"})
})
public class UserAccount extends AuditableEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false)
    private String passwordHash;

    @Column(name = "system_user", nullable = false)
    private boolean systemUser;

    @Column(nullable = false)
    private Instant passwordExpiresAt;

    @Column(nullable = false)
    private boolean passwordChangeRequired;

    @Column(name = "profile_completed", nullable = false)
    @lombok.Builder.Default
    private boolean profileCompleted = true;

    @Column(name = "enabled", nullable = false)
    @lombok.Builder.Default
    private boolean enabled = true;

    @Column(name = "national_code", length = 20)
    private String nationalCode;

    @Column(name = "email", length = 120)
    private String email;

    @Column(name = "full_name", length = 150)
    private String fullName;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", foreignKey = @ForeignKey(name = "fk_user_tenant"), insertable = false, updatable = false)
    private Tenant tenant;

    @ManyToMany
    @JoinTable(name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id", foreignKey = @ForeignKey(name = "fk_user_role_user")),
            inverseJoinColumns = @JoinColumn(name = "role_id", foreignKey = @ForeignKey(name = "fk_user_role_role")))
    private Set<Role> roles = new LinkedHashSet<>();
}
