# سرور احراز هویت و مجوز چند مستاجره (Multi-tenant) با Spring Boot

این پروژه یک سرور احراز هویت و مجوز (OAuth2 Authorization Server) پیاده‌سازی شده با Spring Boot، Spring Authorization Server و Spring Security OAuth2 است.

## ویژگی‌های پشتیبانی شده

- **چند مستاجره بودن (Multi-tenancy):** مدیریت چندین Tenant از طریق کلید خارجی و مسیرهای اختصاصی پایه (`baseUrl`).
- **سرویس ثبت‌نام (Registration Service):** امکان ثبت‌نام کاربران جدید.
- **اعتبارسنجی کپچا (Captcha):** بررسی امنیتی هنگام ورود به سیستم.
- **تایید دو مرحله‌ای (2FA):** با استفاده از سرویس پیامک قابل تنظیم (SMS Service).
- **ورود با شماره موبایل:** امکان لاگین با استفاده از شماره تلفن همراه.
- **پشتیبانی از شماره موبایل‌های متعدد و کد ملی:** مدیریت منعطف اطلاعات هویتی کاربران.
- **تولید توکن‌های JWT سفارشی:** شامل اطلاعاتی مانند نقش‌ها (Roles)، نام کاربری، شناسه و نام Tenant (توسط Spring Security OAuth2 JwtEncoder).
- **مدیریت دسترسی‌ها و نقش‌ها:** دارای APIهای کامل برای مدیریت کاربران، نقش‌ها و سطوح دسترسی (Permissions).
- **قابلیت Impersonation:** امکان ورود به عنوان یک کاربر دیگر (جهت بررسی و دیباگ توسط ادمین).
- **لاگ فعالیت‌ها و نشست‌های فعال:** ثبت لاگ اکشن‌ها، مدیریت نشست‌های فعال و امکان خروج (Sign-out) از سایر دستگاه‌ها.
- **گزارش‌گیری با Logstash و Elasticsearch:** خروجی لاگ‌های ساختاریافته در فرمت Logback جهت انتقال به Elastic و ایجاد داشبوردهای مانیتورینگ.
- **سیاست‌های رمز عبور:** اجبار به استفاده از ترکیب حروف و اعداد، تعیین زمان انقضای رمز عبور، و جلوگیری از استفاده مجدد از ۳ رمز عبور قبلی.
- **جریان انقضای رمز عبور:** فرآیند لاگین با موبایل که در صورت انقضای رمز، کاربر را مجبور به تغییر آن می‌کند.
- **مدیریت پایگاه داده و قفل‌گذاری:** استفاده از JPA Auditing و قفل‌های خوش‌بینانه (Optimistic Locking) در Entityها.
- **الگوی DTO و استفاده از Lombok:** ساختار کدهای تمیز، جلوگیری از کدهای تکراری و مدیریت کدهای Boilerplate.
- **مدیریت ساختار دیتابیس با Liquibase:** به همراه داده‌های اولیه (Seed Data) در قالب فایل‌های CSV.

## نحوه اتصال سرورهای منابع (Resource Servers)

سرورهای منابع (Resource Servers) می‌توانند به راحتی از طریق اعتبارسنجی توکن‌های JWT به این سرور احراز هویت متصل شوند.
کافیست در تنظیمات Spring Boot سرور منبع، آدرس `issuer-uri` مربوط به این پروژه را تنظیم کنید تا Resource Server بتواند کلیدهای عمومی (Public Keys) را برای اعتبارسنجی امضای JWTها دانلود کند.

**نمونه تنظیمات فایل `application.yml` در یک Resource Server:**
```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://localhost:8080 # آدرس پایه این سرور احراز هویت
```

با این تنظیم، Spring Security به صورت خودکار پیکربندی توکن‌ها و کلیدهای اعتبارسنجی را از مسیرهای `.well-known/openid-configuration` این سرور دریافت می‌کند.

## نحوه اتصال کلاینت‌ها (Clients)

کلاینت‌ها (مانند اپلیکیشن‌های موبایل، وب‌سایت‌ها، SPAها و میکروسرویس‌ها) می‌توانند با استفاده از پروتکل‌های استاندارد OAuth2 به این سرور متصل شوند و توکن دریافت کنند.

به صورت پیش‌فرض، تنظیمات یک کلاینت نمونه برای تست در سیستم موجود است:
- **Client ID:** `auth-client`
- **Client Secret:** `auth-secret`
- **Grant Type:** `client_credentials`

**نمونه تنظیمات اتصال یک کلاینت Spring Boot (در فایل `application.yml`):**
```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          my-client:
            client-id: auth-client
            client-secret: auth-secret
            authorization-grant-type: client_credentials
        provider:
          my-client:
            issuer-uri: http://localhost:8080
```

همچنین برای دریافت توکن به صورت مستقیم از طریق ابزارهایی مانند `curl` یا پست‌من (Postman) می‌توانید از نمونه درخواست زیر استفاده کنید:

```bash
curl -X POST http://localhost:8080/oauth2/token \
  -u auth-client:auth-secret \
  -d "grant_type=client_credentials"
```
توجه: برای کلاینت‌های کاربری (کاربر انسانی) باید از جریان `authorization_code` (به همراه PKCE) استفاده شود.

## اجرای پروژه

برای اجرای این پروژه از طریق Maven، دستور زیر را در ترمینال اجرا کنید:

```bash
mvn spring-boot:run
```

## مستندات API و Swagger

پس از اجرای پروژه، می‌توانید از طریق لینک‌های زیر به مستندات API دسترسی پیدا کنید:
- **رابط کاربری Swagger UI:** `/swagger-ui/index.html`
- **مستندات OpenAPI:** `/v3/api-docs`

همچنین مجموعه آماده‌ای از درخواست‌های Postman در مسیر زیر قرار داده شده است که می‌تواند برای تست مورد استفاده قرار گیرد:
- `postman/Auth-Server.postman_collection.json`
