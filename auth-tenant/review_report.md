# Codebase Review Summary Report

## Overview
A code review of the Spring Boot multi-tenant AuthZ/AuthN server focused on authentication security, tenant-aware persistence, runtime stability, and build verification.

## Findings & Fixes Applied

### 1. Authentication endpoint authorization
**Finding:** `SecurityConfig` allowed every `/api/auth/**` route anonymously. This exposed sensitive authenticated routes such as `/api/auth/impersonate` and `/api/auth/me/token` alongside the intended public login, registration, OTP, password-expiry, and refresh endpoints.

**Fix Applied:**
- Replaced the broad `/api/auth/**` permit rule with explicit public POST endpoints for registration, login, OTP verification, expired-password change, and refresh.
- Required authentication for `/api/auth/me/**`.
- Required the `ADMIN` role for `/api/auth/impersonate`.

### 2. Password-expiry null safety
**Finding:** Authentication flows called `user.getPasswordExpiresAt().isBefore(...)` directly. If legacy/imported users are missing an expiry timestamp, login or refresh can fail with a `NullPointerException` instead of forcing a safe password-change flow.

**Fix Applied:**
- Centralized password-expiry checks in `AuthService#isPasswordChangeRequired`.
- Treat a missing expiry as requiring a password change.
- Reused the helper from login, phone selection, OTP verification, and refresh flows.

### 3. OTP generation quality and edge cases
**Finding:** OTP codes were generated with `java.util.Random`, which is not appropriate for security-sensitive verification codes, and login with OTP enabled assumed at least one phone number existed.

**Fix Applied:**
- Switched OTP generation to a shared `SecureRandom` instance.
- Preserved six-digit OTP formatting across the full `000000` to `999999` range.
- Added an explicit `No phone numbers found` validation before attempting OTP delivery.

### 4. Tenant schema compatibility
**Finding:** `Tenant` inherits `AuditableEntity`, which maps a `tenant_id` column, but the initial `tenants` table migration did not create that column. Hibernate-managed inserts/queries for tenants can therefore fail against a freshly migrated database.

**Fix Applied:**
- Added a nullable `tenant_id` column to the initial `tenants` table migration to match the mapped entity model.

## Verification
- XML changelog parsing succeeds for the modified migration and master changelog.
- Maven tests could not be executed in this environment because Maven Central returned HTTP 403 while resolving the Spring Boot parent POM.
