package com.bontech.auth.entity;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "tenant_permission_groups", uniqueConstraints = {
        @UniqueConstraint(name = "uk_tenant_permission_group", columnNames = {"tenant_id", "group_id"})
})
public class TenantPermissionGroup {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "group_id", nullable = false)
    private Long groupId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", insertable = false, updatable = false)
    private PermissionGroup permissionGroup;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();
}
