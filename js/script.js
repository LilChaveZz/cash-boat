// js/script.js
function adjustBodyPaddingForNav() {
    const nav = document.querySelector('.main-nav');
    if (!nav) return;
    const h = nav.offsetHeight;
    // set inline padding-top equal to nav height so content sits just below it
    document.body.style.paddingTop = `${h}px`;
    // expose nav height to CSS so scroll-margin-top works reliably
    document.documentElement.style.setProperty('--nav-height', `${h}px`);
}

window.addEventListener('DOMContentLoaded', adjustBodyPaddingForNav);
window.addEventListener('load', adjustBodyPaddingForNav); // ensure sizes after images/fonts load
window.addEventListener('resize', adjustBodyPaddingForNav);

let ticking = false;
window.addEventListener('scroll', function() {
    const nav = document.querySelector('.main-nav');
    if (!nav) return;
    if (window.scrollY > 50) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
    // avoid forcing layout on every scroll frame — batch with rAF
    if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
            adjustBodyPaddingForNav();
            ticking = false;
        });
    }
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', async function (e) {
        const href = this.getAttribute('href');
        if (!href || href === '#') return;
        const target = document.querySelector(href);
        if (!target) return; // evita errores si el id no existe
        e.preventDefault();

        // ensure nav height / CSS var is up-to-date before calculating scroll
        adjustBodyPaddingForNav();

        // wait two animation frames so layout (fonts, mobile UI) can settle
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

        // recompute after frames
        adjustBodyPaddingForNav();
        const nav = document.querySelector('.main-nav');
        const navHeight = nav ? nav.offsetHeight : 0;
        const targetY = Math.max(0, target.getBoundingClientRect().top + window.scrollY - navHeight);

        window.scrollTo({
            top: targetY,
            behavior: 'smooth'
        });

        // update the URL fragment without jumping
        if (history && history.pushState) {
            history.pushState(null, '', href);
        } else {
            location.hash = href;
        }
    });
});