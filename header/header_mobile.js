// Header Mobile JS (menu toggle)
function handleHeaderMobileMenu() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const header = document.querySelector('.header');
    if (navToggle && navMenu && header) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            header.classList.toggle('retract');
            const navMenuMobile = document.querySelector('.nav-menu-mobile');
            if (navMenuMobile) navMenuMobile.classList.toggle('active');
        });
    }
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            const navMenuMobile = document.querySelector('.nav-menu-mobile');
            if (navMenuMobile) navMenuMobile.classList.remove('active');
        });
    });
}
if (window.innerWidth <= 768) {
    document.addEventListener('DOMContentLoaded', handleHeaderMobileMenu);
}
