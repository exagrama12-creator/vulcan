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

// Config padrão SEM chave Gemini (chave fica apenas no navegador do usuário)
const DEFAULT_CONFIG = {
    geminiKey: '',
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
    // Verificar se tem chave Gemini configurada
    setTimeout(() => {
        checkGeminiKey();
    }, 1500);
}

function checkGeminiKey() {
    try {
        const saved = JSON.parse(localStorage.getItem('vulcan_config'));
        if (saved && saved.geminiKey && saved.geminiKey.length > 10) return; // Já tem chave
    } catch {}
    // Mostrar popup pedindo a chave
    showGeminiSetup();
}

function showGeminiSetup() {
    const overlay = document.createElement('div');
    overlay.id = 'gemini-setup-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;';
    overlay.innerHTML = `
        <div style="background:#1a1a2e;border:2px solid #ff4500;border-radius:16px;padding:30px;max-width:500px;width:100%;color:#fff;font-family:inherit;">
            <h2 style="margin:0 0 10px;color:#ff6b35;">🔑 Configurar Google Gemini</h2>
            <p style="color:#aaa;font-size:14px;margin-bottom:20px;">Para as IAs do VULCAN funcionarem, você precisa de uma chave do Google Gemini <strong>(grátis!)</strong></p>
            
            <div style="background:#111;border-radius:10px;padding:15px;margin-bottom:20px;">
                <p style="color:#ff9500;font-size:13px;margin:0 0 8px;"><strong>📋 Como obter:</strong></p>
                <ol style="color:#ccc;font-size:13px;margin:0;padding-left:20px;line-height:1.8;">
                    <li>Acesse <a href="https://aistudio.google.com/apikey" target="_blank" style="color:#4fc3f7;">aistudio.google.com/apikey</a></li>
                    <li>Login com sua conta Google</li>
                    <li>Clique em <strong>"Criar chave de API"</strong></li>
                    <li>Copie a chave (começa com AIzaSy...)</li>
                    <li>Cole aqui embaixo 👇</li>
                </ol>
            </div>
            
            <input type="text" id="gemini-setup-key" placeholder="AIzaSy..." 
                style="width:100%;padding:12px;border-radius:8px;border:2px solid #333;background:#0a0a1a;color:#fff;font-size:15px;font-family:monospace;box-sizing:border-box;margin-bottom:15px;">
            
            <div style="display:flex;gap:10px;">
                <button onclick="saveGeminiSetup()" 
                    style="flex:1;padding:12px;border:none;border-radius:8px;background:linear-gradient(135deg,#ff4500,#ff6b35);color:#fff;font-size:15px;font-weight:bold;cursor:pointer;">
                    🔥 Ativar IA
                </button>
                <button onclick="document.getElementById('gemini-setup-overlay').remove()" 
                    style="padding:12px 20px;border:1px solid #333;border-radius:8px;background:transparent;color:#888;font-size:14px;cursor:pointer;">
                    Depois
                </button>
            </div>
            
            <p style="color:#555;font-size:11px;margin:12px 0 0;text-align:center;">🔒 A chave fica APENAS no seu navegador. Ninguém mais tem acesso.</p>
        </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('gemini-setup-key').focus();
}

function saveGeminiSetup() {
    const key = document.getElementById('gemini-setup-key').value.trim();
    if (!key || !key.startsWith('AIza')) {
        document.getElementById('gemini-setup-key').style.borderColor = '#ff0000';
        document.getElementById('gemini-setup-key').placeholder = '⚠️ Cole uma chave válida (AIzaSy...)';
        return;
    }
    // Salvar no localStorage
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem('vulcan_config')) || {}; } catch {}
    saved.geminiKey = key;
    localStorage.setItem('vulcan_config', JSON.stringify(saved));
    // Atualizar config em memória
    if (typeof config !== 'undefined') config.geminiKey = key;
    // Atualizar campo do modal de config
    const geminiInput = document.getElementById('gemini-key');
    if (geminiInput) geminiInput.value = key;
    // Remover overlay
    document.getElementById('gemini-setup-overlay').remove();
    // Feedback
    if (typeof showToast === 'function') showToast('✅ Chave Gemini salva! IAs ativadas! 🔥');
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
