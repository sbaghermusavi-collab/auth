## Context

As described in `proposal.md`, the current multi-step login flow is vulnerable to bypass because step 2 APIs only rely on the user's `identifier`. We need an architecture to store short-lived state between step 1 (password/captcha validation) and step 2 (OTP dispatch/verification). We will use Redis for shared, scalable state.

## Goals / Non-Goals

**Goals:**
- Provide a securely unguessable identifier (UUID) for the pre-auth session.
- Automatically expire sessions after 5 minutes of inactivity to limit the attack window.
- Store the authenticated `identifier` and any required candidate details (like masked phones) in the session to avoid re-querying the database in step 2.

**Non-Goals:**
- We are not migrating the main, fully authenticated UserSession logic to this new cache. This is purely for the ephemeral pre-auth state.

## Decisions

**1. Session Storage: Redis**
*Rationale*: Using Redis ensures our auth service is ready to scale horizontally behind a load balancer without sticky sessions. It natively supports TTL expiration for the pre-auth sessions.
*Alternatives Considered*: 
- Local In-Memory (Caffeine): Easier to set up locally but breaks if the service scales to multiple instances behind a load balancer.
- JWTs passed to the client: Avoids server state entirely, but harder to revoke.
- Database table: Requires schema migrations and cron jobs to clean up expired sessions.

**2. Session Identifier: UUID v4**
*Rationale*: Secure, cryptographically random, and easy to generate in Java. Returns as a simple string `authSessionId`.

**3. Cache Structure**
*Rationale*: The cache key is the `authSessionId` (String). The cache value is an object (e.g., `PreAuthSession`) containing:
- `identifier` (String)
- `candidates` (List of MaskedPhone, optional)

## Risks / Trade-offs

- **[Risk] State Loss on Restart:** If the auth server restarts, all in-progress login flows are lost.
  - *Mitigation*: This is acceptable for a 5-minute TTL. Users will just have to re-enter their username/password.
- **[Risk] Infrastructure Dependency:** Auth now relies on Redis being up and available.
  - *Mitigation*: Ensure Redis is properly monitored and deployed in a highly available configuration.

## Migration Plan

No database schema migrations are required. The frontend must be updated simultaneously with the backend deployment to ensure it starts passing `authSessionId`.
