let currentSection = 'import';

export function initializeNavigation() {
    const navItems = document.querySelectorAll('[data-nav-section]');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.getAttribute('data-nav-section');
            navigateToSection(section);
        });
    });

    navigateToSection(currentSection);
}

export function navigateToSection(sectionName) {
    const sections = document.querySelectorAll('[data-section]');
    const navItems = document.querySelectorAll('[data-nav-section]');

    sections.forEach(section => {
        section.style.display = 'none';
    });

    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-nav-section') === sectionName) {
            item.classList.add('active');
        }
    });

    const targetSection = document.querySelector(`[data-section="${sectionName}"]`);
    if (targetSection) {
        targetSection.style.display = 'block';
        currentSection = sectionName;

        if (window.onSectionChange) {
            window.onSectionChange(sectionName);
        }
    }
}

export function getCurrentSection() {
    return currentSection;
}

export function showSection(sectionName) {
    navigateToSection(sectionName);
}

export function canNavigateToHome() {
    return window.appState && window.appState.hasData;
}
