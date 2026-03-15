// User Authentication Logic using LocalStorage

document.addEventListener('DOMContentLoaded', () => {
    
    // ----- Registration Logic -----
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Prevent default form submission
            
            // Get input values
            const name = document.getElementById('reg-name').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const phone = document.getElementById('reg-phone').value.trim();
            const password = document.getElementById('reg-password').value;
            const confirmPassword = document.getElementById('reg-confirm-password').value;
            
            // Validation for unmatched data (passwords)
            if (password !== confirmPassword) {
                alert("Passwords do not match! Please enter valid, matched data.");
                return;
            }

            // Basic validation for empty data
            if (!name || !email || !phone || !password) {
                alert("Please fill in all fields with valid data.");
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
                password: password // In a real app, never store plain text passwords!
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
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Prevent default form submission
            
            // Get input values
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;
            
            // Fetch existing users from localStorage
            let users = JSON.parse(localStorage.getItem('smartcrop_users')) || [];
            
            // Find user with matching email
            const emailExists = users.find(user => user.email === email);
            
            if (!emailExists) {
                alert("Please enter a valid email. This email is not registered.");
                return;
            }
            
            if (emailExists.password !== password) {
                alert("Invalid password. Please try again or use Forgot Password.");
                return;
            }

            // Login successful
            alert("Login successful! Welcome back.");
            
            // Save current logged in user session (optional, but good practice)
            localStorage.setItem('smartcrop_current_user', JSON.stringify(emailExists));
            
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
        });
    }
});

let currentForgotMode = '';
let generatedCode = '';
let targetEmail = '';

window.sendVerificationCode = function(mode) {
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
    
    alert(`A verification code has been sent to ${email} (Simulation: The code is ${generatedCode})`);
    
    document.getElementById('forgot-step-1').style.display = 'none';
    document.getElementById('forgot-step-2').style.display = 'block';
    
    if (mode === 'change') {
        document.getElementById('new-password-group').style.display = 'block';
    } else {
        document.getElementById('new-password-group').style.display = 'none';
    }
};

window.verifyAndProceed = function() {
    const codeEntered = document.getElementById('verification-code').value.trim();
    if (codeEntered !== generatedCode) {
        alert("Invalid verification code. Please try again.");
        return;
    }

    let users = JSON.parse(localStorage.getItem('smartcrop_users')) || [];
    const userIndex = users.findIndex(user => user.email === targetEmail);

    if (currentForgotMode === 'know') {
        alert(`Your password is: ${users[userIndex].password}`);
        document.getElementById('forgotPasswordModal').style.display = 'none';
    } else if (currentForgotMode === 'change') {
        const newPassword = document.getElementById('new-password').value;
        if (!newPassword) {
            alert("Please enter a new password.");
            return;
        }
        users[userIndex].password = newPassword;
        localStorage.setItem('smartcrop_users', JSON.stringify(users));
        alert("Password changed successfully! You can now log in with your new password.");
        document.getElementById('forgotPasswordModal').style.display = 'none';
    }
};
