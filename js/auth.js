// js/auth.js

// Initialize local storage users
function initUsers() {
    let users = JSON.parse(localStorage.getItem('users')) || [];
    const adminExists = users.find(u => u.email === 'admin@gmail.com');
    if (!adminExists) {
        users.push({
            name: 'System Admin',
            email: 'admin@gmail.com',
            password: 'admin123',
            role: 'admin'
        });
        localStorage.setItem('users', JSON.stringify(users));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initUsers();
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';

    // 1. ROUTE PROTECTION
    if (!currentUser) {
        if (['admin.html', 'track.html', 'index.html'].includes(currentPath)) {
            window.location.href = 'login.html';
            return;
        }
    } else {
        if (currentPath === 'login.html') {
            if (currentUser.role === 'admin') window.location.href = 'admin.html';
            else window.location.href = 'index.html';
            return;
        }
        if (currentPath === 'admin.html' && currentUser.role !== 'admin') {
            window.location.href = 'index.html';
            return;
        }
    }

    // 2. NAV & UI VISIBILITY STATE
    const adminNav = document.querySelector('.nav-link.admin-only');

    if (currentUser && currentUser.role === 'admin') {
        if (adminNav) adminNav.style.display = 'inline-block';
    }

    if (currentPath === 'index.html' || currentPath === '') {
        if (currentUser && currentUser.role === 'admin') window.location.href = 'admin.html';
        else if (typeof showView === 'function') showView('dashboardView');
    }

    // 3. SECURE AUTH ACTION BINDINGS 
    const smartAuthForm = document.getElementById('smartAuthForm');
    
    if (smartAuthForm) {
        const emailInput = document.getElementById('authEmail');
        const emailValMsg = document.getElementById('emailValidationMsg');
        const passwordGroup = document.getElementById('passwordGroup');
        const passwordInput = document.getElementById('authPassword');
        const nameGroup = document.getElementById('nameGroup');
        const nameInput = document.getElementById('authName');
        const btnContinue = document.getElementById('btnContinue');
        const btnSubmit = document.getElementById('btnSubmitAuth');
        const btnBack = document.getElementById('btnBackToEmail');
        const authTitle = document.getElementById('authTitle');
        const authSubtitle = document.getElementById('authSubtitle');
        
        let currentMode = 'email'; // 'email', 'login', 'signup'
        let matchedUser = null;

        const validateEmail = (email) => {
            return String(email)
                .toLowerCase()
                .match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
        };

        // Real-time email validation
        emailInput.addEventListener('input', () => {
            if(emailInput.value.length > 0 && !validateEmail(emailInput.value)) {
                emailValMsg.style.display = 'block';
            } else {
                emailValMsg.style.display = 'none';
            }
        });

        // Step 1: Continue Button logic
        btnContinue.addEventListener('click', () => {
            const email = emailInput.value.trim();
            if(!email) return;
            
            if(!validateEmail(email)) {
                emailValMsg.style.display = 'block';
                return;
            }

            // Check if user exists
            const users = JSON.parse(localStorage.getItem('users')) || [];
            matchedUser = users.find(u => u.email === email);

            emailInput.disabled = true; // Lock email field
            btnContinue.classList.add('hidden');
            btnSubmit.classList.remove('hidden');
            btnBack.classList.remove('hidden');
            passwordGroup.classList.remove('hidden');
            passwordInput.required = true;

            if (matchedUser) {
                // Login flow
                currentMode = 'login';
                authTitle.textContent = 'Welcome Back';
                authSubtitle.textContent = 'Enter your password to log in';
                btnSubmit.textContent = 'Log In Securely';
            } else {
                // Signup flow
                currentMode = 'signup';
                authTitle.textContent = 'Create Account';
                authSubtitle.textContent = 'No account found. Please sign up.';
                nameGroup.classList.remove('hidden');
                nameInput.required = true;
                btnSubmit.textContent = 'Sign Up Securely';
            }
            passwordInput.focus();
        });

        // Step 2: Back Button logic
        btnBack.addEventListener('click', () => {
            currentMode = 'email';
            emailInput.disabled = false;
            passwordGroup.classList.add('hidden');
            nameGroup.classList.add('hidden');
            btnSubmit.classList.add('hidden');
            btnBack.classList.add('hidden');
            btnContinue.classList.remove('hidden');
            
            passwordInput.required = false;
            nameInput.required = false;
            passwordInput.value = '';
            nameInput.value = '';
            
            authTitle.textContent = 'Welcome';
            authSubtitle.textContent = 'Enter your email to continue';
            
            // Remove error message if exists
            const existingError = smartAuthForm.querySelector('.auth-error');
            if (existingError) existingError.remove();
        });

        // Step 3: Final Submit logic
        smartAuthForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if(currentMode === 'email') return; // Prevent enter key bypass
            
            let errorMsg = smartAuthForm.querySelector('.auth-error');
            if (!errorMsg) {
                errorMsg = document.createElement('div');
                errorMsg.className = 'auth-error hidden';
                smartAuthForm.prepend(errorMsg);
            }

            const email = emailInput.value.trim();
            const pass = passwordInput.value;

            if (currentMode === 'login') {
                if (matchedUser && matchedUser.password === pass) {
                    errorMsg.classList.add('hidden');
                    localStorage.setItem('currentUser', JSON.stringify(matchedUser));
                    
                    // Trigger login alert email for non-admin users
                    if (matchedUser.role !== 'admin') {
                        fetch('http://localhost:5000/api/email/notify-auth', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: matchedUser.email, name: matchedUser.name, type: 'login' })
                        }).catch(e => console.error('Auth email failed:', e));
                    }

                    if(matchedUser.role === 'admin') {
                        window.location.href = "admin.html";
                    } else {
                        window.location.href = "index.html"; 
                    }
                } else {
                    errorMsg.textContent = 'Invalid password!';
                    errorMsg.classList.remove('hidden');
                }
            } else if (currentMode === 'signup') {
                const name = nameInput.value.trim();
                const users = JSON.parse(localStorage.getItem('users')) || [];
                
                // Double check uniqueness just in case
                if (users.find(u => u.email === email)) {
                    errorMsg.textContent = 'Email already registered! Please go back and log in.';
                    errorMsg.classList.remove('hidden');
                    return;
                }

                const newUser = { name, email, password: pass, role: 'citizen' };
                users.push(newUser);
                localStorage.setItem('users', JSON.stringify(users));

                errorMsg.classList.add('hidden');
                localStorage.setItem('currentUser', JSON.stringify(newUser));
                
                // Trigger signup welcome email
                fetch('http://localhost:5000/api/email/notify-auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email, name: name, type: 'signup' })
                }).catch(e => console.error('Auth email failed:', e));

                window.location.href = "index.html"; 
            }
        });
    }
});

// Structural helper mapping UI
window.showView = function(viewId) {
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.add('hidden');
    });
    const view = document.getElementById(viewId);
    if (view) view.classList.remove('hidden');
}

// Global exposure
window.logout = function() {
    localStorage.removeItem('currentUser');
    window.location.href = "login.html";
}
