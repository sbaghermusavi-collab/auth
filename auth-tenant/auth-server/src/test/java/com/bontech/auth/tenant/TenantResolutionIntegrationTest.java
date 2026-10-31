//package com.bontech.auth.tenant;
//
//import com.bontech.auth.config.AppProperties;
//import com.bontech.auth.entity.Tenant;
//import com.bontech.auth.repository.TenantRepository;
//import org.junit.jupiter.api.AfterEach;
//import org.junit.jupiter.api.BeforeEach;
//import org.junit.jupiter.api.Test;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
//import org.springframework.boot.test.context.SpringBootTest;
//import org.springframework.test.web.servlet.MockMvc;
//
//import java.time.Instant;
//
//import static org.assertj.core.api.Assertions.assertThat;
//import static org.hamcrest.Matchers.containsString;
//import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
//import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
//import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.model;
//import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
//
//@SpringBootTest
//@AutoConfigureMockMvc
//class TenantResolutionIntegrationTest {
//
//    @Autowired
//    private MockMvc mockMvc;
//
//    @Autowired
//    private TenantRepository tenantRepository;
//
//    @Autowired
//    private AppProperties appProperties;
//
//    @Autowired
//    private TenantConfigCacheService tenantConfigCacheService;
//
//    private Tenant defaultTenant;
//    private Tenant customTenant;
//
//    @BeforeEach
//    void setUp() {
//        defaultTenant = tenantRepository.findByCode("default")
//                .map(t -> {
//                    t.setName("سامانه پیش‌فرض آسانک");
//                    t.setBaseUrl("http://default.local");
//                    return tenantRepository.save(t);
//                })
//                .orElseGet(() -> tenantRepository.save(Tenant.builder()
//                        .code("default")
//                        .name("سامانه پیش‌فرض آسانک")
//                        .baseUrl("http://default.local")
//                        .createdAt(Instant.now())
//                        .updatedAt(Instant.now())
//                        .version(0L)
//                        .build()));
//
//        customTenant = tenantRepository.findByCode("sms-ir")
//                .map(t -> {
//                    t.setName("شرکت پیامک ایرانیان");
//                    t.setBaseUrl("http://sms.local");
//                    return tenantRepository.save(t);
//                })
//                .orElseGet(() -> tenantRepository.save(Tenant.builder()
//                        .code("sms-ir")
//                        .name("شرکت پیامک ایرانیان")
//                        .baseUrl("http://sms.local")
//                        .createdAt(Instant.now())
//                        .updatedAt(Instant.now())
//                        .version(0L)
//                        .build()));
//
//        tenantConfigCacheService.refreshAll();
//    }
//
//    @AfterEach
//    void tearDown() {
//        TenantContext.clear();
//    }
//
//    @Test
//    void whenNoTenantHeaderOrParam_thenDefaultsToConfiguredDefaultTenant() throws Exception {
//        mockMvc.perform(get("/login"))
//                .andExpect(status().isOk())
//                .andExpect(model().attribute("tenantCode", "default"))
//                .andExpect(model().attribute("brandName", "سامانه پیش‌فرض آسانک"))
//                .andExpect(model().attribute("tenantId", defaultTenant.getId()));
//
//        // TenantContext is cleaned up after request filter chain completes
//        assertThat(TenantContext.getTenantId()).isNull();
//    }
//
//    @Test
//    void whenTenantQueryParamProvided_thenResolvesSpecificTenant() throws Exception {
//        mockMvc.perform(get("/login").param("tenant", "sms-ir"))
//                .andExpect(status().isOk())
//                .andExpect(model().attribute("tenantCode", "sms-ir"))
//                .andExpect(model().attribute("brandName", "شرکت پیامک ایرانیان"))
//                .andExpect(model().attribute("tenantId", customTenant.getId()));
//    }
//
//    @Test
//    void whenTenantHeaderProvided_thenResolvesSpecificTenant() throws Exception {
//        mockMvc.perform(get("/login").header("X-Tenant-Id", "sms-ir"))
//                .andExpect(status().isOk())
//                .andExpect(model().attribute("tenantCode", "sms-ir"))
//                .andExpect(model().attribute("brandName", "شرکت پیامک ایرانیان"))
//                .andExpect(model().attribute("tenantId", customTenant.getId()));
//    }
//
//    @Test
//    void whenHostHeaderMatchesBaseUrl_thenResolvesMatchingTenant() throws Exception {
//        mockMvc.perform(get("/login").header("Host", "sms.local:8090"))
//                .andExpect(status().isOk())
//                .andExpect(model().attribute("tenantCode", "sms-ir"))
//                .andExpect(model().attribute("brandName", "شرکت پیامک ایرانیان"))
//                .andExpect(model().attribute("tenantId", customTenant.getId()));
//    }
//}
