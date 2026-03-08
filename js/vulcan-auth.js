// ========================================
// VULCAN - Sistema de Autenticação
// Proprietário: Sysral
// ========================================

const AUTH_KEY = 'vulcan_users';
const SESSION_KEY = 'vulcan_session';

// Admin padrão
const DEFAULT_ADMIN = {
    username: 'sysral12',
    password: 'vulcan@2026',
    email: 'exagrama12@gmail.com',
    name: 'Sysral',
    role: 'admin',
    created: '2026-03-08',
    securityQuestion: 'Qual o nome do seu primeiro projeto?',
    securityAnswer: 'linkshubpro'
};

// Config padrão com chave Gemini
const DEFAULT_CONFIG = {
    geminiKey: 'AIzaSyC104xikFYdaMVfI6hPTX2kMw_plGsOlGY',
    githubToken: '',
    githubUser: 'exagrama12-creator',
    codeforgeUrl: 'https://exagrama12-creator.github.io/codeforge/'
};

function getUsers() {
    try {
        const users = JSON.parse(localStorage.getItem(AUTH_KEY)) || [];
        // Garante que admin existe
        if (!users.find(u => u.username === DEFAULT_ADMIN.username)) {
            users.push(DEFAULT_ADMIN);
            localStorage.setItem(AUTH_KEY, JSON.stringify(users));
        }
        return users;
    } catch {
        localStorage.setItem(AUTH_KEY, JSON.stringify([DEFAULT_ADMIN]));
        return [DEFAULT_ADMIN];
    }
}

function getSession() {
    try {
        return JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch {
        return null;
    }
}

function isLoggedIn() {
    return getSession() !== null;
}

function getCurrentUser() {
    const session = getSession();
    if (!session) return null;
    const users = getUsers();
    return users.find(u => u.username === session.username);
}

// ===== LOGIN =====
function doLogin() {
    const username = document.getElementById('login-user').value.trim().toLowerCase();
    const password = document.getElementById('login-pass').value;

    if (!username || !password) {
        showAuthError('login-error', 'Preencha todos os campos!');
        return;
    }

    const users = getUsers();
    const user = users.find(u => u.username.toLowerCase() === username && u.password === password);

    if (!user) {
        showAuthError('login-error', 'Usuário ou senha incorretos!');
        return;
    }

    // Salvar sessão
    localStorage.setItem(SESSION_KEY, JSON.stringify({
        username: user.username,
        name: user.name,
        role: user.role,
        loginTime: Date.now()
    }));

    showAuthSuccess('login-error', `Bem-vindo, ${user.name}! 🔥`);
    setTimeout(() => {
        hideAuthScreen();
        initApp();
    }, 1000);
}

// ===== CADASTRO =====
function doRegister() {
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const username = document.getElementById('reg-user').value.trim().toLowerCase();
    const password = document.getElementById('reg-pass').value;
    const confirmPass = document.getElementById('reg-pass2').value;
    const secQuestion = document.getElementById('reg-question').value.trim();
    const secAnswer = document.getElementById('reg-answer').value.trim().toLowerCase();

    // Validações
    if (!name || !email || !username || !password || !confirmPass || !secQuestion || !secAnswer) {
        showAuthError('reg-error', 'Preencha todos os campos!');
        return;
    }

    if (username.length < 3) {
        showAuthError('reg-error', 'Usuário deve ter pelo menos 3 caracteres!');
        return;
    }

    if (password.length < 6) {
        showAuthError('reg-error', 'Senha deve ter pelo menos 6 caracteres!');
        return;
    }

    if (password !== confirmPass) {
        showAuthError('reg-error', 'As senhas não coincidem!');
        return;
    }

    if (!email.includes('@')) {
        showAuthError('reg-error', 'Email inválido!');
        return;
    }

    const users = getUsers();

    if (users.find(u => u.username.toLowerCase() === username)) {
        showAuthError('reg-error', 'Este usuário já existe!');
        return;
    }

    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        showAuthError('reg-error', 'Este email já está cadastrado!');
        return;
    }

    // Criar usuário
    const newUser = {
        username,
        password,
        email,
        name,
        role: 'user',
        created: new Date().toLocaleDateString('pt-BR'),
        securityQuestion: secQuestion,
        securityAnswer: secAnswer
    };

    users.push(newUser);
    localStorage.setItem(AUTH_KEY, JSON.stringify(users));

    showAuthSuccess('reg-error', '✅ Conta criada com sucesso! Faça login.');
    setTimeout(() => showAuthTab('login'), 1500);
}

// ===== RECUPERAÇÃO DE SENHA =====
let recoveryUser = null;

function doRecoveryStep1() {
    const identifier = document.getElementById('recover-user').value.trim().toLowerCase();

    if (!identifier) {
        showAuthError('recover-error', 'Digite seu usuário ou email!');
        return;
    }

    const users = getUsers();
    const user = users.find(u => 
        u.username.toLowerCase() === identifier || 
        u.email.toLowerCase() === identifier
    );

    if (!user) {
        showAuthError('recover-error', 'Usuário ou email não encontrado!');
        return;
    }

    recoveryUser = user;
    
    // Mostrar pergunta de segurança
    document.getElementById('recover-step1').style.display = 'none';
    document.getElementById('recover-step2').style.display = 'block';
    document.getElementById('recover-question-text').textContent = user.securityQuestion;
}

function doRecoveryStep2() {
    const answer = document.getElementById('recover-answer').value.trim().toLowerCase();

    if (!answer) {
        showAuthError('recover-error', 'Responda a pergunta de segurança!');
        return;
    }

    if (answer !== recoveryUser.securityAnswer) {
        showAuthError('recover-error', 'Resposta incorreta!');
        return;
    }

    // Mostrar formulário de nova senha
    document.getElementById('recover-step2').style.display = 'none';
    document.getElementById('recover-step3').style.display = 'block';
}

function doRecoveryStep3() {
    const newPass = document.getElementById('recover-newpass').value;
    const confirmPass = document.getElementById('recover-newpass2').value;

    if (!newPass || newPass.length < 6) {
        showAuthError('recover-error', 'Senha deve ter pelo menos 6 caracteres!');
        return;
    }

    if (newPass !== confirmPass) {
        showAuthError('recover-error', 'As senhas não coincidem!');
        return;
    }

    // Atualizar senha
    const users = getUsers();
    const user = users.find(u => u.username === recoveryUser.username);
    user.password = newPass;
    localStorage.setItem(AUTH_KEY, JSON.stringify(users));

    showAuthSuccess('recover-error', '✅ Senha alterada com sucesso! Faça login.');
    recoveryUser = null;
    setTimeout(() => showAuthTab('login'), 1500);
}

// ===== LOGOUT =====
function doLogout() {
    localStorage.removeItem(SESSION_KEY);
    location.reload();
}

// ===== UI HELPERS =====
function showAuthTab(tab) {
    document.querySelectorAll('.auth-form').forEach(f => f.style.display = 'none');
    document.querySelectorAll('.auth-tab-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`auth-${tab}`).style.display = 'block';
    const tabBtn = document.querySelector(`[onclick="showAuthTab('${tab}')"]`);
    if (tabBtn) tabBtn.classList.add('active');

    // Reset recovery steps
    if (tab === 'recover') {
        document.getElementById('recover-step1').style.display = 'block';
        document.getElementById('recover-step2').style.display = 'none';
        document.getElementById('recover-step3').style.display = 'none';
        recoveryUser = null;
    }

    // Limpar erros
    document.querySelectorAll('.auth-error').forEach(e => e.style.display = 'none');
}

function showAuthError(elementId, msg) {
    const el = document.getElementById(elementId);
    el.textContent = '❌ ' + msg;
    el.style.display = 'block';
    el.style.color = '#f44336';
    el.style.background = 'rgba(244,67,54,0.1)';
}

function showAuthSuccess(elementId, msg) {
    const el = document.getElementById(elementId);
    el.textContent = msg;
    el.style.display = 'block';
    el.style.color = '#4caf50';
    el.style.background = 'rgba(76,175,80,0.1)';
}

function hideAuthScreen() {
    document.getElementById('auth-overlay').style.display = 'none';
    document.getElementById('app-container').style.display = '';
}

function showAuthScreen() {
    document.getElementById('auth-overlay').style.display = 'flex';
    document.getElementById('app-container').style.display = 'none';
}

function initApp() {
    const user = getCurrentUser();
    if (user) {
        // Mostrar nome do usuário no header
        const userDisplay = document.getElementById('user-display');
        if (userDisplay) {
            userDisplay.innerHTML = `<span style="color:var(--ember-1)">👤 ${user.name}</span>`;
        }
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) logoutBtn.style.display = '';
    }
}

// ===== AUTH CHECK ON LOAD =====
function checkAuth() {
    if (isLoggedIn()) {
        hideAuthScreen();
        initApp();
    } else {
        showAuthScreen();
    }
}

function handleAuthKey(event, action) {
    if (event.key === 'Enter') {
        event.preventDefault();
        if (action === 'login') doLogin();
        else if (action === 'register') doRegister();
    }
}
