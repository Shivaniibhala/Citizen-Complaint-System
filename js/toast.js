// js/toast.js
document.addEventListener('DOMContentLoaded', () => {
    // Inject the toast container into the body precisely once
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
});

window.showToast = function(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return; // fail safe

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    
    toast.innerHTML = `<span class="toast-icon">${icon}</span> <span class="toast-msg">${message}</span>`;
    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Destruct
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 350); // wait for CSS transition 0.3s
    }, 3500); // Wait 3.5 seconds before hiding
};
