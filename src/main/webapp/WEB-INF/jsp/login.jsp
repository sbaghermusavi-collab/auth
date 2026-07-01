<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!doctype html>
<html lang="fa" dir="rtl" data-auth-tone="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>آسانک — ورود، ثبت‌نام</title>
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
      .otp-inputs { display: flex; gap: 10px; justify-content: center; margin-bottom: 20px; }
      .otp-cell { width: 40px; text-align: center; font-size: 20px; }
      .btn { width: 100%; padding: 12px; border-radius: 6px; border: none; cursor: pointer; font-weight: bold; margin-bottom: 10px; }
      .btn-primary { background: #007bff; color: #fff; }
      .btn-outline { background: transparent; border: 1px solid #007bff; color: #007bff; }
      .link { color: #007bff; text-decoration: none; }
      .center { text-align: center; }
      .error-msg { color: #ff4d4d; font-size: 12px; display: none; margin-top: 5px; }
      /* Add some global css from the original jsp if needed */
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
            <div id="panel-login"><div class="form-card fade-up" id="form-card">
            <div style="margin-bottom: 24px">
              <h1 class="scr-title center">ورود به حساب</h1>
              <p
                class="muted"
                style="margin-top: 9px; font-size: 14.5px; text-align: center"
              >
                حساب کاربری ندارید؟


                <a class="link" href="signup.html">
  ثبت&zwnj;نام کنید
</a>

              </p>
            </div>
            <div class="fld">
              <div class="fld-row">
                <label class="field-label">نام کاربری یا موبایل</label>
              </div>
              <div class="fld-wrap">
                <input
                  class="fld-input tnum"
                  id="f-identifier"
                  placeholder="نام کاربری یا ۰۹۱۲…"
                  autocomplete="off"
                /><span class="lead"
                  ><svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.9"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    style="flex-shrink: 0"
                  >
                    <circle cx="12" cy="8" r="4"></circle>
                    <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"></path></svg
                ></span>
              </div>
            </div>
            <div class="fld">
              <div class="fld-row">
                <label class="field-label">رمز عبور</label
                ><button type="button" class="fld-link">
                  فراموشی رمز عبور؟
                </button>
              </div>
              <div class="fld-wrap">
                <input
                  class="fld-input"
                  id="f-pw"
                  type="password"
                  placeholder="رمز عبور خود را وارد کنید"
                /><span class="lead"
                  ><svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.9"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    style="flex-shrink: 0"
                  >
                    <rect x="4" y="10" width="16" height="11" rx="2"></rect>
                    <path d="M8 10V7a4 4 0 0 1 8 0v3"></path></svg></span
                ><button
                  type="button"
                  class="fld-toggle"
                  data-act="pw-toggle"
                  aria-label="نمایش رمز"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.9"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    style="flex-shrink: 0"
                  >
                    <path
                      d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"
                    ></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
              </div>
            </div>
            <label class="chk on" data-act="remember" style="margin-top: 2px"
              ><span class="box"
                ><svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.9"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  style="flex-shrink: 0"
                >
                  <path d="M20 6 9 17l-5-5"></path></svg></span
              >مرا به خاطر بسپار</label
            >
            <div class="fld">
              <label class="field-label">کد امنیتی</label>
              <div class="captcha-row">
                <div class="fld-wrap" dir="ltr" id="cap-wrap" style="flex: 1">
                  <input
                    class="fld-input tnum"
                    id="f-captcha"
                    placeholder="کد تصویر"
                    maxlength="5"
                    autocomplete="off"
                    style="text-transform: uppercase; letter-spacing: 0.18em"
                  /><span class="lead"
                    ><svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.9"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      style="flex-shrink: 0"
                    >
                      <path
                        d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z"
                      ></path>
                      <path d="M9 12l2 2 4-4"></path></svg
                  ></span>
                </div>
                <div class="captcha-box">
                  <canvas id="cap-canvas" width="187" height="65"></canvas
                  ><button
                    type="button"
                    class="captcha-refresh"
                    data-act="cap-refresh"
                    title="کد جدید"
                    aria-label="کد جدید"
                  >
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.9"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      style="flex-shrink: 0"
                    >
                      <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                      <path d="M21 3v5h-5"></path>
                      <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
                      <path d="M3 21v-5h5"></path>
                    </svg>
                  </button>
                </div>
              </div>
              <p class="fld-hint error" id="cap-error" style="display: none">
                کد امنیتی نادرست است.
              </p>
            </div>
            <button
              class="btn btn-primary btn-block"
              id="primary"
              style="height: 48px; margin-top: 22px"
              disabled=""
            >
              ورود به حساب<svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.9"
                stroke-linecap="round"
                stroke-linejoin="round"
                style="flex-shrink: 0"
              >
                <path d="M19 12H5"></path>
                <path d="m12 19-7-7 7-7"></path>
              </svg>
            </button>
            <div class="or-div">یا</div>
            <button
              class="btn btn-outline btn-block"
              id="otp-login"
              style="height: 46px"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.9"
                stroke-linecap="round"
                stroke-linejoin="round"
                style="flex-shrink: 0"
              >
                <path
                  d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"
                ></path></svg
              >ورود با کد یک&zwnj;بارمصرف
            </button>
            <p class="note" style="margin-top: 22px; line-height: 2">
              با ورود،
              <a class="link" style="font-weight: 600">قوانین و مقررات</a> و
              <a class="link" style="font-weight: 600">حریم خصوصی</a> را
              می&zwnj;پذیرید.
            </p>
          </div></div>
<div id="panel-method" style="display:none"><div class="form-card">
        <a href="login.html" class="btn btn-ghost btn-sm">← تغییر شماره</a>
        <h1 class="scr-title">روش دریافت کد را انتخاب کنید</h1>
        <p class="scr-sub">کد به شماره <span id="phone-display" class="bold-ink"></span> ارسال خواهد شد.</p>

        <form action="otp.html" method="get" id="method-form">
          <input type="hidden" name="phone" id="phone-hidden">
          <input type="hidden" name="delivery" id="delivery-input" value="sms">

          <div class="method-list">
            <button type="button" class="method active" data-delivery="sms">پیامک</button>
            <button type="button" class="method" data-delivery="voice">تماس صوتی</button>
          </div>

          <button type="submit" class="btn btn-primary btn-block">ارسال کد →</button>
        </form>
      </div></div>
<div id="panel-otp" style="display:none"><div class="form-card">
        <a href="login.html" class="btn btn-ghost btn-sm">← تغییر شماره</a>
        <h1 class="scr-title">کد تأیید را وارد کنید</h1>
        <p class="scr-sub">کد به شماره <strong id="phone-show"></strong> ارسال شد.</p>

        <form action="success.html" method="get">
          <input type="hidden" name="phone" id="phone-hidden">
          <div class="otp-inputs" dir="ltr">
            <input class="otp-cell" maxlength="1" name="c1" required>
            <input class="otp-cell" maxlength="1" name="c2" required>
            <input class="otp-cell" maxlength="1" name="c3" required>
            <input class="otp-cell" maxlength="1" name="c4" required>
            <input class="otp-cell" maxlength="1" name="c5" required>
          </div>
          <button type="submit" class="btn btn-primary btn-block">تأیید و ورود</button>
        </form>
      </div></div>
<div id="panel-success" style="display:none"><div class="form-card" style="text-align:center">
        <div class="success-ico">✓</div>
        <h1 class="scr-title center">با موفقیت وارد شدید</h1>
        <p class="scr-sub">به پنل آسانک خوش آمدید.</p>
        <a href="login.html" class="btn btn-outline">بازگشت به صفحه ورود</a>
      </div></div>
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
      let currentUsername = "";
      let currentPhone = "";

      const panelLogin = document.getElementById('panel-login');
      const panelMethod = document.getElementById('panel-method');
      const panelOtp = document.getElementById('panel-otp');
      const panelSuccess = document.getElementById('panel-success');

      const btnPrimaryLogin = document.getElementById('primary');
      const btnOtpLogin = document.getElementById('otp-login');
      const loginError = document.createElement('div');
      loginError.className = 'error-msg';
      panelLogin.querySelector('.form-card').appendChild(loginError);

      // Disable button initially but we remove disabled for this simple integration
      if(btnPrimaryLogin) btnPrimaryLogin.disabled = false;

      // Handle Password Login
      if(btnPrimaryLogin) {
          btnPrimaryLogin.addEventListener('click', async (e) => {
              e.preventDefault();
              const identifier = document.getElementById('f-identifier').value;
              const password = document.getElementById('f-pw').value;
              const captcha = document.getElementById('f-captcha').value;

              if(!identifier || !password || !captcha) {
                  loginError.textContent = "لطفاً همه فیلدها را پر کنید.";
                  loginError.style.display = 'block';
                  return;
              }

              currentUsername = identifier;

              try {
                  const res = await fetch('/api/auth/login', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ username: identifier, password: password, captchaToken: captcha })
                  });

                  if(!res.ok) throw new Error("ورود ناموفق بود. اطلاعات را بررسی کنید.");
                  const data = await res.json();

                  if(data.status === 'OTP_SENT') {
                      currentPhone = identifier; // Fallback if no specific phone is returned
                      if (data.candidates && data.candidates.length > 0) {
                          currentPhone = data.candidates[0].phone || identifier;
                      }
                      showPanel(panelOtp);
                  } else if(data.status === 'NEED_NATIONAL_CODE') {
                      showPanel(panelMethod);
                  } else {
                      loginError.textContent = "وضعیت نامشخص.";
                      loginError.style.display = 'block';
                  }
              } catch (err) {
                  loginError.textContent = err.message;
                  loginError.style.display = 'block';
              }
          });
      }

      // Handle OTP Login Initiation
      if(btnOtpLogin) {
          btnOtpLogin.addEventListener('click', async (e) => {
              e.preventDefault();
              const phone = document.getElementById('f-identifier').value;
              if(!phone) {
                  loginError.textContent = "شماره موبایل را وارد کنید.";
                  loginError.style.display = 'block';
                  return;
              }

              currentUsername = phone;
              currentPhone = phone;

              try {
                  const res = await fetch('/api/auth/login/otp', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ phoneNumber: phone })
                  });

                  if(!res.ok) throw new Error("خطا در ارسال کد. شماره را بررسی کنید.");
                  showPanel(panelOtp);
              } catch (err) {
                  loginError.textContent = err.message;
                  loginError.style.display = 'block';
              }
          });
      }

      // Handle Method Selection (simulated for now, just calls select-phone API)
      const methodForm = panelMethod.querySelector('form');
      if(methodForm) {
          methodForm.addEventListener('submit', async (e) => {
              e.preventDefault();
              try {
                  const res = await fetch('/api/auth/login/select-phone', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      // Using US as default nationalCode for demonstration or fetch from UI
                      body: JSON.stringify({ username: currentUsername, nationalCode: 'IR' })
                  });
                  if(!res.ok) throw new Error("خطا در انتخاب روش.");
                  showPanel(panelOtp);
              } catch (err) {
                  alert(err.message);
              }
          });
      }

      // Handle OTP Verification
      const otpForm = panelOtp.querySelector('form');
      if(otpForm) {
          otpForm.addEventListener('submit', async (e) => {
              e.preventDefault();

              let code = '';
              const inputs = otpForm.querySelectorAll('.otp-cell');
              inputs.forEach(inp => code += inp.value);

              try {
                  const res = await fetch('/api/auth/verify-2fa', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ username: currentUsername, code: code })
                  });

                  if(!res.ok) throw new Error("کد وارد شده اشتباه است.");
                  const data = await res.json();

                  if(data.accessToken) {
                      // Store token if needed, e.g., localStorage.setItem('token', data.accessToken);
                      showPanel(panelSuccess);
                      setTimeout(() => {
                          window.location.href = '/';
                      }, 2000);
                  }
              } catch (err) {
                  alert(err.message);
              }
          });
      }

      function showPanel(panel) {
          panelLogin.style.display = 'none';
          panelMethod.style.display = 'none';
          panelOtp.style.display = 'none';
          panelSuccess.style.display = 'none';
          panel.style.display = 'block';

          if(panel === panelMethod) {
              const phoneDisplay = panel.querySelector('#phone-display');
              if(phoneDisplay) phoneDisplay.textContent = currentPhone;
          }
          if(panel === panelOtp) {
              const phoneShow = panel.querySelector('#phone-show');
              if(phoneShow) phoneShow.textContent = currentPhone;
          }
      }

      // Prevent original links from triggering if they are just anchor tags
      document.querySelectorAll('a').forEach(a => {
          if (a.getAttribute('href') === 'login.html') {
              a.addEventListener('click', (e) => {
                  e.preventDefault();
                  showPanel(panelLogin);
              });
          }
      });
    </script>
  </body>
</html>
