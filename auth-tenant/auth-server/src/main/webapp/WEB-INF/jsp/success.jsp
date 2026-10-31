<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="fa" dir="rtl" data-auth-tone="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>آسانک — موفقیت</title>
  <link rel="stylesheet" href="styles.css" />
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
    </div>    <div class="form-center">
      <div class="form-card" style="text-align:center">
        <div class="success-ico">✓</div>
        <h1 class="scr-title center">با موفقیت وارد شدید</h1>
        <p class="scr-sub">به پنل آسانک خوش آمدید.</p>
        <a href="login.html" class="btn btn-outline">بازگشت به صفحه ورود</a>
      </div>
    </div>
  </div>
  <jsp:include page="/WEB-INF/jsp/common/auth-aside.jsp" />
</div>
<jsp:include page="/WEB-INF/jsp/common/auth-animation.jsp" /></div>

</body>
<script src="${pageContext.request.contextPath}/resources/js/app.js"></script>
</html>
