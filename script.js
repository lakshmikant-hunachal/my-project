function uploadAlert() {
    alert("Image Upload Feature Coming Soon!");
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
});