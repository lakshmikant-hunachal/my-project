let videoStream = null;

function uploadAlert() {
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('smartcrop_current_user'));

    if (currentUser) {
        document.getElementById('uploadModal').classList.add('active');
        resetUpload();
    } else {
        alert("Please login or register to use the Upload Crop Image feature.");
        // B-08 Store intent
        sessionStorage.setItem('pendingAction', 'upload');
        window.location.href = 'login.html';
    }
}

let analysisTimer = null;
let currentMockDisease = null;

function closeUploadModal() {
    document.getElementById('uploadModal').classList.remove('active');
    stopCamera();
    
    // L-03 Cancel any pending timeout and clear results
    if (analysisTimer) {
        clearTimeout(analysisTimer);
        analysisTimer = null;
    }
    const analyzeBtn = document.querySelector('.analyze-btn');
    if (analyzeBtn) {
        analyzeBtn.innerHTML = 'Analyze Crop';
        analyzeBtn.disabled = false;
    }
    
    resetUpload();
}

function resetUpload() {
    document.querySelector('.upload-options').style.display = 'flex';
    document.getElementById('cameraContainer').style.display = 'none';
    document.getElementById('previewContainer').style.display = 'none';
    document.getElementById('analysisResult').style.display = 'none';
    document.getElementById('analysisResult').innerHTML = ''; // Also clear HTML
    document.getElementById('saveResultContainer').style.display = 'none';
    document.getElementById('fileInput').value = '';
    currentMockDisease = null;
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
        analyzeBtn.innerHTML = 'Analyze Crop';
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
        currentMockDisease = randomResult;

        // B-06: Clearly label this as a demo and safe from XSS
        resultContainer.innerHTML = `
            <h3>Analysis Complete <span style="font-size: 0.75rem; background: #fee2e2; color: #ef4444; padding: 4px 8px; border-radius: 4px; margin-left: 10px; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid #fecaca;">Demo Mode</span></h3>
            <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 15px; font-style: italic;">Note: This is a simulation using random data. In production, this would connect to a Python ML Backend.</p>
            <div class="result-item">
                <span class="result-label">Status:</span>
                <span id="safe-status"></span>
            </div>
            <div class="result-item">
                <span class="result-label">Confidence:</span>
                <span id="safe-prob"></span>
            </div>
            <div class="result-item">
                <span class="result-label">Action:</span>
                <span id="safe-treat"></span>
            </div>
        `;
        const statusEl = document.getElementById('safe-status');
        statusEl.className = randomResult.tag;
        statusEl.textContent = randomResult.name;
        document.getElementById('safe-prob').textContent = randomResult.prob;
        document.getElementById('safe-treat').textContent = randomResult.treat;

        document.getElementById('saveResultContainer').style.display = 'block';

        // Scroll to results
        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    }, 2500); // 2.5 second mock delay
}

// ---- F-02 Scan History / Dashboard Logic ----
function saveScanResult() {
    const currentUser = JSON.parse(localStorage.getItem('smartcrop_current_user'));
    if (!currentUser || !currentMockDisease) return;

    // Get the image preview source
    const imageSrc = document.getElementById('imagePreview').src;
    
    // Create scan record
    const scanRecord = {
        userEmail: currentUser.email,
        timestamp: new Date().toISOString(),
        image: imageSrc,
        disease: currentMockDisease.name,
        confidence: currentMockDisease.prob,
        treatment: currentMockDisease.treat,
        tag: currentMockDisease.tag
    };

    let allScans = JSON.parse(localStorage.getItem('smartcrop_disease_scans')) || [];
    allScans.unshift(scanRecord); // Add to beginning
    localStorage.setItem('smartcrop_disease_scans', JSON.stringify(allScans));

    alert("Scan result saved to your dashboard!");
    document.getElementById('saveResultContainer').style.display = 'none';
}

function openDashboardModal() {
    const currentUser = JSON.parse(localStorage.getItem('smartcrop_current_user'));
    if (!currentUser) return;

    document.getElementById('dashboardModal').classList.add('active');
    
    const container = document.getElementById('scanHistoryContainer');
    let allScans = JSON.parse(localStorage.getItem('smartcrop_disease_scans')) || [];
    
    // Filter for current user
    const userScans = allScans.filter(scan => scan.userEmail === currentUser.email);

    if (userScans.length === 0) {
        container.innerHTML = '<div style="padding: 30px; text-align: center; background: #f8fafc; border-radius: var(--border-radius-md); color: var(--text-muted);">No scans found. Upload a crop image to see history here.</div>';
        return;
    }

    let html = '<div style="display: flex; flex-direction: column; gap: 15px;">';
    
    userScans.forEach(scan => {
        const date = new Date(scan.timestamp).toLocaleString();
        html += `
            <div style="display: flex; gap: 15px; padding: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: var(--border-radius-md); align-items: center;">
                <img src="${scan.image}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid #cbd5e1;" alt="Scan thumbnail">
                <div style="flex: 1;">
                    <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 5px;">${date}</div>
                    <div style="font-weight: 600; color: var(--text-main); margin-bottom: 5px;">${scan.disease} <span style="font-size: 0.8rem; font-weight: 400; color: var(--text-muted); margin-left: 10px;">Confidence: ${scan.confidence}</span></div>
                    <div style="font-size: 0.9rem; color: var(--text-muted);">${scan.treatment}</div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function closeDashboardModal() {
    document.getElementById('dashboardModal').classList.remove('active');
}

// ---- Water Quality Logic ----
function checkWater(type) {
    const resultDiv = document.getElementById('waterResult');
    
    // For smooth appearance without offsetHeight reflow lag (L-05)
    // Remove the class to reset the animation
    resultDiv.classList.remove('fade-in-active');
    resultDiv.style.display = 'block';

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
    
    // Trigger paint layout without reflow, add class for CSS animation
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            resultDiv.classList.add('fade-in-active');
        });
    });
    
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
            // L-02: Use innerHTML to ensure only one instance of user/logout elements exist
            
            // Create a specific container if it doesn't exist, else use existing
            let userNavContainer = document.getElementById('user-nav-container');
            if (!userNavContainer) {
                userNavContainer = document.createElement('div');
                userNavContainer.id = 'user-nav-container';
                userNavContainer.style.display = 'inline-flex';
                userNavContainer.style.alignItems = 'center';
                userNavContainer.style.gap = '15px';
                
                // Insert after nav elements but before the translate element, or at the end
                nav.insertBefore(userNavContainer, document.querySelector('.nav-translate-wrapper'));
            }

            userNavContainer.innerHTML = `
                <a href="#" onclick="openDashboardModal(); return false;" id="dashboard-btn" class="nav-btn" style="color: var(--primary-dark); font-weight: 600; border: 1px solid var(--primary-color);">My Dashboard</a>
                <span id="welcome-msg" style="color: white; font-weight: 500;">👋 Hi, ${currentUser.name}</span>
                <a href="#" id="logout-btn" class="nav-btn" style="background-color: #ff4d4d; color: white; border: none; padding: 8px 16px;">Logout</a>
            `;

            document.getElementById('logout-btn').addEventListener('click', function (e) {
                e.preventDefault();
                // BUG-05 Fix: Only remove current user session, leave standard users alone
                localStorage.removeItem('smartcrop_current_user');
                alert('You have been logged out successfully.');
                
                window.location.reload(); // Reload to update UI back to guest state
            });
        }
    }
    
    // Check pending action intent (B-08)
    if (currentUser && sessionStorage.getItem('pendingAction') === 'upload') {
        sessionStorage.removeItem('pendingAction');
        document.getElementById('uploadModal').classList.add('active');
        resetUpload();
    }

    // ----- F-04 Weather Mock Geolocation Simulation -----
    if ("geolocation" in navigator) {
        // Just mock the city name instead of real API call for safety/local purpose
        setTimeout(() => {
            const locText = document.getElementById('weather-location');
            if(locText) locText.textContent = "Location: Maharashtra, India";
        }, 1500);
    }

    // ----- F-07 Voice Assistant (Web Speech API) -----
    const voiceBtn = document.getElementById('voiceBtn');
    if (voiceBtn) {
        voiceBtn.addEventListener('click', () => {
            if (!('speechSynthesis' in window)) {
                alert("Sorry, your browser doesn't support text to speech!");
                return;
            }

            // Create utterance
            const message = "Welcome to Smart Crop Doctor. I am your farming assistant. You can upload an image of your crop to detect diseases, or check your water quality below.";
            const speech = new SpeechSynthesisUtterance(message);
            speech.rate = 0.9;
            speech.pitch = 1;

            // Optional: try to set a Hindi/Indian English voice if available
            const voices = window.speechSynthesis.getVoices();
            const indianVoice = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('hi-IN'));
            if(indianVoice) speech.voice = indianVoice;

            // Cancel any ongoing speech and speak
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(speech);

            // UI feedback
            voiceBtn.style.animation = "pulse 1s infinite alternate";
            speech.onend = () => {
                voiceBtn.style.animation = "";
            };
        });
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

// ----- F-08 Soil Calculator Logic -----
function calculateSoil() {
    const n = parseFloat(document.getElementById('soil-n').value);
    const p = parseFloat(document.getElementById('soil-p').value);
    const k = parseFloat(document.getElementById('soil-k').value);
    
    if (isNaN(n) || isNaN(p) || isNaN(k)) {
        alert("Please enter valid numbers for N, P, and K.");
        return;
    }

    const resultDiv = document.getElementById('soil-result');
    resultDiv.style.display = 'block';

    let advice = "";
    if (n < 30) {
        advice += "<li><strong>Nitrogen is Low:</strong> Apply Urea or Ammonia-based fertilizer. Add compost or plant legumes.</li>";
    }
    if (p < 15) {
        advice += "<li><strong>Phosphorus is Low:</strong> Use Bone Meal or Superphosphate. Essential for root growth.</li>";
    }
    if (k < 20) {
        advice += "<li><strong>Potassium is Low:</strong> Apply Potash or wood ashes. Needed for disease resistance.</li>";
    }

    if (advice === "") {
        resultDiv.innerHTML = `<h4 style="color: #4d7c0f; margin-bottom: 10px;">✅ Optimal Soil Health</h4><p>Your soil nutrient levels are perfectly balanced for most crops!</p>`;
    } else {
        resultDiv.innerHTML = `<h4 style="color: #4d7c0f; margin-bottom: 10px;">📋 Fertilizer Prescription</h4><ul style="margin-left: 20px; line-height: 1.6;">${advice}</ul>`;
    }
}

// ----- F-05 Disease Encyclopedia Modal Logic -----
const diseaseData = {
    blight: {
        title: "Leaf Blight",
        cause: "Fungal or Bacterial (e.g. Xanthomonas oryzae)",
        desc: "A common disease characterized by the rapid browning and dying of plant tissue. Leaves develop water-soaked stripes which turn yellow and then white.",
        treatments: ["Apply copper-based fungicides", "Ensure proper crop spacing to improve air circulation", "Avoid overhead irrigation"],
        crops: "Rice, Corn, Tomatoes, Potatoes"
    },
    mildew: {
        title: "Powdery Mildew",
        cause: "Fungal Spores (Erysiphales)",
        desc: "Appears as white, powdery spots on leaves and stems. As the disease progresses, the spots get larger and denser, eventually covering entirely and inhibiting photosynthesis.",
        treatments: ["Spray sulfur or potassium bicarbonate based fungicides", "Remove and destroy infected plant parts immediately", "Apply Neem Oil preventive sprays"],
        crops: "Wheat, Grapes, Cucumbers, Melons"
    },
    rust: {
        title: "Rust",
        cause: "Pucciniales Fungi",
        desc: "Identified by rust-colored, powdery pustules on the lower surfaces of leaves. It severely damages cereal crops by rupturing the epidermis.",
        treatments: ["Use resistant crop varieties", "Apply systemic fungicides (e.g., tebuconazole)", "Rotate crops yearly to break the fungal lifecycle"],
        crops: "Wheat, Barley, Oats, Beans, Corn"
    }
};

window.openDiseaseModal = function(id) {
    const data = diseaseData[id];
    if (!data) return;

    const modal = document.getElementById('diseaseModal');
    const content = document.getElementById('encyclopediaContent');
    
    let treatmentsHtml = data.treatments.map(t => `<li style="margin-bottom: 8px;">${t}</li>`).join('');

    content.innerHTML = `
        <h2 style="color: var(--primary-dark); font-size: 2rem; margin-bottom: 5px;">${data.title}</h2>
        <p style="color: var(--accent); font-weight: 600; margin-bottom: 20px;">Cause: ${data.cause}</p>
        
        <h4 style="font-size: 1.2rem; margin-bottom: 10px; margin-top: 25px;">Description</h4>
        <p style="color: var(--text-muted); line-height: 1.6;">${data.desc}</p>
        
        <h4 style="font-size: 1.2rem; margin-bottom: 10px; margin-top: 25px;">Affected Crops</h4>
        <p style="color: var(--text-muted); background: #f0fdf4; padding: 10px 15px; border-radius: 8px; display: inline-block;">${data.crops}</p>

        <h4 style="font-size: 1.2rem; margin-bottom: 10px; margin-top: 25px;">Expert Treatments</h4>
        <ul style="color: var(--text-muted); padding-left: 20px;">
            ${treatmentsHtml}
        </ul>
    `;

    modal.classList.add('active');
};