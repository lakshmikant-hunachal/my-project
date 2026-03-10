function uploadAlert() {
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('smartcrop_current_user'));
    
    if (currentUser) {
        alert("Hello " + currentUser.name + "! The Image Upload feature is opening... (Coming Soon!)");
    } else {
        alert("Please login or register to use the Upload Crop Image feature.");
        window.location.href = 'login.html';
    }
}

// Scroll Animation Observer
document.addEventListener('DOMContentLoaded', () => {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: Stop observing once element is visible
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Select all elements with the 'fade-in' class
    document.querySelectorAll('.fade-in').forEach(element => {
        observer.observe(element);
    });

    // ----- Check Authentication Status for UI Updates -----
    const currentUser = JSON.parse(localStorage.getItem('smartcrop_current_user'));
    const loginBtn = document.querySelector('.login-btn-nav');
    const registerBtn = document.querySelector('.register-btn-nav');
    const nav = document.querySelector('nav');
    
    if (currentUser && loginBtn && registerBtn) {
        // Hide login and register buttons
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        
        // Add Welcome Message
        const welcomeSpan = document.createElement('span');
        welcomeSpan.style.color = 'white';
        welcomeSpan.style.fontWeight = '500';
        welcomeSpan.style.marginRight = '15px';
        welcomeSpan.textContent = '👋 Hi, ' + currentUser.name;
        
        // Add Logout Button
        const logoutBtn = document.createElement('a');
        logoutBtn.href = '#';
        logoutBtn.className = 'nav-btn';
        logoutBtn.textContent = 'Logout';
        logoutBtn.style.backgroundColor = '#ff4d4d'; // Red color for logout
        logoutBtn.style.color = 'white';
        logoutBtn.style.border = 'none';
        
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('smartcrop_current_user');
            alert('You have been logged out successfully.');
            window.location.reload(); // Reload to update UI back to guest state
        });
        
        // Insert them into nav
        nav.appendChild(welcomeSpan);
        nav.appendChild(logoutBtn);
    }
});