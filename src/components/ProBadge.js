export function createProBadge() {
    const badge = document.createElement('span');
    badge.className = 'pro-badge';
    badge.textContent = 'PRO';
    return badge;
}

export function createUpgradePrompt(featureName, description) {
    const prompt = document.createElement('div');
    prompt.className = 'upgrade-prompt';
    prompt.innerHTML = `
        <div class="upgrade-prompt-content">
            <div class="upgrade-prompt-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
            </div>
            <div class="upgrade-prompt-text">
                <h3>${featureName} <span class="pro-badge">PRO</span></h3>
                <p>${description}</p>
            </div>
            <button class="upgrade-prompt-button">Upgrade to Pro</button>
        </div>
    `;

    const button = prompt.querySelector('.upgrade-prompt-button');
    button.addEventListener('click', () => {
        window.location.hash = '#/pricing';
    });

    return prompt;
}

export function createProFeatureOverlay(featureName, description) {
    const overlay = document.createElement('div');
    overlay.className = 'pro-feature-overlay';
    overlay.innerHTML = `
        <div class="pro-feature-overlay-content">
            <div class="pro-feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
            </div>
            <h3>${featureName}</h3>
            <p>${description}</p>
            <button class="upgrade-button">Upgrade to Pro - $9.99/mo</button>
        </div>
    `;

    const button = overlay.querySelector('.upgrade-button');
    button.addEventListener('click', () => {
        window.location.hash = '#/pricing';
    });

    return overlay;
}
