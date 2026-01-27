document.addEventListener('DOMContentLoaded', () => {
    // Current page highlighting in sidebar (fallback)
    const currentPath = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (linkPath === currentPath) {
            link.classList.add('active');
        } else if (currentPath === '' && linkPath === 'index.html') {
            link.classList.add('active');
        }
    });

    // Mobile navigation toggle (if added later)
    console.log('Versoll Books Docs initialized');
});
