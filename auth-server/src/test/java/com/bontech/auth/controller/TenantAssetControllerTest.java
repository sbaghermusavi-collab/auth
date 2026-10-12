package com.bontech.auth.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class TenantAssetControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void testThemeCssDefault() throws Exception {
        mockMvc.perform(get("/tenant-assets/theme.css"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/css"))
                .andExpect(header().string("X-Tenant-Asset", "default"))
                .andExpect(content().string(containsString("--accent: #0C747C")));
    }

    @Test
    void testThemeCssByHeaderSmslocal() throws Exception {
        mockMvc.perform(get("/tenant-assets/theme.css").header("X-TENANT-ID", "smslocal"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/css"))
                .andExpect(header().string("X-Tenant-Asset", "smslocal"))
                .andExpect(content().string(containsString("--accent: #0288D1")));
    }

    @Test
    void testThemeCssByHeaderAsanlocal() throws Exception {
        mockMvc.perform(get("/tenant-assets/theme.css").header("X-TENANT-ID", "asanlocal"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/css"))
                .andExpect(header().string("X-Tenant-Asset", "asanlocal"))
                .andExpect(content().string(containsString("--accent: #2E7D32")));
    }

    @Test
    void testThemeCssByPathSmslocal() throws Exception {
        mockMvc.perform(get("/tenant-assets/smslocal/theme.css"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/css"))
                .andExpect(header().string("X-Tenant-Asset", "smslocal"))
                .andExpect(content().string(containsString("--accent: #0288D1")));
    }

    @Test
    void testLogoDefault() throws Exception {
        mockMvc.perform(get("/tenant-assets/logo"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Tenant-Asset", "default"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.valueOf("image/svg+xml")))
                .andExpect(content().string(containsString("ASANAK")));
    }

    @Test
    void testLogoByHeaderSmslocal() throws Exception {
        mockMvc.perform(get("/tenant-assets/logo").header("X-TENANT-ID", "smslocal"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Tenant-Asset", "smslocal"))
                .andExpect(content().string(containsString("SMS LOCAL")));
    }

    @Test
    void testLogoByHeaderAsanlocal() throws Exception {
        mockMvc.perform(get("/tenant-assets/logo").header("X-TENANT-ID", "asanlocal"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Tenant-Asset", "asanlocal"))
                .andExpect(content().string(containsString("ASAN LOCAL")));
    }

    @Test
    void testAnimationJsDefault() throws Exception {
        mockMvc.perform(get("/tenant-assets/animation.js"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("application/javascript"))
                .andExpect(header().string("X-Tenant-Asset", "default"))
                .andExpect(content().string(containsString("initAnimation")));
    }

    @Test
    void testAnimationJsAsanlocal() throws Exception {
        mockMvc.perform(get("/tenant-assets/asanlocal/animation.js"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("application/javascript"))
                .andExpect(header().string("X-Tenant-Asset", "asanlocal"))
                .andExpect(content().string(containsString("initAnimation")));
    }
}
