package com.bontech.auth.entity;

import jakarta.persistence.*;
import java.time.Instant;
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
@Table(name = "activity_logs")
public class ActivityLog extends AuditableEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", foreignKey = @ForeignKey(name = "fk_log_user"), insertable = false, updatable = false)
    private UserAccount user;

    @Column(nullable = false)
    private String action;

    @Column(nullable = false)
    private Instant actionAt;

    @Column(nullable = false)
    private String details;

    @Column(nullable = false)
    private String tenantCode;

    @Column(nullable = false)
    private String username;
}
