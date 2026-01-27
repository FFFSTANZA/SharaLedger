document.addEventListener('DOMContentLoaded', () => {
    // Current page highlighting in sidebar
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (linkPath === currentPath) {
            link.classList.add('active');
        } else {
            // Remove active class if it was set in the HTML template but doesn't match
            if (linkPath !== '#') {
                link.classList.remove('active');
            }
        }
    });

    // Simple interaction for cards
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-2px)';
            card.style.transition = 'transform 0.2s ease';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });
    });

    console.log('Versoll Books Docs: Tutorial mode active');
});
