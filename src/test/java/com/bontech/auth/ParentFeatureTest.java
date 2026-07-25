package com.bontech.auth;

import com.bontech.auth.dto.ParentDto;
import com.bontech.auth.entity.Permission;
import com.bontech.auth.entity.Role;
import com.bontech.auth.entity.Tenant;
import com.bontech.auth.entity.UserAccount;
import com.bontech.auth.repository.PermissionRepository;
import com.bontech.auth.repository.RoleRepository;
import com.bontech.auth.repository.TenantRepository;
import com.bontech.auth.repository.UserAccountRepository;
import com.bontech.auth.service.ParentService;
import com.bontech.auth.tenant.TenantResolver;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class ParentFeatureTest {

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private PermissionRepository permissionRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private ParentService parentService;

    @Autowired
    private TenantResolver tenantResolver;

    private Tenant tenant;
    private Role parentRole;
    private Role customerRole;
    private Role adminRole;
    private Permission readPerm;
    private Permission writePerm;

    @BeforeEach
    void setUp() {
        tenant = tenantResolver.getDefaultTenant();

        readPerm = permissionRepository.save(Permission.builder()
                .code("CAN_READ")
                .description("Read permission")
                .tenantId(tenant.getId())
                .active(true)
                .build());

        writePerm = permissionRepository.save(Permission.builder()
                .code("CAN_WRITE")
                .description("Write permission")
                .tenantId(tenant.getId())
                .active(true)
                .build());

        Set<Permission> customerPerms = new LinkedHashSet<>();
        customerPerms.add(readPerm);

        customerRole = roleRepository.save(Role.builder()
                .code("CUSTOMER")
                .tenantId(tenant.getId())
                .permissions(customerPerms)
                .build());

        Set<Permission> adminPerms = new LinkedHashSet<>();
        adminPerms.add(readPerm);
        adminPerms.add(writePerm);

        adminRole = roleRepository.save(Role.builder()
                .code("ADMIN")
                .tenantId(tenant.getId())
                .permissions(adminPerms)
                .build());

        parentRole = roleRepository.save(Role.builder()
                .code("PARENT")
                .tenantId(tenant.getId())
                .permissions(customerPerms)
                .build());
    }

    @Test
    void testTenantAdminAssignChildrenToParent() {
        UserAccount parentUser = userAccountRepository.save(UserAccount.builder()
                .username("parent_john")
                .passwordHash("secret")
                .tenantId(tenant.getId())
                .roles(Set.of(parentRole, customerRole))
                .passwordExpiresAt(Instant.now().plus(90, ChronoUnit.DAYS))
                .build());

        UserAccount childUser = userAccountRepository.save(UserAccount.builder()
                .username("child_tom")
                .passwordHash("secret")
                .tenantId(tenant.getId())
                .roles(new LinkedHashSet<>())
                .passwordExpiresAt(Instant.now().plus(90, ChronoUnit.DAYS))
                .build());

        ParentDto.AssignChildrenRequest request = new ParentDto.AssignChildrenRequest(Set.of(childUser.getId()));
        List<ParentDto.ChildUserResponse> assigned = parentService.assignChildrenToParent(parentUser.getId(), request, tenant.getId());

        assertEquals(1, assigned.size());
        assertEquals("child_tom", assigned.get(0).username());
        assertEquals(parentUser.getId(), assigned.get(0).parentUserId());
    }

    @Test
    void testCannotAssignChildrenToUserWithoutParentRole() {
        UserAccount regularUser = userAccountRepository.save(UserAccount.builder()
                .username("regular_user")
                .passwordHash("secret")
                .tenantId(tenant.getId())
                .roles(Set.of(customerRole))
                .passwordExpiresAt(Instant.now().plus(90, ChronoUnit.DAYS))
                .build());

        UserAccount childUser = userAccountRepository.save(UserAccount.builder()
                .username("child_sam")
                .passwordHash("secret")
                .tenantId(tenant.getId())
                .roles(new LinkedHashSet<>())
                .passwordExpiresAt(Instant.now().plus(90, ChronoUnit.DAYS))
                .build());

        ParentDto.AssignChildrenRequest request = new ParentDto.AssignChildrenRequest(Set.of(childUser.getId()));
        assertThrows(IllegalArgumentException.class, () -> {
            parentService.assignChildrenToParent(regularUser.getId(), request, tenant.getId());
        });
    }

    @Test
    void testParentCanAssignPossessedRoleToChild() {
        UserAccount parentUser = userAccountRepository.save(UserAccount.builder()
                .username("parent_mary")
                .passwordHash("secret")
                .tenantId(tenant.getId())
                .roles(new LinkedHashSet<>(Set.of(parentRole, customerRole)))
                .passwordExpiresAt(Instant.now().plus(90, ChronoUnit.DAYS))
                .build());

        UserAccount childUser = userAccountRepository.save(UserAccount.builder()
                .username("child_lucy")
                .passwordHash("secret")
                .tenantId(tenant.getId())
                .parentUserId(parentUser.getId())
                .roles(new LinkedHashSet<>())
                .passwordExpiresAt(Instant.now().plus(90, ChronoUnit.DAYS))
                .build());

        // Parent assigns customerRole to child -> Success
        ParentDto.AssignChildRolesPermissionsRequest request = new ParentDto.AssignChildRolesPermissionsRequest(
                Set.of(customerRole.getId()), null);

        ParentDto.ChildUserResponse resp = parentService.assignRolesAndPermissionsToChild(
                parentUser.getUsername(), childUser.getId(), request, tenant.getId());

        assertTrue(resp.roles().contains("CUSTOMER"));
    }

    @Test
    void testParentCannotAssignRoleOrPermissionTheyDoNotPossess() {
        UserAccount parentUser = userAccountRepository.save(UserAccount.builder()
                .username("parent_bob")
                .passwordHash("secret")
                .tenantId(tenant.getId())
                .roles(new LinkedHashSet<>(Set.of(parentRole, customerRole)))
                .passwordExpiresAt(Instant.now().plus(90, ChronoUnit.DAYS))
                .build());

        UserAccount childUser = userAccountRepository.save(UserAccount.builder()
                .username("child_jim")
                .passwordHash("secret")
                .tenantId(tenant.getId())
                .parentUserId(parentUser.getId())
                .roles(new LinkedHashSet<>())
                .passwordExpiresAt(Instant.now().plus(90, ChronoUnit.DAYS))
                .build());

        // Parent tries to assign adminRole (which parent does NOT have) -> Rejected
        ParentDto.AssignChildRolesPermissionsRequest requestRole = new ParentDto.AssignChildRolesPermissionsRequest(
                Set.of(adminRole.getId()), null);

        assertThrows(IllegalArgumentException.class, () -> {
            parentService.assignRolesAndPermissionsToChild(parentUser.getUsername(), childUser.getId(), requestRole, tenant.getId());
        });

        // Parent tries to assign writePerm (which parent does NOT have) -> Rejected
        ParentDto.AssignChildRolesPermissionsRequest requestPerm = new ParentDto.AssignChildRolesPermissionsRequest(
                null, Set.of(writePerm.getId()));

        assertThrows(IllegalArgumentException.class, () -> {
            parentService.assignRolesAndPermissionsToChild(parentUser.getUsername(), childUser.getId(), requestPerm, tenant.getId());
        });
    }
}
