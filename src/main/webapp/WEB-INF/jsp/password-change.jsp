<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="fa" dir="rtl" data-auth-tone="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>آسانک — تغییر رمز عبور</title>
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
        <h1 class="scr-title">رمز عبور شما منقضی شده است</h1>
        <p class="scr-sub">لطفاً یک رمز عبور جدید تعیین کنید.</p>

        <form id="pw-form">
          <div class="fld">
            <label class="field-label">رمز عبور فعلی</label>
            <div class="fld-wrap">
              <input class="fld-input" id="f-current" type="password" autocomplete="current-password" required>
            </div>
          </div>
          <div class="fld">
            <label class="field-label">رمز عبور جدید</label>
            <div class="fld-wrap">
              <input class="fld-input" id="f-new" type="password" autocomplete="new-password" minlength="8" required>
            </div>
          </div>
          <p class="fld-hint error" id="pw-error" style="display: none"></p>
          <button type="submit" class="btn btn-primary btn-block" id="primary" style="height: 48px; margin-top: 22px">
            تغییر رمز و ورود
          </button>
        </form>
      </div>
    </div>
  </div>
</div>

<script>
const params = new URLSearchParams(location.search);
const identifier = params.get('identifier') || params.get('phone') || '';
const continueUrl = params.get('continue') || '/success';

function storeTokens(data) {
    if (data.accessToken) localStorage.setItem('accessToken', data.accessToken);
    if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
    if (data.expiresIn) localStorage.setItem('expiresIn', String(data.expiresIn));
}

function safeContinueUrl(target) {
    try {
        const url = new URL(target, window.location.origin);
        return url.origin === window.location.origin ? url.pathname + url.search + url.hash : '/success';
    } catch (err) {
        return '/success';
    }
}

async function readError(response) {
    try {
        const data = await response.json();
        return data.message || data.error || response.statusText;
    } catch (err) {
        return response.statusText;
    }
}

document.getElementById('pw-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('pw-error');
    const submitBtn = document.getElementById('primary');
    errorEl.style.display = 'none';
    submitBtn.disabled = true;

    try {
        const res = await fetch('/api/auth/password/change-expired', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                identifier,
                currentPassword: document.getElementById('f-current').value,
                newPassword: document.getElementById('f-new').value
            })
        });

        if (!res.ok) {
            throw new Error(await readError(res));
        }

        const data = await res.json();
        storeTokens(data);
        window.location.href = data.redirectUrl || safeContinueUrl(continueUrl);
    } catch (err) {
        errorEl.textContent = err.message;
        errorEl.style.display = 'block';
        submitBtn.disabled = false;
    }
});
</script>
</body>
</html>
