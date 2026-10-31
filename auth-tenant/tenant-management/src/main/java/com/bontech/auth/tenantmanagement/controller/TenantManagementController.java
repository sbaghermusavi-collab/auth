package com.bontech.auth.tenantmanagement.controller;

import com.bontech.auth.tenantmanagement.dto.TenantDto.*;
import com.bontech.auth.tenantmanagement.service.TenantManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
public class TenantManagementController {

    private final TenantManagementService tenantManagementService;

    @GetMapping("/tenants")
    public ResponseEntity<List<TenantResponse>> getAllTenants() {
        return ResponseEntity.ok(tenantManagementService.getAllTenants());
    }

    @GetMapping("/tenants/{id}")
    public ResponseEntity<TenantResponse> getTenantById(@PathVariable Long id) {
        return ResponseEntity.ok(tenantManagementService.getTenantById(id));
    }

    @PostMapping("/tenants")
    public ResponseEntity<TenantResponse> createTenant(
            @Valid @RequestBody TenantCreateRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        String actor = extractUsername(jwt);
        TenantResponse response = tenantManagementService.createTenant(request, actor);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/tenants/{id}")
    public ResponseEntity<TenantResponse> updateTenant(
            @PathVariable Long id,
            @Valid @RequestBody TenantUpdateRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        String actor = extractUsername(jwt);
        return ResponseEntity.ok(tenantManagementService.updateTenant(id, request, actor));
    }

    @DeleteMapping("/tenants/{id}")
    public ResponseEntity<Map<String, String>> deleteTenant(@PathVariable Long id) {
        tenantManagementService.deleteTenant(id);
        return ResponseEntity.ok(Map.of("message", "مستأجر با موفقیت حذف گردید"));
    }

    @PostMapping("/tenants/{id}/clone")
    public ResponseEntity<TenantResponse> cloneTenant(
            @PathVariable Long id,
            @Valid @RequestBody TenantCloneRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        String actor = extractUsername(jwt);
        TenantResponse cloned = tenantManagementService.cloneTenant(id, request, actor);
        return ResponseEntity.status(HttpStatus.CREATED).body(cloned);
    }

    @PostMapping("/tenants/clone")
    public ResponseEntity<TenantResponse> cloneTenantFromPayload(
            @Valid @RequestBody TenantCloneRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        if (request.sourceTenantId() == null) {
            throw new IllegalArgumentException("sourceTenantId is required");
        }
        String actor = extractUsername(jwt);
        TenantResponse cloned = tenantManagementService.cloneTenant(request.sourceTenantId(), request, actor);
        return ResponseEntity.status(HttpStatus.CREATED).body(cloned);
    }

    @PostMapping(value = "/tenants/{id}/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadLogo(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) throws IOException {
        String logoUrl = tenantManagementService.uploadLogo(id, file);
        return ResponseEntity.ok(Map.of("logoUrl", logoUrl, "message", "لوگو با موفقیت به‌روزرسانی شد"));
    }

    @PostMapping("/tenants/{id}/impersonate")
    public ResponseEntity<ImpersonateTenantResponse> impersonateTenant(
            @PathVariable Long id,
            @RequestBody(required = false) ImpersonateTenantRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        String actor = extractUsername(jwt);
        ImpersonateTenantRequest req = (request != null) ? request : new ImpersonateTenantRequest(null);
        return ResponseEntity.ok(tenantManagementService.impersonateTenant(id, req, actor));
    }

    @GetMapping("/modules")
    public ResponseEntity<List<ModuleInfoDto>> getModules() {
        return ResponseEntity.ok(tenantManagementService.getAvailableModules());
    }

    private String extractUsername(Jwt jwt) {
        if (jwt == null) return "superadmin";
        String username = jwt.getClaimAsString("preferred_username");
        if (username != null && !username.isBlank()) return username;
        username = jwt.getClaimAsString("username");
        if (username != null && !username.isBlank()) return username;
        return jwt.getSubject() != null ? jwt.getSubject() : "superadmin";
    }
}
