// ========================================
// VULCAN - AutoPilot + IA Comandante
// Sistema automático de build sob comando
// ========================================

// ===== CODEFORGE BRIDGE =====
// Puxa projetos do CodeForge via postMessage ou localStorage bridge

const VULCAN_SHARED_KEY = 'vulcan_codeforge_bridge';

// Escutar mensagens do CodeForge (quando aberto em outra aba)
window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'codeforge-export') {
        receiveFromCodeForge(event.data);
    }
});

// Verificar se tem projeto pendente no bridge (localStorage)
function checkCodeForgeBridge() {
    try {
        const bridgeData = JSON.parse(localStorage.getItem(VULCAN_SHARED_KEY));
        if (bridgeData && bridgeData.code && bridgeData.timestamp) {
            // Só aceitar se foi enviado nos últimos 5 minutos
            if (Date.now() - bridgeData.timestamp < 5 * 60 * 1000) {
                localStorage.removeItem(VULCAN_SHARED_KEY); // Limpar bridge
                receiveFromCodeForge(bridgeData);
                return true;
            } else {
                localStorage.removeItem(VULCAN_SHARED_KEY); // Expirado
            }
        }
    } catch(e) {}
    return false;
}

// Verificar bridge após login
setTimeout(function() {
    if (typeof isLoggedIn === 'function' && isLoggedIn()) {
        checkCodeForgeBridge();
    }
}, 2000);

function receiveFromCodeForge(data) {
    if (!data.code) return;
    
    editorFiles.html = data.code || '';
    editorFiles.css = data.css || '';
    editorFiles.js = data.js || '';
    
    const projectName = data.projectName || 'Projeto CodeForge';
    
    showToast(`🔗 Projeto "${projectName}" recebido do CodeForge!`);
    
    switchPanel('forge');
    selectAgent('forge-link');
    addMessage('🔗', 'FORGE LINK', `✅ **Projeto recebido do CodeForge!**\n\n📦 **${projectName}**\n📄 HTML: ${data.code ? '✅' : '❌'}\n🎨 CSS: ${data.css ? '✅' : '❌'}\n⚡ JS: ${data.js ? '✅' : '❌'}\n\nDigite **"forjar"** ou **"build"** pra eu compilar automaticamente!`, 'agent');
}

// Importar via URL do CodeForge (fetch o HTML do GitHub Pages)
async function fetchFromCodeForge(url) {
    if (!url) url = config.codeforgeUrl;
    if (!url) {
        showToast('⚠️ Configure a URL do CodeForge em ⚙️');
        return null;
    }
    
    addMessage('🔗', 'FORGE LINK', `🔄 Conectando ao CodeForge...\n\nURL: **${url}**`, 'agent');
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const html = await response.text();
        
        // Extrair CSS e JS do HTML
        let css = '';
        let js = '';
        
        const styleMatches = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
        if (styleMatches) css = styleMatches.map(s => s.replace(/<\/?style[^>]*>/gi, '')).join('\n');
        
        const scriptMatches = html.match(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi);
        if (scriptMatches) js = scriptMatches.map(s => s.replace(/<\/?script[^>]*>/gi, '')).join('\n');
        
        editorFiles.html = html;
        editorFiles.css = css;
        editorFiles.js = js;
        
        addMessage('🔗', 'FORGE LINK', `✅ **Código importado do CodeForge!**\n\n📊 ${html.length} caracteres\n📄 HTML: ✅\n🎨 CSS: ${css ? '✅' : '⚠️ inline'}\n⚡ JS: ${js ? '✅' : '⚠️ inline'}`, 'agent');
        
        return { html, css, js };
    } catch (err) {
        addMessage('🔗', 'FORGE LINK', `❌ Erro ao conectar: ${err.message}\n\nVerifique a URL nas ⚙️ Configurações.`, 'agent');
        return null;
    }
}

// ===== AUTO-PILOT: FORJA AUTOMÁTICA =====
async function autoPilotBuild(options = {}) {
    const target = options.target || currentBuildTarget || 'pwa';
    const projectName = options.name || 'Meu App';
    const source = options.source || 'editor'; // 'editor', 'codeforge', 'url'
    
    currentBuildTarget = target;
    
    // Etapa 1: Puxar código se necessário
    addMessage('🔨', 'HEFESTO', `🔥 **AUTO-PILOT ATIVADO!**\n\n📦 Projeto: **${projectName}**\n🎯 Plataforma: **${getTargetName(target)}**\n\nIniciando forja automática...`, 'agent');
    
    await sleep(800);
    
    if (source === 'codeforge') {
        addMessage('🔗', 'FORGE LINK', '🔄 Puxando código do CodeForge...', 'agent');
        const result = await fetchFromCodeForge();
        if (!result) {
            addMessage('🔨', 'HEFESTO', '❌ Não consegui puxar do CodeForge. Cole o código manualmente na aba Build.', 'agent');
            return;
        }
        await sleep(500);
    }
    
    const hasCode = Object.values(editorFiles).some(f => f && f.trim());
    if (!hasCode) {
        addMessage('🔨', 'HEFESTO', '⚠️ **Sem código pra compilar!**\n\nPreciso de código. Opções:\n• Digite **"puxar codeforge"** pra importar\n• Cole código na aba **📦 Build**\n• Me diga o que quer criar e eu peço pro VULCANUS gerar!', 'agent');
        return;
    }
    
    // Etapa 2: Análise (ANVIL)
    await sleep(1000);
    addMessage('⚒️', 'ANVIL', '🔍 **Analisando código...**', 'agent');
    await sleep(1200);
    
    const analysis = analyzeCodeAuto();
    addMessage('⚒️', 'ANVIL', analysis, 'agent');
    await sleep(800);
    
    // Etapa 3: Otimização (SPARK)
    addMessage('⚡', 'SPARK', '⚡ **Otimizando código...**', 'agent');
    await sleep(1000);
    
    const optimized = optimizeCodeAuto();
    addMessage('⚡', 'SPARK', optimized, 'agent');
    await sleep(800);
    
    // Etapa 4: Build
    const buildAgent = getBuildAgentForTarget(target);
    addMessage(buildAgent.emoji, buildAgent.name, `🔨 **Compilando para ${getTargetName(target)}...**`, 'agent');
    await sleep(1500);
    
    // Etapa 5: Preparar pacote
    if (target === 'pwa') {
        preparePWA(projectName);
    }
    
    // Salvar projeto
    const project = {
        id: Date.now(),
        name: projectName,
        target: target,
        date: new Date().toLocaleDateString('pt-BR'),
        files: { ...editorFiles },
        size: Object.values(editorFiles).reduce((a, f) => a + (f ? new Blob([f]).size : 0), 0)
    };
    
    generateDownloadAuto(project);
    projects.push(project);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    renderProjects();
    
    await sleep(500);
    
    addMessage(buildAgent.emoji, buildAgent.name, 
        `✅ **BUILD COMPLETO!** 🎉\n\n📦 **${projectName}**\n🎯 ${getTargetName(target)}\n📊 ${(project.size/1024).toFixed(1)} KB\n\n📥 Vá na aba **📁 Projetos** pra baixar!\nOu digite **"download"** que eu baixo pra você.`, 'agent');
    
    addMessage('🔨', 'HEFESTO', `🔥 **Forja concluída!** O app está pronto.\n\nComandos disponíveis:\n• **"download"** — baixar o app\n• **"deploy"** — publicar no GitHub Pages\n• **"novo projeto"** — começar outro\n• **"puxar codeforge"** — importar outro projeto`, 'agent');
}

function analyzeCodeAuto() {
    const html = editorFiles.html || '';
    const css = editorFiles.css || '';
    const js = editorFiles.js || '';
    const totalSize = new Blob([html + css + js]).size;
    const lines = (html + css + js).split('\n').length;
    
    let report = `✅ **Análise concluída!**\n\n`;
    report += `📊 **${lines}** linhas | **${(totalSize/1024).toFixed(1)} KB**\n\n`;
    
    let score = 100;
    let issues = [];
    let goods = [];
    
    if (html.includes('<!DOCTYPE') || html.includes('<html')) goods.push('HTML válido');
    else { issues.push('Sem DOCTYPE'); score -= 10; }
    
    if (html.includes('<meta name="viewport"') || html.includes('viewport')) goods.push('Responsivo');
    else { issues.push('Sem viewport meta'); score -= 5; }
    
    if (html.includes('charset') || html.includes('UTF-8')) goods.push('Charset OK');
    
    if (css || html.includes('<style')) goods.push('CSS detectado');
    if (js || html.includes('<script')) goods.push('JavaScript detectado');
    
    if (html.includes('manifest') || html.includes('serviceWorker')) goods.push('PWA ready');
    else issues.push('Sem manifest/SW (adicionarei automaticamente)');
    
    report += goods.map(g => `✅ ${g}`).join('\n') + '\n';
    if (issues.length) report += '\n' + issues.map(i => `⚠️ ${i}`).join('\n') + '\n';
    report += `\n🏆 Score: **${score}/100**`;
    
    return report;
}

function optimizeCodeAuto() {
    let html = editorFiles.html || '';
    const originalSize = new Blob([html]).size;
    
    // Remover comentários HTML desnecessários (mas manter condicionais do IE)
    html = html.replace(/<!--(?!\[)[\s\S]*?-->/g, '');
    
    // Remover espaços múltiplos
    html = html.replace(/\s{2,}/g, ' ');
    
    editorFiles.html = html;
    const newSize = new Blob([html]).size;
    const saved = originalSize - newSize;
    const percent = originalSize > 0 ? ((saved / originalSize) * 100).toFixed(1) : 0;
    
    return `✅ **Otimização concluída!**\n\n📦 Original: **${(originalSize/1024).toFixed(1)} KB**\n📦 Otimizado: **${(newSize/1024).toFixed(1)} KB**\n💾 Economia: **${(saved/1024).toFixed(1)} KB** (${percent}%)\n\n⚡ Comentários removidos\n⚡ Espaços otimizados`;
}

function preparePWA(name) {
    let html = editorFiles.html || '';
    
    // Adicionar manifest se não tem
    if (!html.includes('manifest')) {
        html = html.replace('</head>', `<link rel="manifest" href="manifest.json">\n</head>`);
    }
    
    // Adicionar SW registration se não tem
    if (!html.includes('serviceWorker')) {
        html = html.replace('</body>', `<script>
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(function() {
        console.log('Service Worker registrado!');
    });
}
</script>\n</body>`);
    }
    
    // Adicionar meta viewport se não tem
    if (!html.includes('viewport')) {
        html = html.replace('</head>', `<meta name="viewport" content="width=device-width, initial-scale=1.0">\n</head>`);
    }
    
    editorFiles.html = html;
    
    // Atualizar manifest
    editorFiles.manifest = JSON.stringify({
        name: name,
        short_name: name.substring(0, 12),
        start_url: '.',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#ff6b35',
        icons: [
            { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
    }, null, 2);
}

function generateDownloadAuto(project) {
    let html = project.files.html || '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>App</title></head><body></body></html>';
    
    if (project.files.css && !html.includes(project.files.css.substring(0, 50))) {
        html = html.replace('</head>', `<style>\n${project.files.css}\n</style>\n</head>`);
    }
    if (project.files.js && !html.includes(project.files.js.substring(0, 50))) {
        html = html.replace('</body>', `<script>\n${project.files.js}\n</script>\n</body>`);
    }
    
    project.downloadHtml = html;
}

// ===== COMANDO INTELIGENTE =====
// Intercepta mensagens do chat e executa ações automaticamente

const ORIGINAL_PROCESS_AI = typeof processWithAI === 'function' ? processWithAI : null;

function processCommandOrAI(userMessage) {
    const msg = userMessage.toLowerCase().trim();
    
    // Comandos de ação direta
    if (matchCommand(msg, ['forjar', 'forja', 'build', 'compilar', 'construir', 'criar app', 'gerar app', 'fazer app'])) {
        handleBuildCommand(msg);
        hideTyping();
        return true;
    }
    
    if (matchCommand(msg, ['puxar codeforge', 'importar codeforge', 'buscar codeforge', 'trazer codeforge', 'pegar codeforge', 'codeforge'])) {
        hideTyping();
        fetchFromCodeForge();
        return true;
    }
    
    if (matchCommand(msg, ['download', 'baixar', 'baixa'])) {
        hideTyping();
        downloadLatestProject();
        return true;
    }
    
    if (matchCommand(msg, ['deploy', 'publicar', 'colocar online', 'subir'])) {
        hideTyping();
        deployLatestProject();
        return true;
    }
    
    if (matchCommand(msg, ['projetos', 'listar projetos', 'meus projetos', 'ver projetos'])) {
        hideTyping();
        listProjects();
        return true;
    }
    
    if (matchCommand(msg, ['status', 'como está', 'situação'])) {
        hideTyping();
        showStatus();
        return true;
    }
    
    if (matchCommand(msg, ['limpar', 'reset', 'novo', 'recomeçar'])) {
        hideTyping();
        resetWorkspace();
        return true;
    }
    
    if (matchCommand(msg, ['ajuda', 'help', 'comandos', 'o que você faz', 'o que posso fazer'])) {
        hideTyping();
        showCommandHelp();
        return true;
    }
    
    if (matchCommand(msg, ['auto', 'autopilot', 'piloto automático', 'faz tudo', 'fazer tudo', 'automático'])) {
        hideTyping();
        autoPilotFull();
        return true;
    }
    
    return false; // Não é comando, passar pra IA
}

function matchCommand(msg, keywords) {
    return keywords.some(k => msg.includes(k));
}

// ===== HANDLERS DE COMANDO =====

function handleBuildCommand(msg) {
    let target = 'pwa';
    if (msg.includes('android') || msg.includes('apk')) target = 'android';
    else if (msg.includes('windows') || msg.includes('exe') || msg.includes('desktop')) target = 'windows';
    else if (msg.includes('web') || msg.includes('pwa')) target = 'pwa';
    
    let name = 'Meu App';
    // Tentar extrair nome do comando
    const nameMatch = msg.match(/(?:chamad[oa]|nome|projeto)\s+["']?([^"']+)["']?/i);
    if (nameMatch) name = nameMatch[1].trim();
    
    autoPilotBuild({ target, name, source: 'editor' });
}

function downloadLatestProject() {
    if (projects.length === 0) {
        addMessage('🔨', 'HEFESTO', '⚠️ Nenhum projeto pra baixar. Forje um primeiro!\n\nDigite **"forjar"** ou **"auto"** pra começar.', 'agent');
        return;
    }
    const latest = projects[projects.length - 1];
    downloadProject(latest.id);
    addMessage('📥', 'HEFESTO', `✅ Download de **"${latest.name}"** iniciado!`, 'agent');
}

function deployLatestProject() {
    if (projects.length === 0) {
        addMessage('🔨', 'HEFESTO', '⚠️ Nenhum projeto pra publicar. Forje um primeiro!', 'agent');
        return;
    }
    const latest = projects[projects.length - 1];
    
    if (!config.githubToken || !config.githubUser) {
        addMessage('🔥', 'EMBER', '⚠️ **GitHub não configurado!**\n\nVá em ⚙️ Configurações e preencha:\n• **GitHub Token** (gere em github.com/settings/tokens)\n• **GitHub Username**\n\nDepois digite **"deploy"** de novo.', 'agent');
        return;
    }
    
    addMessage('🔥', 'EMBER', `🚀 **Preparando deploy de "${latest.name}"...**\n\nPara deploy automático no GitHub Pages:\n\n1️⃣ Baixe os arquivos (digitando **"download"**)\n2️⃣ Crie um repo: **github.com/new**\n3️⃣ Upload dos arquivos\n4️⃣ Settings → Pages → main\n\nURL: **${config.githubUser}.github.io/${latest.name.toLowerCase().replace(/\s+/g,'-')}** 🌐`, 'agent');
}

function listProjects() {
    if (projects.length === 0) {
        addMessage('🔨', 'HEFESTO', '📭 Nenhum projeto ainda. Digite **"forjar"** ou **"auto"** pra começar!', 'agent');
        return;
    }
    
    const targetNames = { pwa: '🌐 PWA', android: '📱 Android', windows: '🖥️ Windows', zip: '📂 ZIP' };
    let list = '📁 **Seus Projetos:**\n\n';
    projects.forEach((p, i) => {
        list += `${i+1}. **${p.name}** — ${targetNames[p.target] || p.target} | ${(p.size/1024).toFixed(1)} KB | ${p.date}\n`;
    });
    list += `\n📊 Total: **${projects.length}** projeto(s)\n\nDigite **"download"** pra baixar o último.`;
    
    addMessage('🔨', 'HEFESTO', list, 'agent');
}

function showStatus() {
    const hasCode = Object.values(editorFiles).some(f => f && f.trim());
    const codeSize = Object.values(editorFiles).reduce((a, f) => a + (f ? new Blob([f]).size : 0), 0);
    
    let status = '📊 **Status do VULCAN**\n\n';
    status += `🔑 Gemini: ${config.geminiKey ? '✅ Configurada' : '❌ Não configurada'}\n`;
    status += `💻 Código carregado: ${hasCode ? `✅ (${(codeSize/1024).toFixed(1)} KB)` : '❌ Nenhum'}\n`;
    status += `📁 Projetos: **${projects.length}**\n`;
    status += `🎯 Plataforma atual: **${getTargetName(currentBuildTarget)}**\n`;
    status += `🤖 Agente ativo: **${AGENTS[currentAgent]?.name || currentAgent}**\n`;
    status += `\n⚡ Todos os agentes **online** e prontos!`;
    
    addMessage('🔮', 'VULCANUS', status, 'agent');
}

function resetWorkspace() {
    editorFiles = { html: '', css: '', js: '', manifest: '' };
    if (document.getElementById('code-editor')) {
        document.getElementById('code-editor').value = '';
    }
    addMessage('🔨', 'HEFESTO', '🔄 **Workspace limpo!**\n\nPronto pra um novo projeto. O que quer criar?', 'agent');
}

function showCommandHelp() {
    addMessage('🔮', 'VULCANUS', `🔮 **Comandos do VULCAN:**\n\n🔨 **"forjar"** / **"build"** — compilar o código atual\n🔥 **"auto"** / **"faz tudo"** — piloto automático completo\n🔗 **"puxar codeforge"** — importar do CodeForge\n📥 **"download"** — baixar último projeto\n🚀 **"deploy"** — publicar no GitHub Pages\n📁 **"projetos"** — listar projetos\n📊 **"status"** — ver status do sistema\n🔄 **"limpar"** — resetar workspace\n\n💡 Ou simplesmente **descreva o que quer** em português que eu entendo!\n\nExemplos:\n• *"Cria um app de calculadora"*\n• *"Puxa o código do CodeForge e forja como PWA"*\n• *"Faz tudo automático"*`, 'agent');
}

async function autoPilotFull() {
    addMessage('🔮', 'VULCANUS', '🔮 **PILOTO AUTOMÁTICO ATIVADO!**\n\n🔗 Vou puxar do CodeForge → Analisar → Otimizar → Forjar → Deixar pronto pra download!\n\nAguarde...', 'agent');
    await sleep(1000);
    await autoPilotBuild({ target: currentBuildTarget, name: 'App CodeForge', source: 'codeforge' });
}

// ===== UTILS =====
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function getTargetName(target) {
    return { pwa: '🌐 PWA', android: '📱 Android APK', windows: '🖥️ Windows EXE', zip: '📂 ZIP' }[target] || target;
}

function getBuildAgentForTarget(target) {
    const agents = {
        pwa: { name: 'EMBER', emoji: '🔥' },
        android: { name: 'MAGMA', emoji: '🌋' },
        windows: { name: 'TITANIUM', emoji: '🛡️' },
        zip: { name: 'HEFESTO', emoji: '🔨' }
    };
    return agents[target] || agents.pwa;
}

// ===== OVERRIDE DO CHAT =====
// Interceptar sendMessage pra processar comandos antes de mandar pra IA

const _originalSendMessage = typeof sendMessage === 'function' ? sendMessage : null;

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
    
    // Tentar processar como comando primeiro
    if (!processCommandOrAI(text)) {
        // Não é comando, mandar pra IA Gemini
        processWithAI(text);
    }
}
