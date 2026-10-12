package com.bontech.auth.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(name = "tenants")
@EntityListeners(AuditingEntityListener.class)
public class Tenant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String code;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, unique = true, length = 255)
    private String baseUrl;

    @Column(length = 500)
    private String description;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "favicon_url", length = 500)
    private String faviconUrl;

    @Column(name = "primary_color", length = 32)
    @lombok.Builder.Default
    private String primaryColor = "#2563eb";

    @Column(name = "secondary_color", length = 32)
    @lombok.Builder.Default
    private String secondaryColor = "#1e40af";

    @Column(name = "active_modules", length = 1000)
    @lombok.Builder.Default
    private String activeModules = "phonebook,sms,reports,webservice";

    @Column(name = "theme_config", columnDefinition = "TEXT")
    private String themeConfig;

    @Column(length = 255)
    private String title;

    @Column(name = "theme_tone", length = 32)
    @lombok.Builder.Default
    private String themeTone = "dark";

    @Column(name = "animation_type", length = 32)
    @lombok.Builder.Default
    private String animationType = "orbit";

    @Column(name = "auth_bg", length = 64)
    @lombok.Builder.Default
    private String authBg = "#072b2f";

    @Column(name = "otp_enabled", nullable = false)
    @lombok.Builder.Default
    private boolean otpEnabled = true;

    @Column(name = "password_enabled", nullable = false)
    @lombok.Builder.Default
    private boolean passwordEnabled = true;

    @Column(name = "captcha_enabled", nullable = false)
    @lombok.Builder.Default
    private boolean captchaEnabled = false;

    @Column(name = "active", nullable = false)
    @lombok.Builder.Default
    private boolean active = true;

    @Column(name = "admin_username", length = 100)
    private String adminUsername;

    @Column(name = "default_role_id")
    private Long defaultRoleId;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private Instant updatedAt;

    @CreatedBy
    @Column(updatable = false)
    private String createdBy;

    @LastModifiedBy
    private String updatedBy;

    @Version
    @Column(nullable = false)
    private Long version;
}
