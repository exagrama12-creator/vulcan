// ========================================
// VULCAN - Build & Projects & Tutorials
// ========================================

function completeBuild() {
    let projectName = 'Meu App';
    try {
        const m = JSON.parse(editorFiles.manifest || '{}');
        if (m.name) projectName = m.name;
    } catch {}

    const project = {
        id: Date.now(),
        name: projectName,
        target: currentBuildTarget,
        date: new Date().toLocaleDateString('pt-BR'),
        files: { ...editorFiles },
        size: Object.values(editorFiles).reduce((a, f) => a + (f ? new Blob([f]).size : 0), 0)
    };

    projects.push(project);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));

    // Generate download
    if (currentBuildTarget === 'zip' || currentBuildTarget === 'pwa') {
        generateDownload(project);
    }

    showToast('🎉 Build completo! Verifique a aba Projetos.');

    setTimeout(() => {
        const buildPanel = document.querySelector('.build-panel');
        const progressPanel = document.getElementById('build-progress');
        buildPanel.style.display = '';
        progressPanel.classList.remove('active');
        document.getElementById('progress-bar').style.width = '0%';
        
        renderProjects();
        
        // Show completion in chat
        switchPanel('forge');
        const agent = AGENTS[getBuildAgent().toLowerCase()] || AGENTS.hefesto;
        addMessage(agent.emoji, agent.name, 
            `✅ **Build completo!**\n\n📦 Projeto: **${projectName}**\n🎯 Plataforma: **${getBuildOutput()}**\n📊 Tamanho: **${(project.size/1024).toFixed(1)} KB**\n\nVeja na aba **📁 Projetos** para baixar!`, 
            'agent');
    }, 2000);
}

function generateDownload(project) {
    // Create a simple HTML file bundle
    let html = project.files.html || '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>App</title></head><body></body></html>';
    
    if (project.files.css && !html.includes(project.files.css)) {
        html = html.replace('</head>', `<style>\n${project.files.css}\n</style>\n</head>`);
    }
    if (project.files.js && !html.includes(project.files.js)) {
        html = html.replace('</body>', `<script>\n${project.files.js}\n</script>\n</body>`);
    }

    // For PWA, add manifest link and service worker registration
    if (currentBuildTarget === 'pwa') {
        if (!html.includes('manifest')) {
            html = html.replace('</head>', `<link rel="manifest" href="manifest.json">\n</head>`);
        }
        if (!html.includes('serviceWorker')) {
            html = html.replace('</body>', `<script>
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}
</script>\n</body>`);
        }
    }

    // Store for download
    project.downloadHtml = html;
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

function downloadProject(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const html = project.downloadHtml || project.files.html || '';
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '-').toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📥 Download iniciado!');
}

function downloadProjectZip(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    // Without a zip library, download individual files
    const files = project.files;
    let count = 0;

    if (files.html) { downloadFile(`index.html`, files.html, 'text/html'); count++; }
    if (files.css) { downloadFile(`style.css`, files.css, 'text/css'); count++; }
    if (files.js) { downloadFile(`app.js`, files.js, 'application/javascript'); count++; }
    if (files.manifest) { downloadFile(`manifest.json`, files.manifest, 'application/json'); count++; }

    // Generate service worker
    if (project.target === 'pwa') {
        const sw = `const CACHE_NAME = '${project.name}-v1';
const urlsToCache = ['/', '/index.html', '/style.css', '/app.js'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(urlsToCache))));
self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))));`;
        downloadFile('sw.js', sw, 'application/javascript');
        count++;
    }

    showToast(`📥 ${count} arquivos baixados!`);
}

function downloadFile(name, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function previewProject(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const html = project.downloadHtml || project.files.html || '<p>Sem preview disponível</p>';
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
}

function deleteProject(projectId) {
    if (!confirm('Deletar este projeto?')) return;
    projects = projects.filter(p => p.id !== projectId);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    renderProjects();
    showToast('🗑️ Projeto removido.');
}

function deployToGithub(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    if (!config.githubToken || !config.githubUser) {
        showToast('⚠️ Configure GitHub Token e Username em ⚙️');
        showConfigModal();
        return;
    }

    switchPanel('forge');
    selectAgent('ember');
    addMessage('🔥', 'EMBER', 
        `Para fazer deploy do **${project.name}** no GitHub Pages:\n\n1️⃣ Baixe os arquivos (botão Download)\n2️⃣ Crie um repositório no GitHub: **github.com/new**\n3️⃣ Faça upload dos arquivos\n4️⃣ Vá em Settings → Pages → Source: main\n5️⃣ Aguarde 1-2 min\n\nURL: **${config.githubUser}.github.io/${project.name.toLowerCase().replace(/\s+/g, '-')}** 🌐`, 
        'agent');
}

// ===== RENDER PROJECTS =====
function renderProjects() {
    const container = document.getElementById('projects-container');
    if (!container) return;

    if (projects.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:60px; color:var(--metal-3);">
                <div style="font-size:50px; margin-bottom:16px;">📭</div>
                <p>Nenhum projeto ainda. Comece criando ou importando do CodeForge!</p>
            </div>`;
        return;
    }

    const targetIcons = { pwa: '🌐', android: '📱', windows: '🖥️', zip: '📂' };
    const targetNames = { pwa: 'PWA', android: 'Android APK', windows: 'Windows EXE', zip: 'ZIP' };

    container.innerHTML = projects.map(p => `
        <div class="project-card">
            <div class="project-header">
                <h3>${targetIcons[p.target] || '📦'} ${p.name}</h3>
            </div>
            <div class="project-meta">
                <div class="project-meta-item">📅 ${p.date}</div>
                <div class="project-meta-item">🎯 ${targetNames[p.target] || p.target}</div>
                <div class="project-meta-item">📊 ${(p.size/1024).toFixed(1)} KB</div>
            </div>
            <div class="project-actions">
                <button class="project-action-btn" onclick="previewProject(${p.id})">👁️ Preview</button>
                <button class="project-action-btn" onclick="downloadProject(${p.id})">📥 Download HTML</button>
                <button class="project-action-btn" onclick="downloadProjectZip(${p.id})">📂 Todos os Arquivos</button>
                <button class="project-action-btn" onclick="deployToGithub(${p.id})">🚀 Deploy</button>
                <button class="project-action-btn" onclick="deleteProject(${p.id})" style="border-color:rgba(244,67,54,0.3); color:#f44336;">🗑️</button>
            </div>
        </div>
    `).join('');
}

// ===== TUTORIALS =====
function startTutorial(tutorialId) {
    const tutorial = TUTORIALS[tutorialId];
    if (!tutorial) return;

    switchPanel('forge');
    selectAgent('minerva');

    const welcome = document.getElementById('welcome-screen');
    if (welcome) welcome.remove();

    addMessage('📚', 'MINERVA', `📖 **${tutorial.title}**\n\nVou te guiar passo a passo! 😊`, 'agent');

    tutorial.steps.forEach((step, i) => {
        setTimeout(() => {
            addMessage('📚', 'MINERVA', `**Passo ${i+1}: ${step.title}**\n\n${step.content}`, 'agent');
        }, (i + 1) * 2000);
    });

    setTimeout(() => {
        addMessage('📚', 'MINERVA', '✅ **Tutorial completo!** Tem alguma dúvida? É só perguntar! 😊', 'agent');
    }, (tutorial.steps.length + 1) * 2000);
}

// ===== IMPORT =====
function importFromCodeForge() {
    const modal = document.getElementById('config-modal');
    const modalContent = modal.querySelector('.modal');
    
    modalContent.innerHTML = `
        <button class="modal-close" onclick="closeConfigModal()">✕</button>
        <h2>🔗 Importar do CodeForge</h2>
        
        <div class="config-section">
            <label>📋 Cole o código HTML do CodeForge</label>
            <textarea class="config-input" id="import-html" rows="10" style="min-height:200px; font-family:'JetBrains Mono',monospace; font-size:12px; resize:vertical;" placeholder="Cole aqui o código HTML gerado pelo CodeForge..."></textarea>
        </div>

        <div class="config-section">
            <label>🎨 CSS (opcional)</label>
            <textarea class="config-input" id="import-css" rows="5" style="min-height:100px; font-family:'JetBrains Mono',monospace; font-size:12px;" placeholder="CSS adicional..."></textarea>
        </div>

        <div class="config-section">
            <label>⚡ JavaScript (opcional)</label>
            <textarea class="config-input" id="import-js" rows="5" style="min-height:100px; font-family:'JetBrains Mono',monospace; font-size:12px;" placeholder="JavaScript adicional..."></textarea>
        </div>

        <button class="config-save-btn" onclick="doImport()">🔨 Importar e Forjar!</button>
    `;
    
    modal.classList.add('show');
}

function doImport() {
    const html = document.getElementById('import-html').value;
    const css = document.getElementById('import-css').value;
    const js = document.getElementById('import-js').value;

    if (!html.trim()) {
        showToast('⚠️ Cole o código HTML!');
        return;
    }

    editorFiles.html = html;
    editorFiles.css = css;
    editorFiles.js = js;

    closeConfigModal();
    
    // Restore modal content
    setTimeout(() => {
        const modalContent = document.getElementById('config-modal').querySelector('.modal');
        modalContent.innerHTML = `
            <button class="modal-close" onclick="closeConfigModal()">✕</button>
            <h2>⚙️ Configurações</h2>
            <div class="config-section">
                <label>🔑 Google Gemini API Key</label>
                <input type="password" class="config-input" id="gemini-key" placeholder="AIzaSy..." value="${config.geminiKey || ''}">
            </div>
            <div class="config-section">
                <label>🔗 GitHub Token</label>
                <input type="password" class="config-input" id="github-token" placeholder="ghp_..." value="${config.githubToken || ''}">
            </div>
            <div class="config-section">
                <label>👤 GitHub Username</label>
                <input type="text" class="config-input" id="github-user" placeholder="seu-usuario" value="${config.githubUser || ''}">
            </div>
            <div class="config-section">
                <label>🔗 URL do CodeForge</label>
                <input type="text" class="config-input" id="codeforge-url" placeholder="https://..." value="${config.codeforgeUrl || ''}">
            </div>
            <button class="config-save-btn" onclick="saveConfig()">💾 Salvar</button>
        `;
    }, 300);

    switchPanel('build');
    document.getElementById('code-editor').value = html;
    currentEditorTab = 'html';

    showToast('✅ Código importado! Escolha a plataforma e FORJE!');

    // Notify in chat
    setTimeout(() => {
        switchPanel('forge');
        addMessage('🔗', 'FORGE LINK', '✅ **Código importado do CodeForge!**\n\nAgora vá na aba **📦 Build**, escolha a plataforma e clique **FORJAR APP** 🔨🔥', 'agent');
    }, 500);
}

function startNewProject() {
    switchPanel('forge');
    const welcome = document.getElementById('welcome-screen');
    if (welcome) welcome.remove();
    addMessage('🔨', 'HEFESTO', 'Vamos criar um novo projeto! 🔥\n\nMe diga:\n1️⃣ **O que** quer criar? (app de notas, jogo, loja...)\n2️⃣ **Para qual plataforma?** (Android, Windows, Web)\n\nOu vá direto na aba **📦 Build** e cole seu código!', 'agent');
}

function handleFileUpload(event) {
    const files = event.target.files;
    if (!files.length) return;

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const ext = file.name.split('.').pop().toLowerCase();
            
            if (ext === 'html' || ext === 'htm') editorFiles.html = content;
            else if (ext === 'css') editorFiles.css = content;
            else if (ext === 'js') editorFiles.js = content;
            else if (ext === 'json') editorFiles.manifest = content;

            showToast(`📎 ${file.name} carregado!`);
        };
        reader.readAsText(file);
    });

    switchPanel('build');
    setTimeout(() => {
        document.getElementById('code-editor').value = editorFiles[currentEditorTab] || '';
    }, 300);
}

// ===== TOAST =====
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', init);
