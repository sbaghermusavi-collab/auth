package com.bontech.auth.tenant;

import com.bontech.auth.config.AppProperties;
import com.bontech.auth.entity.Tenant;
import com.bontech.auth.repository.TenantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TenantConfigCacheServiceTest {

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private AppProperties properties;

    @InjectMocks
    private TenantConfigCacheService cacheService;

    private Tenant testTenant;

    @BeforeEach
    void setUp() {
        testTenant = Tenant.builder()
                .id(100L)
                .code("acme")
                .name("Acme Corp")
                .title("Acme Portal")
                .themeTone("dark")
                .animationType("matrix")
                .primaryColor("#123456")
                .secondaryColor("#654321")
                .authBg("#000000")
                .otpEnabled(true)
                .passwordEnabled(false)
                .captchaEnabled(true)
                .build();
    }

    @Test
    @DisplayName("Preload on startup and get by code and id from RAM")
    void testPreloadAndGetFromRam() {
        when(tenantRepository.findAll()).thenReturn(List.of(testTenant));

        cacheService.onApplicationReady();

        verify(tenantRepository, times(1)).findAll();

        TenantUiConfig cfg = cacheService.getUiConfigByCode("acme");
        assertThat(cfg).isNotNull();
        assertThat(cfg.getBrandName()).isEqualTo("Acme Corp");
        assertThat(cfg.getTitle()).isEqualTo("Acme Portal");
        assertThat(cfg.getThemeTone()).isEqualTo("dark");
        assertThat(cfg.getAnimationType()).isEqualTo("matrix");
        assertThat(cfg.getPrimaryColor()).isEqualTo("#123456");
        assertThat(cfg.getSecondaryColor()).isEqualTo("#654321");
        assertThat(cfg.getAuthBg()).isEqualTo("#000000");
        assertThat(cfg.isOtpEnabled()).isTrue();
        assertThat(cfg.isPasswordEnabled()).isFalse();
        assertThat(cfg.isCaptchaEnabled()).isTrue();

        TenantUiConfig cfgById = cacheService.getUiConfigById(100L);
        assertThat(cfgById).isNotNull();
        assertThat(cfgById.getBrandName()).isEqualTo("Acme Corp");

        // Verify no second DB call needed since it's cached in RAM
        verify(tenantRepository, never()).findByCode(any());
    }

    @Test
    @DisplayName("Refresh updates memory cache for tenant")
    void testRefreshUpdatesCache() {
        when(tenantRepository.findAll()).thenReturn(List.of(testTenant));
        cacheService.onApplicationReady();

        testTenant.setName("Acme Updated");
        testTenant.setPrimaryColor("#999999");
        when(tenantRepository.findByCode("acme")).thenReturn(Optional.of(testTenant));

        cacheService.refresh("acme");

        TenantUiConfig updatedCfg = cacheService.getUiConfigByCode("acme");
        assertThat(updatedCfg.getBrandName()).isEqualTo("Acme Updated");
        assertThat(updatedCfg.getPrimaryColor()).isEqualTo("#999999");
    }

    @Test
    @DisplayName("Fallback to default when tenant not found")
    void testFallbackToDefault() {
        when(properties.getDefaultTenant()).thenReturn("default");
        var defConfig = new AppProperties.TenantConfig();
        defConfig.setBrandName("Default Asanak");
        when(properties.getDefaultTenantConfig()).thenReturn(defConfig);

        TenantUiConfig cfg = cacheService.getUiConfigByCode("unknown-tenant");
        assertThat(cfg).isNotNull();
        assertThat(cfg.getBrandName()).isEqualTo("Default Asanak");
    }
}
