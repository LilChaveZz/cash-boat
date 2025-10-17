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

        // wait two animation frames so layout (fonts, mobile UI) can settle,
        // which is crucial for the initial load and hash change for accurate height.
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

        // Recompute after frames to get the final, stable height
        adjustBodyPaddingForNav();
        const nav = document.querySelector('.main-nav');
        const navHeight = nav ? nav.offsetHeight : 0;
        
        // Calculate the target position. We subtract the nav height to account for the fixed header.
        const targetY = Math.max(0, target.getBoundingClientRect().top + window.scrollY - navHeight);

        window.scrollTo({
            top: targetY,
            behavior: 'smooth'
        });

        // update the URL fragment without jumping
        // update the URL fragment without jumping
        if (history && history.pushState) {
            history.pushState(null, '', href);
        } else {
            location.hash = href;
        }
        
        // Handle initial load hash to scroll to the correct position
        if (window.location.hash && window.location.hash === href) {
            // If the hash is already in the URL, the browser might have scrolled,
            // so we re-scroll to the corrected position.
            window.scrollTo({
                top: targetY,
                behavior: 'smooth'
            });
        }
    });
});