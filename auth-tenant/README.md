# Spring Boot Multi-tenant AuthZ/AuthN Server

Implements an OAuth2 authentication/authorization server using Spring Boot 4, Spring Authorization Server and Spring Security OAuth2 with:

- Multi-tenancy (`Tenant` linked by foreign keys), and each tenant has its own `baseUrl` (Dual Mapping: FK field + read-only association).
- Registration service.
- Captcha validation on login.
- Two-step verification using pluggable SMS service.
- Login based on phone number.
- Support for users with multiple phone numbers and optional national code.
- JWT claims containing roles, username, tenant id, and tenant name, generated via Spring Security OAuth2 JwtEncoder.
- APIs for user roles/permissions, users by role, users by permission.
- Impersonation endpoint.
- Activity logging + active sessions + sign-out other sessions.
- Logback activity logs ready for Logstash shipping to Elasticsearch (for reporting/last-login dashboards).
- Password policy: letter+number required, password expiry, and block reuse of last 3 passwords.
- Password-expiry flow: user logs in by phone, then must change password when expired.
- JPA auditing and optimistic locking (`@Version`) in base entity.
- DTO grouping as static records per object domain.
- Lombok used for reducing boilerplate (`@Getter`, `@Setter`, `@RequiredArgsConstructor`, `@Slf4j`).

## Run

```bash
mvn spring-boot:run
```

## Key endpoints

- `POST /api/auth/register`
- `POST /api/auth/login/phone`
- `POST /api/auth/verify-2fa`
- `POST /api/auth/password/change-expired`
- `POST /api/auth/impersonate`
- `GET /api/users/{username}/authorization`
- `GET /api/users/by-role/{roleCode}`
- `GET /api/users/by-permission/{permissionCode}`
- `GET /api/sessions/{username}`
- `POST /api/sessions/sign-out-others`
- `GET /api/reports/users/{username}/logs`
- `GET /api/reports/users/{username}/activity`
- `POST /api/admin/permissions`
- `GET /api/admin/permissions`
- `GET /api/admin/permissions/{id}`
- `PUT /api/admin/permissions/{id}`
- `DELETE /api/admin/permissions/{id}`
- `POST /api/admin/roles`
- `GET /api/admin/roles`
- `GET /api/admin/roles/{id}`
- `PUT /api/admin/roles/{id}`
- `DELETE /api/admin/roles/{id}`
- `POST /api/tenant-admin/users`
- `GET /api/tenant-admin/users`
- `GET /api/tenant-admin/users/{id}`
- `PUT /api/tenant-admin/users/{id}`
- `DELETE /api/tenant-admin/users/{id}`
- `POST /api/groups`
- `GET /api/groups/{groupId}`
- `POST /api/groups/{groupId}/permissions`

## OAuth2 endpoints

- Authorization server endpoints are enabled through Spring Authorization Server config (`/oauth2/token`, OIDC metadata endpoints, etc.).
- Seeded sample OAuth2 client:
  - `client_id`: `auth-client`
  - `client_secret`: `auth-secret`
  - grant: `client_credentials`

## Notes

- `SmsService` is stubbed to logs and should be replaced with your own SMS provider integration.
- `CaptchaService` currently validates non-empty tokens and can be replaced with real captcha verification.
- `logback-spring.xml` emits structured activity logs suitable for Logstash ingestion into Elasticsearch.


## Swagger

- Swagger UI: `/swagger-ui/index.html`
- OpenAPI doc: `/v3/api-docs`


## Postman

- Collection file: `postman/Auth-Server.postman_collection.json`


## Database migrations

- Liquibase is enabled and manages schema creation and default seed data.
- Changelogs: `src/main/resources/db/changelog`
- Default CSV seed files: `src/main/resources/db/data`
