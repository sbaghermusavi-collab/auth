<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!doctype html>
<html lang="fa" dir="rtl" data-auth-tone="${themeTone != null ? themeTone : 'dark'}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${brandName != null ? brandName : 'آسانک'} — ثبت‌نام</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/resources/css/stylesLogin.css" />
      <link rel="stylesheet" href="${pageContext.request.contextPath}/tenant-assets/theme.css" />
  </head>
  <body>
    <div class="auth-root">
      <div class="form-shell">
        <div class="brand-logo" style="display: flex; align-items: center; gap: 12px;">
          <img src="${pageContext.request.contextPath}/tenant-assets/logo" alt="Logo" style="height: 38px; width: auto; max-width: 140px; object-fit: contain;" onerror="this.style.display='none'; this.nextElementSibling.style.display='grid';" />
          <span class="mark" style="display: none;">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H10l-4 3v-3H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"></path>
              <path d="M8 9.5h8M8 12.5h5"></path>
            </svg>
          </span>
          <span class="name">${brandName != null ? brandName : 'آسانک'}</span>
        </div>
        <div class="form-center">
          <div class="form-card fade-up" id="form-card">
            <div style="margin-bottom:24px">
              <h1 class="scr-title center">ساخت حساب کاربری</h1>
              <p class="muted" style="margin-top:9px;font-size:14.5px;text-align:center">
                قبلاً ثبت‌نام کرده‌اید؟ <a href="${pageContext.request.contextPath}/login" class="link">وارد شوید</a>
              </p>
            </div>
            
            <form id="register-form">
              <div class="fld">
                <div class="fld-row"><label class="field-label">نام و نام خانوادگی</label></div>
                <div class="fld-wrap">
                  <input class="fld-input tnum" id="f-name" placeholder="مثلاً سارا کریمی" autocomplete="off" required>
                  <span class="lead">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="8" r="4"></circle><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"></path></svg>
                  </span>
                </div>
              </div>
              
              <div class="fld">
                <div class="fld-row"><label class="field-label">شماره موبایل</label></div>
                <div class="fld-wrap" dir="ltr">
                  <input class="fld-input tnum" id="f-phone" placeholder="۰۹۱۲۳۴۵۶۷۸۹" inputmode="numeric" autocomplete="off" required>
                  <span class="lead">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"></path></svg>
                  </span>
                </div>
              </div>

              <div class="fld">
                <div class="fld-row"><label class="field-label">نام کاربری</label></div>
                <div class="fld-wrap" dir="ltr">
                  <input class="fld-input tnum" id="f-username" placeholder="asanak_user" autocomplete="off" required>
                  <span class="lead">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="4"></circle><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.9 7.9"></path></svg>
                  </span>
                </div>
              </div>

              <div class="fld">
                <label class="field-label">رمز عبور</label>
                <div class="fld-wrap">
                  <input class="fld-input" id="f-pw" type="password" placeholder="حداقل ۸ کاراکتر (ترکیب حرف و عدد)" required>
                  <span class="lead">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><rect x="4" y="10" width="16" height="11" rx="2"></rect><path d="M8 10V7a4 4 0 0 1 8 0v3"></path></svg>
                  </span>
                  <button type="button" class="fld-toggle" id="pw-toggle-btn" aria-label="نمایش رمز">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  </button>
                </div>
                <div class="pw-meter" id="pw-meter"><i></i><i></i><i></i><i></i></div>
              </div>

              <p class="fld-hint error" id="register-error" style="display: none; margin-top: 12px;"></p>

              <button type="submit" class="btn btn-primary btn-block" id="primary" style="height:48px;margin-top:22px">
                ساخت حساب کاربری
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M19 12H5"></path><path d="m12 19-7-7 7-7"></path></svg>
              </button>

              <div class="or-div">یا</div>

              <button type="button" class="btn btn-outline btn-block" id="otp-login" style="height:46px">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"></path></svg>
                ورود با کد یک‌بارمصرف
              </button>

              <p class="note" style="margin-top:22px;line-height:2">
                با ثبت‌نام، <a class="link" style="font-weight:600">قوانین و مقررات</a> و <a class="link" style="font-weight:600">حریم خصوصی</a> را می‌پذیرید.
              </p>
            </form>
          </div>
        </div>
      </div>

      <jsp:include page="/WEB-INF/jsp/common/auth-aside.jsp" />
    </div>

    <script src="${pageContext.request.contextPath}/resources/js/app.js"></script>
    <jsp:include page="/WEB-INF/jsp/common/auth-animation.jsp" />
    <script>
    document.getElementById('pw-toggle-btn')?.addEventListener('click', function() {
        const pw = document.getElementById('f-pw');
        if (!pw) return;
        const isPw = pw.type === 'password';
        pw.type = isPw ? 'text' : 'password';
    });

    document.getElementById('f-pw')?.addEventListener('input', function() {
        const val = this.value;
        const meter = document.getElementById('pw-meter');
        if (!meter) return;
        meter.className = 'pw-meter';
        if (val.length === 0) return;
        if (val.length < 6) meter.classList.add('s1');
        else if (val.length < 8 || !/\d/.test(val)) meter.classList.add('s2');
        else if (/[A-Z]/.test(val) || /[^A-Za-z0-9]/.test(val)) meter.classList.add('s4');
        else meter.classList.add('s3');
    });

    const serverAppRoot = '${not empty appRootUrl ? appRootUrl : "/"}';
    const defaultAppRoot = (serverAppRoot.includes("localhost") && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1")
        ? (window.location.origin + "/")
        : serverAppRoot;

    function safeContinueUrl(target) {
        if (!target || target === '/success' || target.includes('/api/auth/') || target.endsWith('/login') || target.includes('/login?')) return defaultAppRoot;
        try {
            const url = new URL(target, window.location.origin);
            if (url.pathname.includes('/api/auth/') || url.pathname.endsWith('/login')) {
                return defaultAppRoot;
            }
            if (url.protocol === 'http:' || url.protocol === 'https:') {
                if (url.hostname === 'localhost' && window.location.hostname !== 'localhost') {
                    url.hostname = window.location.hostname;
                    url.port = window.location.port;
                }
                return url.href;
            }
            return url.pathname + url.search + url.hash;
        } catch (err) {
            return defaultAppRoot;
        }
    }

    function getContinueUrl() {
        const params = new URLSearchParams(window.location.search);
        const target = params.get('continue') || params.get('next');
        return safeContinueUrl(target);
    }

    document.getElementById('otp-login')?.addEventListener('click', () => {
        const continueUrl = getContinueUrl();
        window.location.href = '${pageContext.request.contextPath}/login?continue=' + encodeURIComponent(continueUrl);
    });

    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorEl = document.getElementById('register-error');
        const submitBtn = document.getElementById('primary');

        errorEl.style.display = 'none';
        submitBtn.disabled = true;

        const name = document.getElementById('f-name').value.trim();
        const phone = document.getElementById('f-phone').value.trim();
        const username = document.getElementById('f-username').value.trim();
        const password = document.getElementById('f-pw').value;

        const payload = {
            tenantCode: "${tenantCode != null ? tenantCode : 'default'}",
            tenantName: "${brandName != null ? brandName : 'Default Tenant'}",
            tenantBaseUrl: "http://localhost",
            username: username,
            password: password,
            systemUser: false,
            phones: [
                { phoneNumber: phone, nationalCode: "IR", preferred: true }
            ],
            roleCodes: ["USER"]
        };

        try {
            const res = await fetch('${pageContext.request.contextPath}/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const redirectParams = new URLSearchParams({
                    identifier: username,
                    phone: phone,
                    continue: getContinueUrl()
                });
                window.location.href = '${pageContext.request.contextPath}/method?' + redirectParams.toString();
            } else {
                let msg = 'ثبت‌نام ناموفق بود.';
                try {
                    const data = await res.json();
                    msg = data.message || msg;
                } catch(e) {}
                errorEl.textContent = msg;
                errorEl.style.display = 'block';
                submitBtn.disabled = false;
            }
        } catch (err) {
            errorEl.textContent = 'خطا در ارتباط با سرور: ' + err.message;
            errorEl.style.display = 'block';
            submitBtn.disabled = false;
        }
    });
    </script>
  </body>
</html>
