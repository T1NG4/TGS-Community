// Header Desktop JS (scroll behavior)
function handleHeaderScrollDesktop() {
    const header = document.querySelector('.header');
    const logo = document.querySelector('.logo');
    const navMenu = document.querySelector('.nav-menu');
    const hero = document.querySelector('.hero');
    const products = document.getElementById('products');
    if (!header || !logo || !hero || !products) return;
    const logoRect = logo.getBoundingClientRect();
    const menuRect = navMenu.getBoundingClientRect();
    const heroRect = hero.getBoundingClientRect();
    const productsRect = products.getBoundingClientRect();
    const minTop = Math.min(logoRect.top, menuRect.top);
    const maxBottom = Math.max(logoRect.bottom, menuRect.bottom);
    if (maxBottom <= heroRect.top) {
        header.classList.remove('over-hero-dark', 'over-products');
        header.classList.add('over-light-area');
    } else if (maxBottom > heroRect.top && minTop < heroRect.bottom) {
        header.classList.remove('over-light-area', 'over-products');
        header.classList.add('over-hero-dark');
    } else if (minTop >= productsRect.top) {
        header.classList.remove('over-light-area', 'over-hero-dark');
        header.classList.add('over-products');
    } else {
        header.classList.remove('over-light-area', 'over-hero-dark', 'over-products');
    }
}
if (window.innerWidth > 768) {
    window.addEventListener('scroll', handleHeaderScrollDesktop);
}
