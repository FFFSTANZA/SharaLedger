// Navigation highlighting and improved search
document.addEventListener('DOMContentLoaded', function() {
    // Highlight the current page in the sidebar
    const currentPath = window.location.pathname;
    const currentFile = currentPath.split('/').pop() || 'index.html';

    const navLinks = document.querySelectorAll('.nav-links a');
    const navSections = document.querySelectorAll('.nav-section');
    
    navLinks.forEach(link => {
        const linkFile = link.getAttribute('href').split('/').pop();
        if (linkFile === currentFile) {
            link.classList.add('active');
        }
    });

    // Improved search functionality
    const searchInput = document.getElementById('doc-search');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase().trim();

            if (searchTerm === '') {
                // Show all links and sections
                navLinks.forEach(link => {
                    link.parentElement.style.display = 'block';
                });
                navSections.forEach(section => {
                    section.style.display = 'block';
                });
                return;
            }

            // Filter nav links and sections
            navSections.forEach(section => {
                const links = section.querySelectorAll('.nav-links li');
                const sectionHeader = section.querySelector('h3');
                const sectionHeaderText = sectionHeader ? sectionHeader.textContent.toLowerCase() : '';
                
                let sectionHasVisibleLink = false;

                // If section header matches, show all links in it
                if (sectionHeaderText.includes(searchTerm)) {
                    links.forEach(li => {
                        li.style.display = 'block';
                    });
                    sectionHasVisibleLink = true;
                } else {
                    links.forEach(li => {
                        const link = li.querySelector('a');
                        const text = link.textContent.toLowerCase();
                        if (text.includes(searchTerm)) {
                            li.style.display = 'block';
                            sectionHasVisibleLink = true;
                        } else {
                            li.style.display = 'none';
                        }
                    });
                }

                // Show/hide section based on whether it has visible content
                if (sectionHasVisibleLink) {
                    section.style.display = 'block';
                } else {
                    section.style.display = 'none';
                }
            });
        });
    }
});
