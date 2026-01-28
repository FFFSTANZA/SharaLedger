document.addEventListener('DOMContentLoaded', () => {
    // Current page highlighting in sidebar
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (linkPath === currentPath) {
            link.classList.add('active');
        } else {
            if (linkPath !== '#') {
                link.classList.remove('active');
            }
        }
    });

    // Search Functionality
    const searchInput = document.getElementById('doc-search');
    const navSections = document.querySelectorAll('.nav-section');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            
            navSections.forEach(section => {
                let sectionHasMatch = false;
                const links = section.querySelectorAll('li');
                
                links.forEach(li => {
                    const text = li.textContent.toLowerCase();
                    if (text.includes(term)) {
                        li.style.display = 'block';
                        sectionHasMatch = true;
                    } else {
                        li.style.display = 'none';
                    }
                });

                if (sectionHasMatch || term === '') {
                    section.style.display = 'block';
                } else {
                    section.style.display = 'none';
                }
            });
        });
    }

    console.log('Versoll Books Docs: Complete Guide mode active');
});
