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
            
            // Find user with matching email and password
            const matchedUser = users.find(user => user.email === email && user.password === password);
            
            if (matchedUser) {
                // Login successful
                alert("Login successful! Welcome back.");
                
                // Save current logged in user session (optional, but good practice)
                localStorage.setItem('smartcrop_current_user', JSON.stringify(matchedUser));
                
                // Redirect to home page
                window.location.href = 'index.html';
            } else {
                // Invalid email or password
                alert("Invalid email ID or password. Please try again.");
            }
        });
    }
});
