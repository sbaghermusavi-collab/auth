package com.bontech.auth;

import com.bontech.auth.dto.AdminDto;
import com.bontech.auth.dto.TenantAdminDto;
import com.bontech.auth.entity.Permission;
import com.bontech.auth.entity.Role;
import com.bontech.auth.entity.Tenant;
import com.bontech.auth.entity.UserAccount;
import com.bontech.auth.repository.PermissionRepository;
import com.bontech.auth.repository.RoleRepository;
import com.bontech.auth.repository.TenantRepository;
import com.bontech.auth.repository.UserAccountRepository;
import com.bontech.auth.service.TenantManagementService;
import com.bontech.auth.tenant.TenantContext;
import com.bontech.auth.tenant.TenantResolver;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class TenantSystemAdminTest {

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private PermissionRepository permissionRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private TenantManagementService tenantManagementService;

    @Autowired
    private TenantResolver tenantResolver;

    @Autowired
    private com.bontech.auth.controller.TenantAdminController tenantAdminController;

    private Tenant defaultTenant;

    @BeforeEach
    void setUp() {
        defaultTenant = tenantResolver.getDefaultTenant();
        assertNotNull(defaultTenant);
    }

    @Test
    void testDefaultTenantHeaderResolution() {
        MockHttpServletRequest requestWithoutHeader = new MockHttpServletRequest();
        Long resolvedId = tenantResolver.resolveTenantId(requestWithoutHeader);
        assertEquals(defaultTenant.getId(), resolvedId);

        MockHttpServletRequest requestWithHeader = new MockHttpServletRequest();
        requestWithHeader.addHeader("X-TENANT-ID", String.valueOf(defaultTenant.getId()));
        Long resolvedWithHeader = tenantResolver.resolveTenantId(requestWithHeader);
        assertEquals(defaultTenant.getId(), resolvedWithHeader);
    }

    @Test
    void testSysAdminCreateTenantWithSourceCloning() {
        // Create base permission & role in default tenant
        Permission perm = permissionRepository.save(Permission.builder()
                .code("READ_DATA")
                .description("Read data permission")
                .tenantId(defaultTenant.getId())
                .active(true)
                .build());

        Set<Permission> perms = new LinkedHashSet<>();
        perms.add(perm);

        Role role = roleRepository.save(Role.builder()
                .code("DATA_VIEWER")
                .tenantId(defaultTenant.getId())
                .permissions(perms)
                .build());

        // Sys admin creates new tenant selecting defaultTenant as source
        AdminDto.TenantCreateRequest createReq = new AdminDto.TenantCreateRequest(
                "tenant-alpha", "Alpha Corp", "https://alpha.example.com", defaultTenant.getId());

        AdminDto.TenantResponse tenantResp = tenantManagementService.createTenant(createReq);
        assertNotNull(tenantResp.id());
        assertEquals("tenant-alpha", tenantResp.code());

        // Verify cloned permission exists for new tenant
        List<Permission> clonedPerms = permissionRepository.findByTenantId(tenantResp.id());
        assertTrue(clonedPerms.stream().anyMatch(p -> "READ_DATA".equals(p.getCode())));

        // Verify cloned role exists for new tenant and links to cloned permission
        List<Role> clonedRoles = roleRepository.findByTenantId(tenantResp.id());
        assertTrue(clonedRoles.stream().anyMatch(r -> "DATA_VIEWER".equals(r.getCode())));
    }

    @Test
    void testSysAdminAssignTenantAdmin() {
        AdminDto.TenantCreateRequest createReq = new AdminDto.TenantCreateRequest(
                "tenant-beta", "Beta Corp", "https://beta.example.com", null);
        AdminDto.TenantResponse tenantResp = tenantManagementService.createTenant(createReq);

        AdminDto.AssignTenantAdminRequest assignReq = new AdminDto.AssignTenantAdminRequest(
                tenantResp.id(), "beta_admin", "Secret123!", false);

        TenantAdminDto.UserResponse adminUser = tenantManagementService.assignTenantAdmin(assignReq);
        assertNotNull(adminUser.id());
        assertEquals("beta_admin", adminUser.username());
        assertEquals(tenantResp.id(), adminUser.tenantId());
        assertTrue(adminUser.roles().contains("ADMIN"));
    }

    @Test
    void testAdminCannotAssignRoleFromOtherTenant() {
        AdminDto.TenantResponse tenantResp = tenantManagementService.createTenant(new AdminDto.TenantCreateRequest(
                "tenant-gamma", "Gamma Corp", "https://gamma.example.com", null));

        Role otherTenantRole = roleRepository.save(Role.builder()
                .code("OTHER_ROLE")
                .tenantId(defaultTenant.getId())
                .permissions(new LinkedHashSet<>())
                .build());

        // Admin of tenant-gamma tries to create user with otherTenantRole -> should be rejected
        TenantAdminDto.UserCreateRequest userReq = new TenantAdminDto.UserCreateRequest(
                "user_gamma", "password", false, tenantResp.id(), Set.of(otherTenantRole.getId()));

        assertThrows(IllegalArgumentException.class, () -> {
            tenantAdminController.create("ADMIN", tenantResp.id(), userReq);
        });
    }
}
