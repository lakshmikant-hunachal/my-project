let videoStream = null;

function uploadAlert() {
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('smartcrop_current_user'));

    if (currentUser) {
        document.getElementById('uploadModal').classList.add('active');
        resetUpload();
    } else {
        alert("Please login or register to use the Upload Crop Image feature.");
        sessionStorage.setItem('pendingAction', 'upload');
        window.location.href = 'login.html';
    }
}

let analysisTimer = null;

function closeUploadModal() {
    document.getElementById('uploadModal').classList.remove('active');
    stopCamera();
    clearTimeout(analysisTimer);
    resetUpload();
}

function resetUpload() {
    document.querySelector('.upload-options').style.display = 'flex';
    document.getElementById('cameraContainer').style.display = 'none';
    document.getElementById('previewContainer').style.display = 'none';
    document.getElementById('analysisResult').style.display = 'none';
    document.getElementById('fileInput').value = '';
    stopCamera();
}

// ---- File Upload Logic ----
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            showPreview(e.target.result);
        };
        reader.readAsDataURL(file);
    }
}

// ---- Camera Logic ----
async function startCamera() {
    document.querySelector('.upload-options').style.display = 'none';
    document.getElementById('cameraContainer').style.display = 'block';

    const video = document.getElementById('cameraVideo');

    try {
        videoStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' } // Prefer back camera on mobile
        });
        video.srcObject = videoStream;
    } catch (err) {
        console.error("Error accessing camera:", err);
        alert("Could not access camera. Please check permissions or use the file upload option.");
        resetUpload();
    }
}

// Ensure camera stops if user navigates away (B-07)
window.addEventListener('beforeunload', stopCamera);

function stopCamera() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
    const video = document.getElementById('cameraVideo');
    if (video) video.srcObject = null;
}

function captureImage() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.createElement('canvas');

    // Set canvas dimensions to match video stream
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to data URL and show preview
    const imageDataUrl = canvas.toDataURL('image/jpeg');
    stopCamera();
    showPreview(imageDataUrl);
}

// ---- Preview & Analyze Logic ----
function showPreview(imageSrc) {
    document.getElementById('cameraContainer').style.display = 'none';
    document.querySelector('.upload-options').style.display = 'none';

    const previewContainer = document.getElementById('previewContainer');
    const imagePreview = document.getElementById('imagePreview');

    imagePreview.src = imageSrc;
    previewContainer.style.display = 'block';
}

function analyzeCrop() {
    const analyzeBtn = document.querySelector('.analyze-btn');
    const originalText = analyzeBtn.textContent;

    // Show AI evaluating state
    analyzeBtn.innerHTML = '<span class="loading-spinner">🔄</span> Analyzing AI model...';
    analyzeBtn.disabled = true;

    // Simulate AI processing time
    analysisTimer = setTimeout(() => {
        analyzeBtn.textContent = originalText;
        analyzeBtn.disabled = false;

        // Show result
        const resultContainer = document.getElementById('analysisResult');
        resultContainer.style.display = 'block';

        // Mock result data (in a real app, this would come from the backend AI)
        const mockDiseases = [
            { name: "Healthy", tag: "healthy-tag", prob: "94%", treat: "Continue current irrigation and fertilization practices." },
            { name: "Leaf Blight", tag: "disease-tag", prob: "87%", treat: "Apply fungicide. Ensure proper spacing between plants for airflow." },
            { name: "Powdery Mildew", tag: "disease-tag", prob: "92%", treat: "Remove affected leaves. Apply sulfur-based sprays." },
            { name: "Nitrogen Deficiency", tag: "disease-tag", prob: "78%", treat: "Apply nitrogen-rich fertilizer or compost." }
        ];

        // Pick a random result for demonstration
        const randomResult = mockDiseases[Math.floor(Math.random() * mockDiseases.length)];

        resultContainer.innerHTML = `
            <h3>Analysis Complete <span style="font-size: 0.8rem; background: #fee2e2; color: #ef4444; padding: 2px 6px; border-radius: 4px; margin-left: 10px;">Demo Mode - Not Real Analysis</span></h3>
            <div class="result-item">
                <span class="result-label">Status:</span>
                <span class="${randomResult.tag}">${randomResult.name}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Confidence:</span>
                <span class="result-value">${randomResult.prob}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Action:</span>
                <span class="result-value">${randomResult.treat}</span>
            </div>
        `;

        // Scroll to results
        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    }, 2000); // 2 second mock delay
}

// ---- Water Quality Logic ----
function checkWater(type) {
    const resultDiv = document.getElementById('waterResult');
    resultDiv.style.display = 'block';
    
    // For smooth appearance without offsetHeight reflow lag (L-05)
    resultDiv.style.animation = 'none';
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            resultDiv.style.animation = 'fadeIn 0.6s ease-out forwards';
        });
    });

    if (type === 'sweet') {
        resultDiv.innerHTML = `
            <h4>💧 Sweet / Fresh Water Detected</h4>
            <p><strong>Status:</strong> Optimal for agriculture.</p>
            <p><strong>Recommendation:</strong> Your water is great for most crops. You can effectively use <strong>Precision Irrigation</strong>.</p>
            <ul>
                <li>Utilize drip or sprinkler systems to minimize water waste.</li>
                <li>Deliver moisture directly to the root zone, improving water efficiency by over 30%.</li>
            </ul>
        `;
        resultDiv.style.borderLeftColor = '#10b981'; // Green
    } else if (type === 'salt') {
        resultDiv.innerHTML = `
            <h4>🧂 Salt / Hard Water Detected</h4>
            <p><strong>Status:</strong> Requires careful management.</p>
            <p><strong>Recommendation:</strong> High salinity can damage roots and reduce yield. Consider these practices:</p>
            <ul>
                <li><strong>Precision Irrigation:</strong> Utilize <strong>drip systems</strong> (not sprinklers) to deliver moisture directly to the root zone without wetting the leaves, which prevents salt burn.</li>
                <li>Leach the soil periodically with excess water to push salts below the root zone.</li>
                <li>Grow salt-tolerant crops like Barley, Rye, or Date Palms.</li>
            </ul>
        `;
        resultDiv.style.borderLeftColor = '#f59e0b'; // Orange
    } else if (type === 'unknown') {
        resultDiv.innerHTML = `
            <h4>🔍 How to Check Your Water Quality</h4>
            <p>If you are unsure about your water content, here are ways to test it:</p>
            <ul>
                <li><strong>Taste Test:</strong> The simplest method. If it tastes salty or brackish, it has high salinity. Sweet water tastes plain and fresh.</li>
                <li><strong>Observation:</strong> Check for white chalky residue on leaves after sprinkler irrigation or on the soil surface when dry.</li>
                <li><strong>EC Meter:</strong> Use an Electrical Conductivity (EC) meter to measure dissolved salts precisely.</li>
                <li><strong>Lab Testing:</strong> For a comprehensive analysis, send a water sample to a local agricultural testing laboratory.</li>
            </ul>
            <p>Once you know your water type, you can use <strong>Precision Irrigation</strong> tailored to your needs to improve water efficiency by over 30%!</p>
        `;
        resultDiv.style.borderLeftColor = '#0ea5e9'; // Blue
    }
    
    // Scroll to the result
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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

        // Check if welcome message already exists to avoid duplicates (L-02)
        if (!document.getElementById('welcome-msg')) {
            // Add Welcome Message
            const welcomeSpan = document.createElement('span');
            welcomeSpan.id = 'welcome-msg';
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

            logoutBtn.addEventListener('click', function (e) {
                e.preventDefault();
                // Clear all data to protect privacy on shared computers (B-09)
                localStorage.removeItem('smartcrop_current_user');
                localStorage.removeItem('smartcrop_users');
                alert('You have been logged out and all data cleared from this device successfully.');
                window.location.reload(); // Reload to update UI back to guest state
            });

            // Insert them into nav
            nav.appendChild(welcomeSpan);
            nav.appendChild(logoutBtn);
        }
    }
    
    // Check pending action intent (B-08)
    if (currentUser && sessionStorage.getItem('pendingAction') === 'upload') {
        sessionStorage.removeItem('pendingAction');
        document.getElementById('uploadModal').classList.add('active');
        resetUpload();
    }

    // ----- PWA Service Worker Registration -----
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            }, err => {
                console.log('ServiceWorker registration failed: ', err);
            });
        });
    }
});