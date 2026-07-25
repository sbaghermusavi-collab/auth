<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="fa" dir="rtl" data-auth-tone="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>آسانک — کد تأیید</title>
  <link rel="stylesheet" href="/resources/css/stylesLogin.css" />
</head>
<body>

<div class="auth-root">
  <div class="form-shell">
    <div class="brand-logo">
      <span class="mark">
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H10l-4 3v-3H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
          <path d="M8 9.5h8M8 12.5h5" />
        </svg>
      </span>
      <span class="name">آسانک</span>
    </div>    
    <div class="form-center">
      <div class="form-card">
        <a href="/login" class="btn btn-ghost btn-sm">← تغییر شماره</a>
        <h1 class="scr-title">کد تأیید را وارد کنید</h1>
        <p class="scr-sub">کد به شماره <strong id="phone-show"></strong> ارسال شد.</p>

        <form action="/api/auth/otp/verify" method="post">
          <input type="hidden" name="identifier" id="identifier-hidden">
          <input type="hidden" name="phone" id="phone-hidden">
          
          <div class="otp-inputs" dir="ltr">
            <input class="otp-cell" maxlength="1" name="c1" required>
            <input class="otp-cell" maxlength="1" name="c2" required>
            <input class="otp-cell" maxlength="1" name="c3" required>
            <input class="otp-cell" maxlength="1" name="c4" required>
            <input class="otp-cell" maxlength="1" name="c5" required>
            <input class="otp-cell" maxlength="1" name="c6" required>
          </div>

          <div style="margin-top: 18px; text-align: center;">
            <p id="timer-box" style="font-size: 14px; color: var(--text-muted); margin-bottom: 8px;">
              زمان باقی‌مانده تا ارسال مجدد: <strong id="countdown" style="color: #0C747C; font-family: monospace; font-size: 16px;">03:00</strong>
            </p>
            <button type="button" id="resend-btn" class="btn btn-outline" style="display: none; margin: 0 auto; height: 38px; font-size: 13.5px;" disabled>
              ارسال مجدد کد تأیید
            </button>
          </div>

          <p class="fld-hint error" id="otp-error" style="display: none; margin-top: 12px;"></p>
          <button type="submit" class="btn btn-primary btn-block" style="margin-top: 20px;">تأیید و ورود</button>
        </form>
      </div>
    </div>
  </div>
  
  <aside class="auth-dark">
    <div class="auth-glow g1"></div>
    <div class="auth-glow g2"></div>
    <div class="auth-grid"></div>

    <div class="auth-top">
      <span class="auth-eyebrow">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/></svg>
        پلتفرم ارتباط و شناخت مشتری
      </span>
      <h2>هر مشتری را<br /><b>بهتر بشناسید</b></h2>
      <p>پیامک، تماس صوتی و تحلیل رفتار مشتری — همه در یک پلتفرم یکپارچه و زنده.</p>
    </div>

    <div class="auth-stage">
      <div class="viz">
        <div class="viz-ring r1"></div>
        <div class="viz-ring r2"></div>
        <div class="viz-ring r3"></div>
        <div class="viz-pulse"></div>
        <div class="viz-pulse p2"></div>
        <div class="viz-orbit">
          <div class="viz-node n-t green"><div class="viz-node-in"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg></div></div>
          <div class="viz-node n-l gold"><div class="viz-node-in"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg></div></div>
          <div class="viz-node n-b"><div class="viz-node-in"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.7 5.5 6 .9-4.3 4.2 1 6L12 17.8 6.6 19.6l1-6L3.3 9.4l6-.9z"/></svg></div></div>
          <div class="viz-node n-r"><div class="viz-node-in"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg></div></div>
        </div>
        <div class="viz-core">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.4"/><path d="M2.5 20c0-3.4 2.9-6 6.5-6s6.5 2.6 6.5 6"/><path d="M16 5a3.2 3.2 0 0 1 0 6.2M17.5 20c0-2-.7-3.8-2-5"/></svg>
          <span class="dot"></span>
        </div>
        <div class="phone">
          <div class="phone-notch"></div>
          <div class="phone-screen">
            <div class="sms-head">
              <span class="av"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/></svg></span>
              <div><div class="nm">آسانک</div><div class="st">آنلاین</div></div>
            </div>
            <div class="sms-thread">
              <div class="sms-day">امروز ۱۰:۲۴</div>
              <div class="bubble biz">جشنواره ویژه 🎉 عدد <b>۱</b> را بفرستید.<span class="tk">تحویل‌شده ✓✓</span></div>
              <div class="bubble out">۱</div>
              <div class="bubble biz">ثبت شد ✓ تماس می‌گیریم.<span class="tk">۱۰:۲۴</span></div>
            </div>
          </div>
        </div>
        <div class="viz-chip c1">
          <div class="viz-bars"><i style="height:9px"></i><i style="height:15px"></i><i style="height:11px"></i><i style="height:20px"></i><i style="height:15px"></i></div>
          <div><div class="cv">تحلیل هوشمند</div><div class="ck">رفتار و نیاز مشتری</div></div>
        </div>
      </div>
    </div>

    <div class="auth-trust">
      <div><div class="tv tnum">۲۴/۷</div><div class="tk">پشتیبانی</div></div>
      <div><div class="tv tnum">٪۹۹٫۹</div><div class="tk">پایداری سرویس</div></div>
      <div><div class="tv">رمزنگاری</div><div class="tk">امنیت داده‌ها</div></div>
    </div>
  </aside></div>

<script>
const params = new URLSearchParams(location.search);
const identifier = params.get('identifier') || params.get('phone') || '';
const phone = params.get('phone') || identifier;
const continueUrl = params.get('continue') || '/success';

document.getElementById('phone-show').textContent = phone;
document.getElementById('phone-hidden').value = phone;
document.getElementById('identifier-hidden').value = identifier;

function safeContinueUrl(target) {
    try {
        const url = new URL(target, window.location.origin);
        return url.origin === window.location.origin ? url.pathname + url.search + url.hash : '/success';
    } catch (err) {
        return '/success';
    }
}

function storeTokens(data) {
    if (data.accessToken) localStorage.setItem('accessToken', data.accessToken);
    if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
    if (data.expiresIn) localStorage.setItem('expiresIn', String(data.expiresIn));
}

async function readError(response) {
    try {
        const data = await response.json();
        return data.message || data.error || response.statusText;
    } catch (err) {
        return response.statusText;
    }
}

const otpExpirationSeconds = ${otpExpirationSeconds != null ? otpExpirationSeconds : 180};
let timerInterval;
let remainingSeconds = otpExpirationSeconds;

function startCountdown() {
    remainingSeconds = otpExpirationSeconds;
    document.getElementById('resend-btn').style.display = 'none';
    document.getElementById('resend-btn').disabled = true;
    document.getElementById('timer-box').style.display = 'block';

    updateTimerDisplay();
    clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        remainingSeconds--;
        updateTimerDisplay();
        if (remainingSeconds <= 0) {
            clearInterval(timerInterval);
            document.getElementById('timer-box').style.display = 'none';
            document.getElementById('resend-btn').style.display = 'block';
            document.getElementById('resend-btn').disabled = false;
        }
    }, 1000);
}

function updateTimerDisplay() {
    const mins = Math.floor(Math.max(0, remainingSeconds) / 60);
    const secs = Math.max(0, remainingSeconds) % 60;
    const formatted = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
    const el = document.getElementById('countdown');
    if (el) el.textContent = formatted;
}

startCountdown();

document.getElementById('resend-btn').addEventListener('click', async () => {
    const errorEl = document.getElementById('otp-error');
    const resendBtn = document.getElementById('resend-btn');
    resendBtn.disabled = true;
    errorEl.style.display = 'none';

    const deliveryMethod = params.get('delivery') || 'sms';

    try {
        const res = await fetch('/api/auth/resend-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, phone, deliveryMethod })
        });

        if (res.ok) {
            startCountdown();
            alert('کد تأیید جدید ارسال شد.');
        } else {
            errorEl.textContent = await readError(res);
            errorEl.style.display = 'block';
            resendBtn.disabled = false;
        }
    } catch (err) {
        errorEl.textContent = err.message;
        errorEl.style.display = 'block';
        resendBtn.disabled = false;
    }
});

document.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('otp-error');
    const code = Array.from(document.querySelectorAll('.otp-cell')).map(input => input.value).join('');
    errorEl.style.display = 'none';

    try {
        const res = await fetch('/api/auth/otp/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, code })
        });

        if (res.ok) {
            const data = await res.json();
            if (data.accessToken === 'PASSWORD_CHANGE_REQUIRED') {
                const pwParams = new URLSearchParams({ identifier, continue: continueUrl });
                window.location.href = '/password-change?' + pwParams.toString();
                return;
            }
            storeTokens(data);
            window.location.href = data.redirectUrl || safeContinueUrl(continueUrl);
        } else {
            errorEl.textContent = await readError(res);
            errorEl.style.display = 'block';
        }
    } catch (err) {
        errorEl.textContent = err.message;
        errorEl.style.display = 'block';
    }
});

(function() {
    const timeoutSeconds = ${loginInactivityTimeoutSeconds != null ? loginInactivityTimeoutSeconds : 180};
    let idleTimer;
    function resetTimer() {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
            alert('نشست شما به دلیل عدم فعالیت منقضی شد.');
            window.location.href = '/login?expired=true';
        }, timeoutSeconds * 1000);
    }
    ['mousemove', 'keydown', 'click', 'touchstart'].forEach(evt => {
        window.addEventListener(evt, resetTimer);
    });
    resetTimer();
})();
</script>
</body>

<script src="/resources/js/app.js"></script>
</html>
