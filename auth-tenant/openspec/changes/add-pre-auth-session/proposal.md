## Why

Currently, the `SelectPhoneRequest` and `TwoStepVerifyRequest` APIs rely solely on the `identifier` passed in the payload. This allows an attacker to bypass the first step of authentication (password and captcha) and directly call these endpoints to spam users with SMS OTPs (pre-authentication bypass/enumeration vulnerability). We need a secure way to track the state of a login attempt between steps.

## What Changes

- Introduce a pre-authentication session (`auth-session`) created during step 1 of login.
- **BREAKING**: `POST /api/auth/login` will return an `authSessionId` in the response instead of just the next step.
- **BREAKING**: `POST /api/auth/login/select-phone` and other step 2 APIs will require the `authSessionId` to proceed, validating that the user successfully passed step 1.
- Store the session using Redis with a 5-minute TTL.

## Capabilities

### New Capabilities
- `pre-auth-session`: A short-lived, pre-authentication session mechanism to securely track multi-step login flows and prevent step-bypassing.

### Modified Capabilities

## Impact

- **APIs**: Modifies `AuthDto.LoginStartResponse` and `AuthDto.SelectPhoneRequest`/`SendOtpRequest`/`TwoStepVerifyRequest` to utilize the new session ID.
- **Frontend**: Must be updated to read `authSessionId` from step 1 and pass it to subsequent steps.
- **Dependencies**: Requires `spring-boot-starter-data-redis` and a running Redis instance (e.g., via Docker).
