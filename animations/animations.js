// Animações de scroll
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
            }
        });
    }, observerOptions);
    document.querySelectorAll('.feature-card, .product-card, .contact-item').forEach(el => {
        observer.observe(el);
    });
}
document.addEventListener('DOMContentLoaded', setupScrollAnimations);
