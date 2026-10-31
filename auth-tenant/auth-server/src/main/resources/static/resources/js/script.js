// Form Elements
const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const togglePasswordBtn = document.getElementById("togglePassword");
const eyeIcon = document.getElementById("eyeIcon");
const submitBtn = document.getElementById("submitBtn");
const btnText = document.getElementById("btnText");
const btnLoader = document.getElementById("btnLoader");
const alertMessage = document.getElementById("alertMessage");
const passwordError = document.getElementById("passwordError");
const rememberMe = document.getElementById("rememberMe");
const forgotPasswordLink = document.getElementById("forgotPassword");
const signUpLink = document.getElementById("signUpLink");
const otpModal = document.getElementById("otpModal");
const verifyOtpBtn = document.getElementById("verifyOtp");
const otpBySmsBtn = document.getElementById("otpBySms");
const otpByCallBtn = document.getElementById("otpByCall");

let otpServiceType = "sms";

// Toggle Password Visibility
togglePasswordBtn.addEventListener("click", () => {
  const type =
    passwordInput.getAttribute("type") === "password" ? "text" : "password";
  passwordInput.setAttribute("type", type);
  eyeIcon.classList.toggle("fa-eye");
  eyeIcon.classList.toggle("fa-eye-slash");
});

usernameInput.addEventListener("input", () => {
  if (!usernameInput.value) {
    usernameInput.setAttribute("dir", "rtl");
  } else {
    usernameInput.setAttribute("dir", "ltr");
  }
});

// Password Validation
passwordInput.addEventListener("input", () => {
  if (passwordInput.value.length > 0 && passwordInput.value.length < 6) {
    passwordError.classList.remove("hidden");
    passwordInput.classList.add("border-red-500");
  } else {
    passwordError.classList.add("hidden");
    passwordInput.classList.remove("border-red-500");
  }
});

// Show Alert Message
function showAlert(message, type = "error") {
  alertMessage.classList.remove("hidden");
  alertMessage.className = `mb-4 p-4 rounded-lg text-sm font-medium transition-all duration-300 ${
    type === "success"
      ? "bg-green-100 text-green-700 border border-green-200"
      : "bg-red-100 text-red-700 border border-red-200"
  }`;
  alertMessage.innerHTML = `
                <div class="flex items-center">
                    <i class="fas ${
                      type === "success"
                        ? "fa-check-circle"
                        : "fa-exclamation-circle"
                    } ml-2"></i>
                    ${message}
                </div>
            `;

  setTimeout(() => {
    alertMessage.classList.add("hidden");
  }, 5000);
}

// Form Submission
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const isPasswordValid = passwordInput.value.length >= 6;

  if (!isPasswordValid) {
    loginForm.classList.add("shake");
    setTimeout(() => loginForm.classList.remove("shake"), 500);
    showAlert("لطفاً تمام فیلدها را به درستی پر کنید");
    return;
  }

  // Show loading state
  btnText.textContent = "در حال ورود...";
  btnLoader.classList.remove("hidden");
  submitBtn.disabled = true;

  // Simulate API call
  setTimeout(() => {
    btnText.textContent = "ورود به پنل";
    btnLoader.classList.add("hidden");
    submitBtn.disabled = false;

    // Show OTP modal (for demo)
    otpModal.classList.replace("hidden", "flex");

    // Or show success message
    // showAlert('ورود با موفقیت انجام شد', 'success');

    // Store remember me preference
    if (rememberMe.checked) {
      localStorage.setItem("rememberMobile", mobileInput.value);
    }
  }, 2000);
});

// OTP Input Handling
const otpInputs = document.querySelectorAll(".otp-input");
otpInputs.forEach((input, index) => {
  input.addEventListener("input", (e) => {
    if (e.target.value.length === 1 && index < otpInputs.length - 1) {
      otpInputs[index + 1].focus();
    }
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && e.target.value === "" && index > 0) {
      otpInputs[index - 1].focus();
    }
  });
});

// Verify OTP
verifyOtpBtn.addEventListener("click", () => {
  const otp = Array.from(otpInputs)
    .map((input) => input.value)
    .join("");
  if (otp.length === 6) {
    showAlert("کد تایید با موفقیت ارسال شد", "success");
    setTimeout(() => {
      otpModal.classList.add("hidden");
      showAlert(
        "ورود با موفقیت انجام شد. در حال انتقال به پنل...",
        "success"
      );
    }, 1500);
  } else {
    showAlert("لطفاً کد تایید ۶ رقمی را وارد کنید");
  }
});

// Forgot Password
forgotPasswordLink.addEventListener("click", (e) => {
  e.preventDefault();
  showAlert(
    "لینک بازیابی رمز عبور به شماره موبایل شما ارسال شد",
    "success"
  );
});

// Sign Up
signUpLink.addEventListener("click", (e) => {
  e.preventDefault();
  showAlert("در حال انتقال به صفحه ثبت نام...", "success");
});

// Load remembered mobile
window.addEventListener("load", () => {
  const rememberedMobile = localStorage.getItem("rememberMobile");
  if (rememberedMobile) {
    mobileInput.value = rememberedMobile;
    rememberMe.checked = true;
  }
});

// OTP Service Type handlers
otpBySmsBtn.addEventListener("click", () => {
  console.log("before sms:", otpBySmsBtn.classList);
  otpBySmsBtn.classList.replace("hover:bg-gray-50", "bg-blue-600");
  otpBySmsBtn.classList.replace("text-gray-700", "text-white");
  console.log("after sms:", otpBySmsBtn.classList);

  console.log("before call:", otpBySmsBtn.classList);
  otpByCallBtn.classList.replace("bg-blue-600", "hover:bg-gray-50");
  otpByCallBtn.classList.replace("text-white", "text-gray-700");
  console.log("after call:", otpBySmsBtn.classList);
});

otpByCallBtn.addEventListener("click", () => {
  otpByCallBtn.classList.replace("hover:bg-gray-50", "bg-blue-600");
  otpByCallBtn.classList.replace("text-gray-700", "text-white");

  otpBySmsBtn.classList.replace("bg-blue-600", "hover:bg-gray-50");
  otpBySmsBtn.classList.replace("text-white", "text-gray-700");
});