// Simple navigation highlighting
document.addEventListener('DOMContentLoaded', function() {
    // Highlight the current page in the sidebar
    const currentPath = window.location.pathname;
    const currentFile = currentPath.split('/').pop();

    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        const linkFile = link.getAttribute('href').split('/').pop();
        if (linkFile === currentFile) {
            link.classList.add('active');
        }
    });

    // Simple search functionality
    const searchInput = document.getElementById('doc-search');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();

            // If search is empty, show all nav links
            if (searchTerm === '') {
                navLinks.forEach(link => {
                    link.style.display = 'block';
                });
                return;
            }

            // Filter nav links based on search term
            navLinks.forEach(link => {
                const text = link.textContent.toLowerCase();
                if (text.includes(searchTerm)) {
                    link.style.display = 'block';
                } else {
                    link.style.display = 'none';
                }
            });
        });
    }
});
