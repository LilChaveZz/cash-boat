// js/script.js
window.addEventListener('scroll', function() {
    const nav = document.querySelector('.main-nav');
    if (!nav) return;
    if (window.scrollY > 50) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (!href || href === '#') return;
        const target = document.querySelector(href);
        if (!target) return; // evita errores si el id no existe
        e.preventDefault();
        target.scrollIntoView({
            behavior: 'smooth'
        });
    });
});