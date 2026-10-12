## Purpose

Provides a secure, short-lived session tracking mechanism between multiple authentication steps to prevent step-bypassing and ensure proper flow order.

## ADDED Requirements

### Requirement: Step 1 initiates pre-auth session
The system SHALL generate and return a unique pre-auth session identifier upon successful completion of the first login step (e.g., verifying identifier, password, and captcha), instead of relying on the client to re-submit the user identifier in step 2.

#### Scenario: Successful step 1 login
- **WHEN** a user provides valid primary credentials (identifier and password)
- **THEN** the server returns an `authSessionId` to be used for subsequent steps

### Requirement: Step 2 requires valid pre-auth session
The system SHALL require a valid, unexpired pre-auth session identifier to proceed with any second-step authentication actions (such as selecting a delivery method, sending an OTP, or verifying an OTP).

#### Scenario: Requesting OTP delivery method selection
- **WHEN** a user attempts to select an OTP delivery method using a valid `authSessionId`
- **THEN** the system validates the session and sends the OTP

#### Scenario: Bypassing step 1
- **WHEN** a user attempts to access step 2 endpoints (like select-phone) without a valid `authSessionId`
- **THEN** the system rejects the request with an unauthorized or bad request error

### Requirement: Pre-auth session expiration
The pre-auth session SHALL automatically expire after a brief period of inactivity (e.g., 5 minutes) to prevent long-lived dangling sessions.

#### Scenario: Expired session usage
- **WHEN** a user attempts to use an `authSessionId` that is older than the idle timeout
- **THEN** the system rejects the request and forces the user to restart the login flow
