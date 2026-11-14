// catOS boot: wallpaper, desktop icons, taskbar, start menu, clock.
// Runs after wm.js and apps.js.

const $ = (id) => document.getElementById(id);

const WALLPAPER_COLOURS = { teal: '#008080', solid: '#1d2230' };

function setWallpaper(name) {
    Store.set('wallpaper', name);
    const colour = WALLPAPER_COLOURS[name];
    $('wallpaper').style.backgroundImage = colour ? 'none' : `url("${name}")`;
    $('wallpaper').style.backgroundColor = colour || '#008080';
}

const iconHtml = (app) => `<span class="icon">${app.icon}</span>`;

// ── Desktop icons: click to select, double-click (or Enter) to open ──
function renderDesktop() {
    const desktop = $('desktop');
    desktop.innerHTML = '';
    for (const app of WM.apps()) {
        if (!app.desktop) continue;
        const btn = document.createElement('button');
        btn.className = 'desktop-icon';
        btn.innerHTML = `${iconHtml(app)}<span class="label">${app.name}</span>`;
        btn.addEventListener('dblclick', () => WM.open(app.id));
        btn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') WM.open(app.id);
        });
        desktop.appendChild(btn);
    }
}

// ── Taskbar: one button per open window, like Windows 98 ──
function renderTaskbar() {
    const bar = $('taskbar-apps');
    bar.innerHTML = '';
    for (const win of WM.list()) {
        const btn = document.createElement('button');
        btn.className = 'task-btn';
        if (!win.minimized && WM.focused() === win) btn.classList.add('active');
        btn.title = win.app.name;
        btn.innerHTML = `${iconHtml(win.app)}<span class="task-name">${win.app.name}</span>`;
        btn.addEventListener('click', () => WM.taskbarClick(win.id));
        bar.appendChild(btn);
    }
}

// ── Start menu ──
function renderStartMenu() {
    const list = $('start-apps');
    list.innerHTML = '';
    for (const app of WM.apps()) {
        const btn = document.createElement('button');
        btn.className = 'sm-item';
        btn.innerHTML = `${iconHtml(app)}<span>${app.name}</span>`;
        btn.addEventListener('click', () => {
            toggleStart(false);
            WM.open(app.id);
        });
        list.appendChild(btn);
    }
}

function toggleStart(show = $('start-menu').hidden) {
    $('start-menu').hidden = !show;
    $('start-btn').classList.toggle('pressed', show);
}

// ── Clock ──
function tickClock() {
    const now = new Date();
    $('clock').textContent = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    $('clock').title = now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

// ── Shut down ──
function shutDown() {
    toggleStart(false);
    Music.stop();
    $('shutdown').hidden = false;
}

// ── Wiring ──
$('start-btn').addEventListener('click', () => toggleStart());
$('power-btn').addEventListener('click', shutDown);
$('restart-btn').addEventListener('click', () => location.reload());
$('show-desktop').addEventListener('click', () => WM.toggleDesktop());

document.addEventListener('pointerdown', (e) => {
    if (!$('start-menu').hidden && !e.target.closest('#start-menu, #start-btn')) toggleStart(false);
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') toggleStart(false);
});

// Clicking empty desktop deselects icons and unfocuses windows.
$('desktop').addEventListener('pointerdown', (e) => {
    if (e.target === $('desktop')) {
        document.activeElement?.blur();
        WM.blur();
    }
});

// The first click or key press anywhere starts the music.
document.addEventListener('pointerdown', Music.unlock, { capture: true, once: true });
document.addEventListener('keydown', Music.unlock, { capture: true, once: true });

// ── Boot ──
setWallpaper(Store.get('wallpaper', 'img_1.png'));
renderDesktop();
renderStartMenu();
WM.onChange(renderTaskbar);
renderTaskbar();
tickClock();
setInterval(tickClock, 1000);
WM.open('notes');
WM.open('aboutme');
WM.open('music');
Music.tryAutoplay();
