// User Authentication Logic using LocalStorage

// BUG-01 Fix: Use SubtleCrypto for secure async hashing
async function hashPassword(str) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return [...new Uint8Array(hashBuffer)].map(b=>b.toString(16).padStart(2,'0')).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    
    // ----- Registration Logic -----
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault(); // Prevent default form submission
            
            // Get input values
            const name = document.getElementById('reg-name').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const phone = document.getElementById('reg-phone').value.trim();
            const password = document.getElementById('reg-password').value;
            const confirmPassword = document.getElementById('reg-confirm-password').value;
            
            // BUG-04 Fix: Basic validation for empty data FIRST
            if (!name || !email || !phone || !password || !confirmPassword) {
                alert("Please fill in all fields with valid data.");
                return;
            }

            // BUG-13 Fix: JavaScript phone validation
            const phoneRegex = /^(\+?\d{1,3}[- ]?)?\d{10}$/;
            if (!phoneRegex.test(phone)) {
                alert("Please enter a valid 10-digit phone number.");
                return;
            }

            // Strict email format validation (B-04)
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert("Please enter a valid email address format.");
                return;
            }

            // Validation for unmatched data (passwords)
            if (password !== confirmPassword) {
                alert("Passwords do not match! Please enter valid, matched data.");
                return;
            }
            
            // Fetch existing users from localStorage
            let users = JSON.parse(localStorage.getItem('smartcrop_users')) || [];
            
            // Check if user already exists
            const userExists = users.some(user => user.email === email);
            
            if (userExists) {
                alert("An account with this email is already created. Please try logging in.");
                return;
            }
            
            // Create new user object
            const newUser = {
                name: name,
                email: email,
                phone: phone,
                password: await hashPassword(password) // BUG-01 async hash passwords
            };
            
            // Add new user to array and save to localStorage
            users.push(newUser);
            localStorage.setItem('smartcrop_users', JSON.stringify(users));
            
            alert("Registration successful! You can now log in.");
            
            // Redirect to login page
            window.location.href = 'login.html';
        });
    }

    // ----- Login Logic -----
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault(); // Prevent default form submission
            
            // Get input values
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;
            
            // B-05 Rate Limit Data
            let rateLimitData = JSON.parse(localStorage.getItem('smartcrop_login_attempts')) || {};
            const now = Date.now();
            if (rateLimitData[email]) {
                const diffMins = (now - rateLimitData[email].timestamp) / (1000 * 60);
                if (rateLimitData[email].attempts >= 5 && diffMins < 15) {
                    alert('Too many failed login attempts. Please try again after 15 minutes.');
                    return;
                }
                if (diffMins >= 15) {
                    // Reset if lockout period passed
                    rateLimitData[email] = { attempts: 0, timestamp: now };
                }
            } else {
                rateLimitData[email] = { attempts: 0, timestamp: now };
            }

            // Fetch existing users from localStorage
            let users = JSON.parse(localStorage.getItem('smartcrop_users')) || [];
            
            // Find user with matching email
            const emailExists = users.find(user => user.email === email);
            
            if (!emailExists) {
                alert("Please enter a valid email. This email is not registered.");
                return;
            }
            
            // Check password hash
            const hashedInput = await hashPassword(password);
            if (emailExists.password !== hashedInput) {
                // Register failed attempt
                rateLimitData[email].attempts += 1;
                rateLimitData[email].timestamp = now;
                localStorage.setItem('smartcrop_login_attempts', JSON.stringify(rateLimitData));

                alert(`Invalid password. Please try again or use Forgot Password. (Attempt ${rateLimitData[email].attempts}/5)`);
                return;
            }

            // Reset attempts on success
            delete rateLimitData[email];
            localStorage.setItem('smartcrop_login_attempts', JSON.stringify(rateLimitData));

            // Login successful
            alert("Login successful! Welcome back.");
            
            // Save current logged in user session
            // Don't save password in cur_auth session securely
            const sessionUser = {
                name: emailExists.name,
                email: emailExists.email,
                phone: emailExists.phone
            };
            localStorage.setItem('smartcrop_current_user', JSON.stringify(sessionUser));
            
            // Redirect to home page
            window.location.href = 'index.html';
        });
    }

    // ----- Forgot Password Logic -----
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const forgotPasswordModal = document.getElementById('forgotPasswordModal');
    const closeForgotModal = document.getElementById('close-forgot-modal');
    
    if (forgotPasswordLink && forgotPasswordModal) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            forgotPasswordModal.style.display = 'flex';
            document.getElementById('forgot-step-1').style.display = 'block';
            document.getElementById('forgot-step-2').style.display = 'none';
        });

        closeForgotModal.addEventListener('click', () => {
            forgotPasswordModal.style.display = 'none';
            // BUG-08 Fix: Reset fields and step
            document.getElementById('forgot-email').value = '';
            document.getElementById('verification-code').value = '';
            document.getElementById('new-password').value = '';
            document.getElementById('forgot-step-1').style.display = 'block';
            document.getElementById('forgot-step-2').style.display = 'none';
            if (window.resetOTPState) window.resetOTPState();
        });
    }
});

// BUG-12 Fix: IIFE for OTP state
(function forgotPasswordModule() {
    let currentForgotMode = '';
    let generatedCode = '';
    let targetEmail = '';

    window.resetOTPState = function() {
        currentForgotMode = '';
        generatedCode = '';
        targetEmail = '';
    };

    window.sendVerificationCode = function(mode) {
        // BUG-02 Fix: Remove "Know Password" flow entirely
        
        const email = document.getElementById('forgot-email').value.trim();
        if (!email) {
            alert("Please enter your registered email.");
            return;
        }
        
        let users = JSON.parse(localStorage.getItem('smartcrop_users')) || [];
        const userExists = users.find(user => user.email === email);
        
        if (!userExists) {
            alert("Please enter a valid email. This email is not registered.");
            return;
        }

        // Simulate sending code
        generatedCode = Math.floor(1000 + Math.random() * 9000).toString();
        currentForgotMode = mode;
        targetEmail = email;
        
        // BUG-03 Fix: Don't leak code in UI, log to console
        console.log('[DEV ONLY] OTP:', generatedCode);
        alert(`A verification code has been sent to ${email}. Check your inbox.`);
        
        document.getElementById('forgot-step-1').style.display = 'none';
        document.getElementById('forgot-step-2').style.display = 'block';
        
        if (mode === 'change') {
            document.getElementById('new-password-group').style.display = 'block';
        } else {
            document.getElementById('new-password-group').style.display = 'none';
        }
    };

    window.verifyAndProceed = async function() {
        // L-04: Prevent bypass if code wasn't generated
        if (!generatedCode || !targetEmail) {
            alert("Please request a verification code first.");
            return;
        }

        const codeEntered = document.getElementById('verification-code').value.trim();
        if (codeEntered !== generatedCode) {
            alert("Invalid verification code. Please try again.");
            return;
        }

        let users = JSON.parse(localStorage.getItem('smartcrop_users')) || [];
        const userIndex = users.findIndex(user => user.email === targetEmail);

        if (currentForgotMode === 'change') {
            // BUG-07 Fix: Add trim and check length
            const newPassword = document.getElementById('new-password').value.trim();
            if (!newPassword || newPassword.length < 6) {
                alert("Password must be at least 6 characters.");
                return;
            }
            // BUG-01 Fix: use async SubtleCrypto hash
            users[userIndex].password = await hashPassword(newPassword);
            localStorage.setItem('smartcrop_users', JSON.stringify(users));
            alert("Password changed successfully! You can now log in with your new password.");
            document.getElementById('forgotPasswordModal').style.display = 'none';
            window.resetOTPState();
        }
    };
})();
