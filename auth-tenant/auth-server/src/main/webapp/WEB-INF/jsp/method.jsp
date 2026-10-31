<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="fa" dir="rtl" data-auth-tone="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>آسانک — انتخاب روش دریافت کد</title>
  <link rel="stylesheet" href="${pageContext.request.contextPath}/resources/css/stylesLogin.css" />
    <link rel="stylesheet" href="${pageContext.request.contextPath}/tenant-assets/theme.css" />
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
        <a href="${pageContext.request.contextPath}/login" class="btn btn-ghost btn-sm">← تغییر شماره</a>
        <h1 class="scr-title">روش دریافت کد را انتخاب کنید</h1>
        <p class="scr-sub">کد تأیید به شماره <span id="phone-display" class="bold-ink"></span> ارسال خواهد شد.</p>

        <form action="${pageContext.request.contextPath}/otp" method="get" id="method-form">
          <input type="hidden" name="phone" id="phone-hidden">
          <input type="hidden" name="authSessionId" id="authSessionId-hidden">
          <input type="hidden" name="delivery" id="delivery-input" value="sms">

          <div class="method-list">
            <button type="button" class="method active" data-delivery="sms">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 6px;"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>
              پیامک (SMS)
            </button>
            <button type="button" class="method" data-delivery="voice">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 6px;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              تماس صوتی
            </button>
          </div>

          <button type="submit" class="btn btn-primary btn-block" id="send-btn" style="height: 48px; margin-top: 20px;">
            ارسال کد تأیید →
          </button>
        </form>
      </div>
    </div>
  </div>

  <jsp:include page="/WEB-INF/jsp/common/auth-aside.jsp" />
</div>
<jsp:include page="/WEB-INF/jsp/common/auth-animation.jsp" />

<script>
const serverAppRoot = '${not empty appRootUrl ? appRootUrl : "/"}';
const defaultAppRoot = (serverAppRoot.includes("localhost") && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1")
    ? (window.location.origin + "/")
    : serverAppRoot;

function safeContinueUrl(target) {
    if (!target || target === '/success') return defaultAppRoot;
    try {
        const url = new URL(target, window.location.origin);
        if (url.protocol === 'http:' || url.protocol === 'https:') {
            if (url.hostname === 'localhost' && window.location.hostname !== 'localhost') {
                url.hostname = window.location.hostname;
                url.port = window.location.port;
            }
            return url.href;
        }
        return url.pathname + url.search + url.hash;
    } catch (err) {
        return target || defaultAppRoot;
    }
}

const params = new URLSearchParams(location.search);
const identifier = params.get('identifier') || params.get('phone') || '';
const authSessionId = params.get('authSessionId') || '';
if (!authSessionId) {
    window.location.href = '${pageContext.request.contextPath}/login';
}
const phone = params.get('phone') || identifier;
const continueUrl = safeContinueUrl(params.get('continue') || params.get('next'));

document.getElementById('phone-display').textContent = phone;
document.getElementById('phone-hidden').value = phone;
document.getElementById('authSessionId-hidden').value = authSessionId;

document.querySelectorAll('.method').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.method').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('delivery-input').value = btn.dataset.delivery;
  });
});

document.getElementById('method-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const deliveryMethod = document.getElementById('delivery-input').value;
    const sendBtn = document.getElementById('send-btn');
    sendBtn.disabled = true;

    try {
        const res = await fetch('${pageContext.request.contextPath}/api/auth/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ authSessionId, phone, deliveryMethod })
        });

        if (res.ok) {
            const redirectParams = new URLSearchParams({
                identifier,
                authSessionId,
                phone,
                delivery: deliveryMethod,
                continue: continueUrl
            });
            window.location.href = '${pageContext.request.contextPath}/otp?' + redirectParams.toString();
        } else {
            let msg = 'خطا در ارسال کد. لطفاً دوباره تلاش کنید.';
            try {
                const errData = await res.json();
                if (errData && (errData.message || errData.error)) {
                    msg = errData.message || errData.error;
                }
            } catch(ignored) {}
            alert(msg);
            sendBtn.disabled = false;
        }
    } catch (err) {
        alert('خطا در ارتباط با سرور: ' + err.message);
        sendBtn.disabled = false;
    }
});

(function() {
    const timeoutSeconds = ${loginInactivityTimeoutSeconds != null ? loginInactivityTimeoutSeconds : 180};
    let idleTimer;
    function resetTimer() {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
            alert('نشست شما به دلیل عدم فعالیت منقضی شد.');
            window.location.href = '${pageContext.request.contextPath}/login?expired=true';
        }, timeoutSeconds * 1000);
    }
    ['mousemove', 'keydown', 'click', 'touchstart'].forEach(evt => {
        window.addEventListener(evt, resetTimer);
    });
    resetTimer();
})();
</script>
</body>
</html>