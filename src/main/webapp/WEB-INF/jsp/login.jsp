<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!doctype html>
<html lang="fa" dir="rtl" data-auth-tone="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>آسانک — ورود، ثبت‌نام</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <div class="auth-root">
      <div class="form-shell">
        <div class="brand-logo">
          <span class="mark">
            <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H10l-4 3v-3H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"
              />
              <path d="M8 9.5h8M8 12.5h5" />
            </svg>
          </span>
          <span class="name">آسانک</span>
        </div>

        <div class="form-center">
          <div class="form-card fade-up" id="form-card">
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
            <div class="fld" id="password-field" <% if (!Boolean.TRUE.equals(request.getAttribute("passwordEnabled"))) { %>style="display:none;"<% } %>>
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
            <div class="fld" id="captcha-field" <% if (!Boolean.TRUE.equals(request.getAttribute("captchaEnabled"))) { %>style="display:none;"<% } %>>
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
          </div>
        </div>
      </div>

      <!-- پنل برند (کامل) -->
      <aside class="auth-dark">
        <div class="auth-glow g1"></div>
        <div class="auth-glow g2"></div>
        <div class="auth-grid"></div>

        <div class="auth-top">
          <span class="auth-eyebrow">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.9"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
            </svg>
            پلتفرم ارتباط و شناخت مشتری
          </span>
          <h2>هر مشتری را<br /><b>بهتر بشناسید</b></h2>
          <p>
            پیامک، تماس صوتی و تحلیل رفتار مشتری — همه در یک پلتفرم یکپارچه و
            زنده.
          </p>
        </div>

        <div class="auth-stage">
          <div class="viz">
            <div class="viz-ring r1"></div>
            <div class="viz-ring r2"></div>
            <div class="viz-ring r3"></div>
            <div class="viz-pulse"></div>
            <div class="viz-pulse p2"></div>
            <div class="viz-orbit">
              <div class="viz-node n-t green">
                <div class="viz-node-in">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.9"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3 7 9 6 9-6" />
                  </svg>
                </div>
              </div>
              <div class="viz-node n-l gold">
                <div class="viz-node-in">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.9"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path
                      d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"
                    />
                  </svg>
                </div>
              </div>
              <div class="viz-node n-b">
                <div class="viz-node-in">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.9"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path
                      d="M12 3l2.7 5.5 6 .9-4.3 4.2 1 6L12 17.8 6.6 19.6l1-6L3.3 9.4l6-.9z"
                    />
                  </svg>
                </div>
              </div>
              <div class="viz-node n-r">
                <div class="viz-node-in">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.9"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                  </svg>
                </div>
              </div>
            </div>
            <div class="viz-core">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.9"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="9" cy="8" r="3.4" />
                <path d="M2.5 20c0-3.4 2.9-6 6.5-6s6.5 2.6 6.5 6" />
                <path d="M16 5a3.2 3.2 0 0 1 0 6.2M17.5 20c0-2-.7-3.8-2-5" />
              </svg>
              <span class="dot"></span>
            </div>
            <div class="phone">
              <div class="phone-notch"></div>
              <div class="phone-screen">
                <div class="sms-head">
                  <span class="av"
                    ><svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.9"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" /></svg
                  ></span>
                  <div>
                    <div class="nm">آسانک</div>
                    <div class="st">آنلاین</div>
                  </div>
                </div>
                <div class="sms-thread">
                  <div class="sms-day">امروز ۱۰:۲۴</div>
                  <div class="bubble biz">
                    جشنواره ویژه 🎉 عدد <b>۱</b> را بفرستید.<span class="tk"
                      >تحویل‌شده ✓✓</span
                    >
                  </div>
                  <div class="bubble out">۱</div>
                  <div class="bubble biz">
                    ثبت شد ✓ تماس می‌گیریم.<span class="tk">۱۰:۲۴</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="viz-chip c1">
              <div class="viz-bars">
                <i style="height: 9px"></i><i style="height: 15px"></i
                ><i style="height: 11px"></i><i style="height: 20px"></i
                ><i style="height: 15px"></i>
              </div>
              <div>
                <div class="cv">تحلیل هوشمند</div>
                <div class="ck">رفتار و نیاز مشتری</div>
              </div>
            </div>
          </div>
        </div>

        <div class="auth-trust">
          <div>
            <div class="tv tnum">۲۴/۷</div>
            <div class="tk">پشتیبانی</div>
          </div>
          <div>
            <div class="tv tnum">٪۹۹٫۹</div>
            <div class="tk">پایداری سرویس</div>
          </div>
          <div>
            <div class="tv">رمزنگاری</div>
            <div class="tk">امنیت داده‌ها</div>
          </div>
        </div>
      </aside>
    </div>

    <script src="app.js"></script>

<script>
document.getElementById('primary').disabled = false; // Enable button
document.getElementById('primary').addEventListener('click', async (e) => {
    e.preventDefault();
    const identifier = document.getElementById('f-identifier').value;
    const password = document.getElementById('f-pw').value;
    const captchaToken = document.getElementById('f-captcha') ? document.getElementById('f-captcha').value : '';

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, password, captchaToken })
        });
        const data = await res.json();

        if (res.ok) {
            if (data.status === 'SUCCESS') {
                window.location.href = '/success';
            } else if (data.status === 'OTP_SENT') {
                window.location.href = '/otp?phone=' + encodeURIComponent(identifier);
            } else if (data.status === 'NEED_NATIONAL_CODE') {
                window.location.href = '/method?phone=' + encodeURIComponent(identifier);
            }
        } else {
            alert('Login failed: ' + (data.message || res.statusText));
        }
    } catch (err) {
        alert('Error: ' + err.message);
    }
});

document.getElementById('otp-login').addEventListener('click', (e) => {
    // Navigate to a dedicated OTP flow if you have one, or just hide password
    e.preventDefault();
    document.getElementById('password-field').style.display = 'none';
    alert("Please enter identifier and click Login to proceed with OTP.");
});
</script>
</body>

</html>
