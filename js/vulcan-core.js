// ========================================
// VULCAN - Core JavaScript
// Proprietário: Sysral
// ========================================

const CONFIG_KEY = 'vulcan_config';
const PROJECTS_KEY = 'vulcan_projects';
const CHAT_KEY = 'vulcan_chat';

let config = loadConfig();
let projects = loadProjects();
let currentAgent = 'hefesto';
let currentBuildTarget = 'pwa';
let chatHistory = [];
let editorFiles = {
    html: '',
    css: '',
    js: '',
    manifest: JSON.stringify({
        "name": "Meu App",
        "short_name": "App",
        "start_url": ".",
        "display": "standalone",
        "background_color": "#000000",
        "theme_color": "#ff6b35",
        "icons": []
    }, null, 2)
};
let currentEditorTab = 'html';

// ===== AGENTES IA =====
const AGENTS = {
    hefesto: {
        name: 'HEFESTO', emoji: '🔨', role: 'Comandante da Forja', color: '#ff6b35',
        personality: 'Sou HEFESTO, o comandante da VULCAN. Coordeno todos os agentes e oriento você em cada etapa. Sou direto, eficiente e sei delegar tarefas para o agente certo.',
        expertise: ['coordenação', 'planejamento', 'delegação', 'visão geral'],
        greeting: 'Sou HEFESTO, comandante da Forja VULCAN! 🔨🔥 Diga o que precisa e eu coordeno os agentes certos para construir seu app.'
    },
    magma: {
        name: 'MAGMA', emoji: '🌋', role: 'Compilador Android', color: '#ff4500',
        personality: 'Sou MAGMA, especialista em Android. Transformo código web em APK usando PWA, Capacitor e Bubblewrap. Conheço tudo sobre o ecossistema Android.',
        expertise: ['android', 'apk', 'pwa', 'capacitor', 'bubblewrap', 'mobile'],
        greeting: 'MAGMA na área! 🌋 Especialista em Android. Me diga o que quer criar e eu transformo em APK.'
    },
    titanium: {
        name: 'TITANIUM', emoji: '🛡️', role: 'Compilador Windows', color: '#6495ed',
        personality: 'Sou TITANIUM, especialista em aplicações Windows. Trabalho com Electron, Tauri e empacotamento .exe. Transformo web apps em programas desktop profissionais.',
        expertise: ['windows', 'exe', 'electron', 'tauri', 'desktop', 'instalador'],
        greeting: 'TITANIUM ativado! 🛡️ Especialista em Windows. Transformo seu código em .exe profissional.'
    },
    ember: {
        name: 'EMBER', emoji: '🔥', role: 'Compilador Web/PWA', color: '#ff8c42',
        personality: 'Sou EMBER, especialista em web e PWA. Crio Service Workers, manifests, e garanto que seu app funcione offline. Deploy no GitHub Pages é comigo.',
        expertise: ['pwa', 'web', 'service worker', 'manifest', 'deploy', 'github pages', 'offline'],
        greeting: 'EMBER aqui! 🔥 Especialista em PWA e Web. Vou fazer seu app funcionar offline e ser instalável!'
    },
    anvil: {
        name: 'ANVIL', emoji: '⚒️', role: 'Analisador de Código', color: '#a9a9a9',
        personality: 'Sou ANVIL, analiso código-fonte em busca de bugs, problemas de performance e incompatibilidades. Garanto que o código está pronto antes de compilar.',
        expertise: ['análise', 'bugs', 'performance', 'segurança', 'qualidade', 'review'],
        greeting: 'ANVIL pronto! ⚒️ Me dê o código e eu analiso cada linha. Bugs não passam por mim.'
    },
    spark: {
        name: 'SPARK', emoji: '⚡', role: 'Otimizador', color: '#ffd700',
        personality: 'Sou SPARK, otimizo código para máxima performance. Minifico, comprimo, e aplico best practices. Seu app vai voar!',
        expertise: ['otimização', 'minificação', 'compressão', 'performance', 'cache', 'lazy loading'],
        greeting: 'SPARK ativado! ⚡ Vou turbinar seu código para performance máxima!'
    },
    'forge-link': {
        name: 'FORGE LINK', emoji: '🔗', role: 'Bridge CodeForge', color: '#9467bd',
        personality: 'Sou FORGE LINK, a ponte entre o CodeForge e o VULCAN. Importo projetos, sincronizo código e garanto que a transição do desenvolvimento para a compilação seja perfeita.',
        expertise: ['codeforge', 'importação', 'sincronização', 'integração', 'bridge'],
        greeting: 'FORGE LINK conectado! 🔗 Sou a ponte com o CodeForge. Posso importar seus projetos automaticamente.'
    },
    minerva: {
        name: 'MINERVA', emoji: '📚', role: 'Mentora & Tutora', color: '#4caf50',
        personality: 'Sou MINERVA, sua mentora pessoal. Explico tudo passo a passo, com paciência infinita. Não existe pergunta boba — estou aqui para ensinar de verdade, do zero até o avançado.',
        expertise: ['ensino', 'tutorial', 'passo a passo', 'explicação', 'dúvidas', 'aprendizado'],
        greeting: 'Olá! Sou MINERVA, sua mentora! 📚 Me pergunte QUALQUER coisa — vou te explicar passo a passo, sem pressa. 😊'
    },
    vulcanus: {
        name: 'VULCANUS', emoji: '🔮', role: 'IA Central', color: '#f44336',
        personality: 'Sou VULCANUS, a inteligência central do VULCAN. Processo linguagem natural, entendo o que você quer criar, e transformo seus pedidos em ações concretas. Uso Google Gemini como motor de IA.',
        expertise: ['ia', 'processamento', 'linguagem natural', 'gemini', 'automação', 'inteligência'],
        greeting: 'VULCANUS online! 🔮 Sou a IA central. Descreva o que quer em português e eu transformo em realidade.'
    }
};

// ===== TUTORIAIS =====
const TUTORIALS = {
    intro: {
        title: '🏠 O que é o VULCAN?',
        steps: [
            { title: 'Bem-vindo!', content: 'O VULCAN é a sua **Forja de Apps** — uma plataforma que transforma código-fonte em aplicativos prontos para uso.\n\nEle trabalha junto com o **CodeForge** (onde você cria o código) e cuida da parte de **compilar, empacotar e entregar** o app final.' },
            { title: 'Os Agentes', content: 'O VULCAN tem **9 agentes IA** especializados:\n\n🔨 **HEFESTO** — Comandante, coordena tudo\n🌋 **MAGMA** — Compila para Android\n🛡️ **TITANIUM** — Compila para Windows\n🔥 **EMBER** — Cria PWAs e deploys web\n⚒️ **ANVIL** — Analisa código e encontra bugs\n⚡ **SPARK** — Otimiza performance\n🔗 **FORGE LINK** — Ponte com o CodeForge\n📚 **MINERVA** — Sua mentora (eu! 😊)\n🔮 **VULCANUS** — IA Central' },
            { title: 'Como funciona?', content: '1️⃣ Você **cria** o código no CodeForge (ou cola aqui)\n2️⃣ O VULCAN **analisa** seu código (ANVIL)\n3️⃣ **Otimiza** o código (SPARK)\n4️⃣ **Compila** para a plataforma escolhida (MAGMA/TITANIUM/EMBER)\n5️⃣ Você **baixa** o app pronto!\n\nSimples assim! 🔥' },
            { title: 'Próximos passos', content: 'Agora que você entende o básico:\n\n✅ Configure sua **chave Gemini** em ⚙️ Configurações\n✅ Tente **importar um projeto** do CodeForge\n✅ Ou crie um **novo projeto** diretamente aqui\n\nQualquer dúvida, é só chamar a MINERVA! 📚' }
        ]
    },
    codeforge: {
        title: '🔗 Importando do CodeForge',
        steps: [
            { title: 'Conectando', content: 'Para importar do CodeForge:\n\n1️⃣ Abra o **CodeForge** em outra aba\n2️⃣ Crie ou abra seu projeto\n3️⃣ Copie o código gerado\n4️⃣ No VULCAN, clique em **"Importar do CodeForge"**\n5️⃣ Cole o código ou use a URL do projeto' },
            { title: 'Dica', content: 'O ideal é:\n\n📝 **CodeForge** = onde você CRIA\n🔨 **VULCAN** = onde você COMPILA\n\nAssim cada ferramenta faz o que sabe melhor! 💪' }
        ]
    },
    pwa: {
        title: '🌐 Criando uma PWA',
        steps: [
            { title: 'O que é PWA?', content: 'PWA = **Progressive Web App**\n\nÉ um site que se comporta como um app nativo:\n✅ Instala na tela inicial\n✅ Funciona offline\n✅ Tela cheia\n\nFunciona em **Android, iOS e Windows**!' },
            { title: 'O que precisa', content: 'Para criar uma PWA você precisa de:\n\n1️⃣ **manifest.json** — informações do app\n2️⃣ **Service Worker** — funciona offline\n3️⃣ **HTTPS** — GitHub Pages resolve!\n\nO EMBER 🔥 cria tudo automaticamente!' },
            { title: 'Passo a passo', content: '1. Cole seu código na aba **Build**\n2. Selecione **PWA** como plataforma\n3. Clique em **FORJAR APP**\n4. Faça deploy no GitHub Pages\n5. Acesse pelo celular e clique **"Adicionar à tela inicial"**\n\nPronto! 📱' }
        ]
    },
    android: {
        title: '📱 Gerando APK para Android',
        steps: [
            { title: 'APK via PWABuilder', content: 'A forma mais fácil:\n\n1️⃣ Deploy seu app como PWA\n2️⃣ Acesse **pwabuilder.com**\n3️⃣ Cole a URL do seu app\n4️⃣ Clique em **"Package for stores"**\n5️⃣ Escolha **Android**\n6️⃣ Baixe o APK!' },
            { title: 'Instalando', content: 'Para instalar:\n\n1. Transfira o APK pro celular\n2. Abra o arquivo\n3. Ative "Fontes desconhecidas" se pedir\n4. Instale! 🎉' }
        ]
    },
    windows: {
        title: '🖥️ Criando .EXE para Windows',
        steps: [
            { title: 'Via PWABuilder', content: '1️⃣ Deploy seu app como PWA\n2️⃣ Acesse **pwabuilder.com**\n3️⃣ Cole a URL\n4️⃣ Escolha **Windows**\n5️⃣ Baixe o pacote\n6️⃣ Instale!' }
        ]
    },
    deploy: {
        title: '🚀 Deploy no GitHub Pages',
        steps: [
            { title: 'Passo a passo', content: '1️⃣ Crie um repositório no GitHub\n2️⃣ Faça upload dos arquivos\n3️⃣ Settings → Pages\n4️⃣ Source: main branch\n5️⃣ Aguarde 1-2 min\n\nSeu site está no ar! 🌐' }
        ]
    },
    optimize: {
        title: '⚡ Otimização',
        steps: [
            { title: 'O que o SPARK faz', content: '1. **Minificação** — remove espaços\n2. **Compressão** — reduz tamanho\n3. **Lazy Loading** — carrega sob demanda\n4. **Cache** — Service Worker inteligente\n\nResultado: **60-80% menor**, **2-3x mais rápido**! ⚡' }
        ]
    },
    api: {
        title: '🔑 Configurando APIs',
        steps: [
            { title: 'Google Gemini', content: '1️⃣ Acesse **aistudio.google.com**\n2️⃣ Login com Google\n3️⃣ "Get API Key"\n4️⃣ "Create API key in new project"\n5️⃣ Copie (começa com AIzaSy)\n6️⃣ Cole em ⚙️ do VULCAN' },
            { title: 'Segurança', content: '⚠️ Chaves ficam APENAS no seu navegador.\nO VULCAN NÃO envia suas chaves para ninguém.' }
        ]
    }
};

// ===== INIT =====
function init() {
    checkAuth();
    initParticles();
    // Garantir que a config está salva no localStorage
    if (!localStorage.getItem(CONFIG_KEY) && typeof DEFAULT_CONFIG !== 'undefined') {
        localStorage.setItem(CONFIG_KEY, JSON.stringify(DEFAULT_CONFIG));
        config = DEFAULT_CONFIG;
    }
    loadSavedConfig();
    renderProjects();
}

// ===== PARTICLES =====
function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles = [];
    for (let i = 0; i < 50; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 0.5,
            speedY: -(Math.random() * 0.5 + 0.1),
            speedX: (Math.random() - 0.5) * 0.3,
            opacity: Math.random() * 0.5 + 0.1,
            color: Math.random() > 0.5 ? '#ff6b35' : '#ff4500'
        });
    }
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.opacity;
            ctx.fill();
            p.y += p.speedY;
            p.x += p.speedX;
            if (p.y < 0) { p.y = canvas.height; p.x = Math.random() * canvas.width; }
        });
        ctx.globalAlpha = 1;
        requestAnimationFrame(animate);
    }
    animate();
    window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });
}

// ===== CONFIG =====
function loadConfig() {
    try { 
        const saved = JSON.parse(localStorage.getItem(CONFIG_KEY));
        if (saved && saved.geminiKey) return saved;
        // Usar config padrão se não tem nada salvo
        if (typeof DEFAULT_CONFIG !== 'undefined') {
            localStorage.setItem(CONFIG_KEY, JSON.stringify(DEFAULT_CONFIG));
            return DEFAULT_CONFIG;
        }
        return saved || {};
    } catch { 
        if (typeof DEFAULT_CONFIG !== 'undefined') return DEFAULT_CONFIG;
        return {}; 
    }
}
function loadProjects() {
    try { return JSON.parse(localStorage.getItem(PROJECTS_KEY)) || []; } catch { return []; }
}
function saveConfig() {
    const geminiEl = document.getElementById('gemini-key');
    const githubTokenEl = document.getElementById('github-token');
    const githubUserEl = document.getElementById('github-user');
    const codeforgeUrlEl = document.getElementById('codeforge-url');
    config = {
        geminiKey: (geminiEl ? geminiEl.value.trim() : '') || config.geminiKey || '',
        githubToken: (githubTokenEl ? githubTokenEl.value.trim() : '') || config.githubToken || '',
        githubUser: (githubUserEl ? githubUserEl.value.trim() : '') || config.githubUser || '',
        codeforgeUrl: (codeforgeUrlEl ? codeforgeUrlEl.value.trim() : '') || config.codeforgeUrl || ''
    };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    closeConfigModal();
    showToast('✅ Configurações salvas!');
}
function loadSavedConfig() {
    if (config.geminiKey) document.getElementById('gemini-key').value = config.geminiKey;
    if (config.githubToken) document.getElementById('github-token').value = config.githubToken;
    if (config.githubUser) document.getElementById('github-user').value = config.githubUser;
    if (config.codeforgeUrl) document.getElementById('codeforge-url').value = config.codeforgeUrl;
}

// ===== NAVIGATION =====
function switchPanel(panel) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`panel-${panel}`).classList.add('active');
    const navBtn = document.getElementById(`nav-${panel}`);
    if (navBtn) navBtn.classList.add('active');
}
function toggleMobileSidebar() {
    document.getElementById('sidebar').classList.toggle('mobile-open');
}
function showConfigModal() {
    // Recriar conteúdo original do modal (pode ter sido alterado pelo import)
    const modal = document.getElementById('config-modal');
    const modalContent = modal.querySelector('.modal');
    modalContent.innerHTML = `
        <button class="modal-close" onclick="closeConfigModal()">✕</button>
        <h2>⚙️ Configurações</h2>
        <div class="config-section">
            <label>🔑 Google Gemini API Key</label>
            <input type="password" class="config-input" id="gemini-key" placeholder="AIzaSy..." value="${(config.geminiKey || '').replace(/"/g, '&quot;')}">
            <p style="font-size:11px; color:var(--metal-3); margin-top:6px;">Obtenha em: <a href="https://aistudio.google.com/apikey" target="_blank" style="color:var(--fire-1)">aistudio.google.com</a></p>
        </div>
        <div class="config-section">
            <label>🔗 GitHub Token (para deploy)</label>
            <input type="password" class="config-input" id="github-token" placeholder="ghp_..." value="${(config.githubToken || '').replace(/"/g, '&quot;')}">
        </div>
        <div class="config-section">
            <label>👤 GitHub Username</label>
            <input type="text" class="config-input" id="github-user" placeholder="seu-usuario" value="${(config.githubUser || '').replace(/"/g, '&quot;')}">
        </div>
        <div class="config-section">
            <label>🔗 URL do CodeForge</label>
            <input type="text" class="config-input" id="codeforge-url" placeholder="https://..." value="${(config.codeforgeUrl || '').replace(/"/g, '&quot;')}">
        </div>
        <button class="config-save-btn" onclick="saveConfig()">💾 Salvar</button>
    `;
    modal.classList.add('show');
}
function closeConfigModal() {
    document.getElementById('config-modal').classList.remove('show');
}

// ===== AGENTS =====
function selectAgent(agentId) {
    currentAgent = agentId;
    document.querySelectorAll('.agent-card').forEach(c => c.classList.remove('active'));
    const el = document.getElementById(`agent-${agentId}`);
    if (el) el.classList.add('active');
    const agent = AGENTS[agentId];
    switchPanel('forge');
    const welcome = document.getElementById('welcome-screen');
    if (welcome) welcome.remove();
    addMessage(agent.emoji, agent.name, agent.greeting, 'agent');
    document.getElementById('sidebar').classList.remove('mobile-open');
}

// ===== CHAT =====
function handleChatKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
}
function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;
    const welcome = document.getElementById('welcome-screen');
    if (welcome) welcome.remove();
    addMessage('👤', 'Você', text, 'user');
    input.value = '';
    chatHistory.push({ role: 'user', text });
    showTyping();
    processWithAI(text);
}
function addMessage(emoji, name, text, type) {
    const container = document.getElementById('chat-container');
    const msg = document.createElement('div');
    msg.className = `message ${type}`;
    let formatted = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
    msg.innerHTML = `
        <div class="avatar">${emoji}</div>
        <div>
            <div class="sender-name">${name}</div>
            <div class="bubble">${formatted}</div>
        </div>`;
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
}
function showTyping() {
    const agent = AGENTS[currentAgent];
    document.getElementById('typing-agent').textContent = `${agent.name} está pensando...`;
    document.getElementById('typing-indicator').classList.add('show');
}
function hideTyping() {
    document.getElementById('typing-indicator').classList.remove('show');
}

// ===== GEMINI AI =====
async function processWithAI(userMessage) {
    const agent = AGENTS[currentAgent];
    if (!config.geminiKey) {
        hideTyping();
        addMessage(agent.emoji, agent.name, '⚠️ **Chave Gemini não configurada!**\n\nConfigure sua chave em ⚙️ Configurações.\nÉ grátis: **aistudio.google.com**\n\nEnquanto isso, respondo com respostas básicas.', 'agent');
        handleLocalResponse(userMessage);
        return;
    }
    try {
        const systemPrompt = `Você é ${agent.name}, um agente IA especializado da plataforma VULCAN (A Forja de Apps).
Personalidade: ${agent.personality}
Especialidades: ${agent.expertise.join(', ')}
Contexto: VULCAN transforma código em apps prontos para Android (APK), Windows (EXE) e Web (PWA). Integrado com CodeForge.
Regras: Responda em português brasileiro. Seja direto e prático. Use emojis. Explique passo a passo. Formate com **negrito** e listas.`;

        const contents = [];
        chatHistory.slice(-10).forEach(msg => {
            contents.push({ role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.text }] });
        });
        contents.push({ role: 'user', parts: [{ text: userMessage }] });

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${config.geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: systemPrompt }] },
                contents,
                generationConfig: { temperature: 0.8, maxOutputTokens: 2048 }
            })
        });
        const data = await response.json();
        hideTyping();
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
            const reply = data.candidates[0].content.parts[0].text;
            addMessage(agent.emoji, agent.name, reply, 'agent');
            chatHistory.push({ role: 'agent', agent: currentAgent, text: reply });
        } else if (data.error) {
            addMessage(agent.emoji, agent.name, `⚠️ Erro: ${data.error.message}`, 'agent');
        } else {
            addMessage(agent.emoji, agent.name, 'Não consegui processar. Tente novamente! 🔄', 'agent');
        }
    } catch (err) {
        hideTyping();
        addMessage(agent.emoji, agent.name, `❌ Erro: ${err.message}`, 'agent');
    }
}

function handleLocalResponse(userMessage) {
    const agent = AGENTS[currentAgent];
    const msg = userMessage.toLowerCase();
    let reply = '';
    setTimeout(() => {
        if (msg.includes('olá') || msg.includes('oi') || msg.includes('ola')) {
            reply = `Olá! 👋 Sou ${agent.name}, ${agent.role}. Como posso ajudar?`;
        } else if (msg.includes('ajuda') || msg.includes('help')) {
            reply = `Posso ajudar com:\n\n${agent.expertise.map(e => `• **${e}**`).join('\n')}`;
        } else if (msg.includes('android') || msg.includes('apk')) {
            reply = 'Para gerar APK:\n\n1️⃣ Cole código na aba **Build**\n2️⃣ Selecione **Android APK**\n3️⃣ Clique em **FORJAR APP** 📱';
        } else if (msg.includes('windows') || msg.includes('exe')) {
            reply = 'Para gerar .EXE:\n\n1️⃣ Cole código na aba **Build**\n2️⃣ Selecione **Windows Desktop**\n3️⃣ Clique em **FORJAR APP** 🖥️';
        } else if (msg.includes('pwa') || msg.includes('web')) {
            reply = 'PWA é a forma mais fácil!\n✅ Android, iOS e Windows\n✅ Instala do navegador\n✅ Funciona offline\n\nAba **Build** → **PWA** 🌐';
        } else {
            reply = `Configure a chave **Gemini** em ⚙️ para respostas inteligentes! É grátis: **aistudio.google.com** 🔑`;
        }
        hideTyping();
        addMessage(agent.emoji, agent.name, reply, 'agent');
    }, 1000);
}

// ===== BUILD =====
function selectBuildTarget(target) {
    currentBuildTarget = target;
    document.querySelectorAll('.build-option').forEach(o => o.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
}
function switchEditorTab(tab) {
    editorFiles[currentEditorTab] = document.getElementById('code-editor').value;
    currentEditorTab = tab;
    document.querySelectorAll('.editor-tab').forEach(t => t.classList.remove('active'));
    event.currentTarget.classList.add('active');
    document.getElementById('code-editor').value = editorFiles[tab] || '';
}

function analyzeCode() {
    const code = document.getElementById('code-editor').value;
    if (!code.trim()) { showToast('⚠️ Cole algum código primeiro!'); return; }
    switchPanel('forge');
    selectAgent('anvil');
    setTimeout(() => {
        let analysis = '**⚒️ Análise completa!**\n\n';
        const lines = code.split('\n').length;
        const size = new Blob([code]).size;
        analysis += `📊 ${lines} linhas | ${(size/1024).toFixed(1)} KB\n\n`;
        if (code.includes('<html') || code.includes('<!DOCTYPE')) analysis += '✅ HTML detectado\n';
        if (code.includes('<style') || code.includes('.css')) analysis += '✅ CSS detectado\n';
        if (code.includes('<script') || code.includes('function')) analysis += '✅ JavaScript detectado\n';
        if (code.includes('manifest') || code.includes('serviceWorker')) analysis += '✅ PWA compatível!\n';
        analysis += '\n**Pronto para compilar!** Vá na aba Build e clique FORJAR APP 🔨';
        addMessage('⚒️', 'ANVIL', analysis, 'agent');
    }, 1500);
}

function getBuildIcon() {
    return { pwa: '🔥', android: '🌋', windows: '🛡️', zip: '📂' }[currentBuildTarget] || '📦';
}
function getBuildAgent() {
    return { pwa: 'EMBER', android: 'MAGMA', windows: 'TITANIUM', zip: 'HEFESTO' }[currentBuildTarget] || 'HEFESTO';
}
function getBuildOutput() {
    return { pwa: 'PWA', android: 'APK Android', windows: 'EXE Windows', zip: 'arquivo ZIP' }[currentBuildTarget] || 'pacote';
}

function startBuild() {
    editorFiles[currentEditorTab] = document.getElementById('code-editor').value;
    const hasCode = Object.values(editorFiles).some(f => f.trim());
    if (!hasCode) { showToast('⚠️ Adicione código antes!'); return; }

    const buildPanel = document.querySelector('.build-panel');
    const progressPanel = document.getElementById('build-progress');
    buildPanel.style.display = 'none';
    progressPanel.classList.add('active');

    const steps = [
        { icon: '📋', title: 'Preparando arquivos', desc: 'Organizando código-fonte...' },
        { icon: '⚒️', title: 'ANVIL analisando', desc: 'Verificando erros...' },
        { icon: '⚡', title: 'SPARK otimizando', desc: 'Minificando...' },
        { icon: getBuildIcon(), title: `${getBuildAgent()} compilando`, desc: `Gerando ${getBuildOutput()}...` },
        { icon: '📦', title: 'Empacotando', desc: 'Criando pacote final...' },
        { icon: '✅', title: 'Concluído!', desc: 'Seu app está pronto!' }
    ];

    const stepsContainer = document.getElementById('progress-steps');
    stepsContainer.innerHTML = steps.map((s, i) => `
        <div class="progress-step" id="build-step-${i}">
            <div class="step-icon">${s.icon}</div>
            <div class="step-info"><h4>${s.title}</h4><p>${s.desc}</p></div>
        </div>`).join('');

    let currentStep = 0;
    const interval = setInterval(() => {
        if (currentStep > 0) {
            document.getElementById(`build-step-${currentStep-1}`).classList.remove('active');
            document.getElementById(`build-step-${currentStep-1}`).classList.add('done');
        }
        if (currentStep < steps.length) {
            document.getElementById(`build-step-${currentStep}`).classList.add('active');
            document.getElementById('progress-bar').style.width = `${((currentStep+1)/steps.length)*100}%`;
            currentStep++;
        } else {
            clearInterval(interval);
            setTimeout(() => completeBuild(), 500);
        }
    }, 1500);
}

// completeBuild is in vulcan-features.js