## 1. Domain & Caching Setup

- [x] 1.1 Add `spring-boot-starter-data-redis` and remove `caffeine` from `pom.xml`
- [x] 1.2 Configure a `RedisTemplate<String, PreAuthSession>` for pre-auth sessions
- [x] 1.3 Create a `docker-compose.yml` to spin up a local Redis instance for development
- [x] 1.4 Create a `PreAuthSession` record/class to store the authenticated `identifier` and `candidates`

## 2. API Contract Updates

- [x] 2.1 Update `AuthDto.LoginStartResponse` to add the `authSessionId` field
- [x] 2.2 Update `AuthDto.SelectPhoneRequest`, `AuthDto.SendOtpRequest`, and `AuthDto.TwoStepVerifyRequest` to accept `authSessionId` instead of `identifier`
- [x] 2.3 Modify the controller endpoints in `AuthController.java` to reflect these DTO changes

## 3. Core Login Logic Updates

- [x] 3.1 Update `AuthService.loginStepOne` to generate a UUID, create a `PreAuthSession`, store it in the cache, and return the `authSessionId`
- [x] 3.2 Update `AuthService.selectPhone` to lookup the `PreAuthSession` by `authSessionId` from the cache. Validate that the session exists and use its stored identifier to proceed
- [x] 3.3 Update `AuthService.sendOtp` to lookup the `PreAuthSession` by `authSessionId`
- [x] 3.4 Update `AuthService.verifySecondStep` to lookup the `PreAuthSession` by `authSessionId`, verify the OTP, and optionally evict the session upon success

## 4. Frontend & Views Updates

- [x] 4.1 Update `login.html`, `method.html`, and `otp.html` to store and pass `authSessionId` in JavaScript fetch calls or hidden form fields
- [x] 4.2 Ensure UI redirect logic between pages correctly passes the `authSessionId`

## 5. Testing

- [x] 5.1 Update unit tests in `AuthServiceOtpTest` to mock Redis/cache and use new DTO structures
- [x] 5.2 Add test to verify invalid/expired `authSessionId` throws error
