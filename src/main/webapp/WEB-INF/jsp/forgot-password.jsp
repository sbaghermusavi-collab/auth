<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!doctype html>
<html lang="fa" dir="rtl" data-auth-tone="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>آسانک — بازیابی رمز عبور</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/resources/css/stylesLogin.css" />
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
            <a href="${pageContext.request.contextPath}/login" class="btn btn-ghost btn-sm" id="back-link" style="margin-bottom: 12px; display: inline-flex;">← بازگشت به ورود</a>
            <div style="margin-bottom: 24px">
              <h1 class="scr-title">بازیابی رمز عبور</h1>
              <p class="muted" style="margin-top: 9px; font-size: 14.5px;">
                نام کاربری یا شماره موبایل حساب خود را وارد کنید.
              </p>
            </div>

            <form id="forgot-form">
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
                    required
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
                    <img id="cap-img" width="187" height="65" alt="captcha" />
                    <button
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
              </div>

              <p class="fld-hint error" id="forgot-error" style="display: none"></p>

              <button
                type="submit"
                class="btn btn-primary btn-block"
                id="primary"
                style="height: 48px; margin-top: 22px"
              >
                ادامه و دریافت کد تأیید<svg
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
            </form>
          </div>
        </div>
      </div>

      <!-- پنل برند -->
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

    <script src="${pageContext.request.contextPath}/resources/js/app.js"></script>
    <script>
    let currentCaptchaId = '';

    function safeContinueUrl(target) {
        if (!target || target === '/success') return 'http://localhost:8090/';
        try {
            const url = new URL(target, window.location.origin);
            if (url.protocol === 'http:' || url.protocol === 'https:') {
                return url.href;
            }
            return url.pathname + url.search + url.hash;
        } catch (err) {
            return target || 'http://localhost:8090/';
        }
    }

    function getContinueUrl() {
        const params = new URLSearchParams(window.location.search);
        const target = params.get('continue') || params.get('next');
        return safeContinueUrl(target);
    }

    async function loadCaptcha() {
        const captchaUrl = "${captchaUrl}";
        if (!captchaUrl) return;
        try {
            const response = await fetch(captchaUrl);
            if (response.ok) {
                currentCaptchaId = response.headers.get('X-Captcha-Id') || '';
                const blob = await response.blob();
                const imgUrl = URL.createObjectURL(blob);
                const imgEl = document.getElementById('cap-img');
                if (imgEl) imgEl.src = imgUrl;
            }
        } catch (err) {
            console.error('Failed to load captcha', err);
        }
    }

    function initPage() {
        loadCaptcha();
        const refreshBtn = document.querySelector('[data-act="cap-refresh"]');
        if (refreshBtn) {
            refreshBtn.onclick = loadCaptcha;
        }
        const continueUrl = getContinueUrl();
        const backLink = document.getElementById('back-link');
        if (backLink && continueUrl && continueUrl !== '/success') {
            backLink.href = '/login?continue=' + encodeURIComponent(continueUrl);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPage);
    } else {
        initPage();
    }

    document.getElementById('forgot-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorEl = document.getElementById('forgot-error');
        const submitBtn = document.getElementById('primary');
        const identifierInput = document.getElementById('f-identifier');
        const identifier = identifierInput ? identifierInput.value.trim() : '';

        errorEl.style.display = 'none';
        if (!identifier) {
            errorEl.textContent = 'لطفاً نام کاربری یا شماره موبایل خود را وارد کنید.';
            errorEl.style.display = 'block';
            return;
        }

        submitBtn.disabled = true;

        const isCaptchaEnabled = ${captchaEnabled != null ? captchaEnabled : false};
        if (isCaptchaEnabled) {
            const captchaInput = document.getElementById('f-captcha');
            const captchaToken = captchaInput ? captchaInput.value.trim() : '';
            if (!captchaToken) {
                errorEl.textContent = 'لطفاً کد امنیتی را وارد کنید.';
                errorEl.style.display = 'block';
                submitBtn.disabled = false;
                return;
            }
        }

        const currentContinue = getContinueUrl();
        const pwChangeContinue = '/password-change?reset=true&identifier=' + encodeURIComponent(identifier) + '&continue=' + encodeURIComponent(currentContinue);
        const params = new URLSearchParams({
            identifier: identifier,
            phone: identifier,
            continue: pwChangeContinue
        });

        window.location.href = '${pageContext.request.contextPath}/method?' + params.toString();
    });
    </script>
  </body>
</html>
