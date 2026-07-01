<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!doctype html>
<html lang="fa" dir="rtl" data-auth-tone="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>آسانک — ثبت‌نام</title>
    <style>
      /* Inject basic styles to make it render somewhat correctly without styles.css if not present */
      body { font-family: Tahoma, Arial, sans-serif; background: #111; color: #fff; margin: 0; padding: 0; direction: rtl; }
      .auth-root { display: flex; min-height: 100vh; }
      .form-shell { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; }
      .auth-dark { flex: 1; background: #000; display: none; }
      @media (min-width: 768px) { .auth-dark { display: flex; flex-direction: column; justify-content: space-between; padding: 40px; } }
      .form-card { background: #222; padding: 30px; border-radius: 12px; width: 100%; max-width: 400px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }
      .fld { margin-bottom: 15px; }
      .fld-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
      .fld-input, .otp-cell { width: 100%; padding: 10px; border-radius: 6px; border: 1px solid #444; background: #333; color: #fff; }
      .btn { width: 100%; padding: 12px; border-radius: 6px; border: none; cursor: pointer; font-weight: bold; margin-bottom: 10px; }
      .btn-primary { background: #007bff; color: #fff; }
      .btn-outline { background: transparent; border: 1px solid #007bff; color: #007bff; }
      .link { color: #007bff; text-decoration: none; }
      .center { text-align: center; }
      .error-msg { color: #ff4d4d; font-size: 12px; display: none; margin-top: 5px; }
    </style>
    <!-- Assuming styles.css is available in the web root -->
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <div class="auth-root">
      <div class="form-shell">
        <div class="brand-logo" style="margin-bottom: 20px; text-align: center;">
          <span class="mark">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H10l-4 3v-3H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
              <path d="M8 9.5h8M8 12.5h5" />
            </svg>
          </span>
          <span class="name" style="font-size: 24px; font-weight: bold; margin-right: 10px;">آسانک</span>
        </div>

        <div class="form-center">
            <div class="form-card fade-up" id="form-card"><div style="margin-bottom:24px"><h1 class="scr-title center">ساخت حساب کاربری</h1><p class="muted" style="margin-top:9px;font-size:14.5px;text-align:center">قبلاً ثبت&zwnj;نام کرده&zwnj;اید؟ <a href="login.html" class="link">
  وارد شوید
</a>
</p></div><div class="fld"><div class="fld-row"><label class="field-label">نام و نام خانوادگی</label></div><div class="fld-wrap"><input class="fld-input tnum" id="f-name" placeholder="مثلاً سارا کریمی" autocomplete="off"><span class="lead"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="8" r="4"></circle><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"></path></svg></span></div></div><div class="fld"><div class="fld-row"><label class="field-label">شماره موبایل</label></div><div class="fld-wrap" dir="ltr"><input class="fld-input tnum" id="f-phone" placeholder="۰۹۱۲ ۳۴۵ ۶۷۸۹" inputmode="numeric" autocomplete="off"><span class="lead"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"></path></svg></span></div></div><div class="fld"><div class="fld-row"><label class="field-label">نام کاربری</label></div><div class="fld-wrap" dir="ltr"><input class="fld-input tnum" id="f-username" placeholder="asanak_user" autocomplete="off"><span class="lead"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="4"></circle><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.9 7.9"></path></svg></span></div></div><div class="fld"><label class="field-label">رمز عبور</label><div class="fld-wrap"><input class="fld-input" id="f-pw" type="password" placeholder="حداقل ۸ کاراکتر"><span class="lead"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><rect x="4" y="10" width="16" height="11" rx="2"></rect><path d="M8 10V7a4 4 0 0 1 8 0v3"></path></svg></span><button type="button" class="fld-toggle" data-act="pw-toggle" aria-label="نمایش رمز"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"></path><circle cx="12" cy="12" r="3"></circle></svg></button></div><div class="pw-meter" id="pw-meter"><i></i><i></i><i></i><i></i></div><p class="pw-label" id="pw-label" style="display:none"></p></div><button class="btn btn-primary btn-block" id="primary" style="height:48px;margin-top:22px" disabled="">ساخت حساب کاربری<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M19 12H5"></path><path d="m12 19-7-7 7-7"></path></svg></button><div class="or-div">یا</div><button class="btn btn-outline btn-block" id="otp-login" style="height:46px"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"></path></svg>ثبت&zwnj;نام با کد پیامکی</button><p class="note" style="margin-top:22px;line-height:2">با ثبت&zwnj;نام، <a class="link" style="font-weight:600">قوانین و مقررات</a> و <a class="link" style="font-weight:600">حریم خصوصی</a> را می&zwnj;پذیرید.</p></div>
        </div>
      </div>

      <!-- پنل برند (کامل) -->
      <aside class="auth-dark">
        <!-- Original brand panel content -->
        <div class="auth-top">
          <h2>هر مشتری را<br /><b>بهتر بشناسید</b></h2>
          <p>پیامک، تماس صوتی و تحلیل رفتار مشتری — همه در یک پلتفرم یکپارچه و زنده.</p>
        </div>
      </aside>
    </div>

    <script>
      const btnPrimary = document.getElementById('primary');
      const signupError = document.createElement('div');
      signupError.className = 'error-msg';
      document.querySelector('.form-card').appendChild(signupError);

      if(btnPrimary) btnPrimary.disabled = false;

      if(btnPrimary) {
          btnPrimary.addEventListener('click', async (e) => {
              e.preventDefault();
              const name = document.getElementById('f-name').value;
              const phone = document.getElementById('f-phone').value;
              const username = document.getElementById('f-username').value;
              const password = document.getElementById('f-pw').value;

              if(!phone || !username || !password) {
                  signupError.textContent = "لطفاً فیلدهای الزامی را پر کنید.";
                  signupError.style.display = 'block';
                  return;
              }

              // Prepare RegistrationRequest DTO payload
              const payload = {
                  tenantCode: username + "_tenant", // Simplification since UI doesn't have it
                  tenantName: name || username,
                  tenantBaseUrl: "http://localhost/" + username,
                  username: username,
                  password: password,
                  systemUser: false,
                  phones: [
                      { phoneNumber: phone, nationalCode: "IR", preferred: true }
                  ],
                  roleCodes: ["USER"]
              };

              try {
                  const res = await fetch('/api/auth/register', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload)
                  });

                  if(!res.ok) {
                      const errText = await res.text();
                      throw new Error("ثبت‌نام ناموفق بود: " + errText);
                  }

                  // On success redirect to login
                  window.location.href = '/login';
              } catch (err) {
                  signupError.textContent = err.message;
                  signupError.style.display = 'block';
              }
          });
      }

      // OTP Register routing
      const btnOtp = document.getElementById('otp-login');
      if(btnOtp) {
          btnOtp.addEventListener('click', (e) => {
              e.preventDefault();
              // In this flow, we might redirect to login to use OTP or show error
              signupError.textContent = "برای ورود با کد پیامکی لطفاً به صفحه ورود بروید.";
              signupError.style.display = 'block';
              setTimeout(() => { window.location.href = '/login'; }, 2000);
          });
      }
    </script>
  </body>
</html>
