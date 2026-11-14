// catOS window manager.
// Apps register with WM.register({ id, name, icon, open(content, win) }).
// Every window is opened with WM.open(appId). One window per app.
// Window state lives in plain objects; draw() copies it onto the page.
// (The old W3Schools drag code is saved in old/wm.js.)

// Saves small settings in this browser. Never crashes if storage is blocked.
const Store = {
    get(key, fallback) {
        try {
            const value = localStorage.getItem('catos:' + key);
            return value === null ? fallback : JSON.parse(value);
        } catch {
            return fallback;
        }
    },
    set(key, value) {
        try {
            localStorage.setItem('catos:' + key, JSON.stringify(value));
        } catch {
            // storage blocked (private window): works until the page reloads
        }
    },
};

const WM = (() => {
    const TITLEBAR = 32;
    const apps = new Map();      // appId -> app
    const windows = new Map();   // appId -> open window
    const listeners = [];
    let zTop = 10;
    let focusedWin = null;
    let cascade = 0;
    let hiddenByShowDesktop = [];

    // Tiny pixel glyphs for the title bar buttons. Each "x" is one pixel.
    const pixels = (rows) => {
        let rects = '';
        rows.forEach((row, y) => [...row].forEach((c, x) => {
            if (c === 'x') rects += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
        }));
        return `<svg viewBox="0 0 ${rows[0].length} ${rows.length}" width="${rows[0].length}" height="${rows.length}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
    };
    const GLYPHS = {
        min: pixels(['......', '......', '......', '......', '......', 'xxxxxx', 'xxxxxx']),
        max: pixels(['xxxxxxxxx', 'xxxxxxxxx', 'x.......x', 'x.......x', 'x.......x', 'x.......x', 'x.......x', 'x.......x', 'xxxxxxxxx']),
        restore: pixels(['..xxxxxx', '..xxxxxx', '..x....x', 'xxxxxx.x', 'xxxxxx.x', 'x....xxx', 'x....x..', 'x....x..', 'xxxxxx..']),
        close: pixels(['xx....xx', '.xx..xx.', '..xxxx..', '...xx...', '..xxxx..', '.xx..xx.', 'xx....xx']),
    };

    const layer = () => document.getElementById('windows');
    const area = () => {
        const r = layer().getBoundingClientRect();
        return { w: r.width, h: r.height };
    };
    const changed = () => listeners.forEach((fn) => fn());
    const minW = (win) => win.app.minWidth || 260;
    const minH = (win) => win.app.minHeight || 180;

    // Keep the title bar on screen so a window can never be lost.
    function clamp(win) {
        const a = area();
        win.x = Math.min(Math.max(win.x, 100 - win.w), a.w - 100);
        win.y = Math.min(Math.max(win.y, 0), a.h - TITLEBAR);
    }

    // Copy a window's state onto its element.
    function draw(win) {
        const { el } = win;
        el.classList.toggle('maximized', win.maximized);
        el.style.left = win.x + 'px';
        el.style.top = win.y + 'px';
        el.style.width = win.w + 'px';
        el.style.height = win.h + 'px';
        const maxBtn = el.querySelector('[data-act="max"]');
        maxBtn.innerHTML = win.maximized ? GLYPHS.restore : GLYPHS.max;
        maxBtn.setAttribute('aria-label', win.maximized ? 'Restore' : 'Maximize');
    }

    function create(app) {
        const el = document.createElement('div');
        el.className = 'window opening' + (app.dark ? ' dark' : '');
        el.setAttribute('role', 'dialog');
        el.setAttribute('aria-label', app.name);
        el.innerHTML = `
            <div class="titlebar">
                <span class="title-icon">${app.icon}</span>
                <span class="title-text">${app.name}</span>
                <div class="win-controls">
                    <button class="win-btn" data-act="min" aria-label="Minimize">${GLYPHS.min}</button>
                    <button class="win-btn" data-act="max" aria-label="Maximize">${GLYPHS.max}</button>
                    <button class="win-btn close" data-act="close" aria-label="Close">${GLYPHS.close}</button>
                </div>
            </div>
            <div class="window-content"></div>
            <div class="rz rz-e" data-dir="e"></div>
            <div class="rz rz-w" data-dir="w"></div>
            <div class="rz rz-s" data-dir="s"></div>
            <div class="rz rz-se" data-dir="se"></div>
            <div class="rz rz-sw" data-dir="sw"></div>`;

        const a = area();
        const w = Math.min(app.width || 480, a.w - 16);
        const h = Math.min(app.height || 360, a.h - 16);
        const offset = (cascade++ % 6) * 28;
        const win = {
            id: app.id,
            app,
            el,
            content: el.querySelector('.window-content'),
            x: Math.round((a.w - w) / 2) - 70 + offset,
            y: Math.round((a.h - h) / 2) - 50 + offset,
            w,
            h,
            minimized: false,
            maximized: false,
        };
        // Apps can ask to open in the bottom-right corner (like the music player).
        if (app.corner === 'bottom-right') {
            win.x = a.w - w - 10;
            win.y = a.h - h - 10;
            cascade--;
        }
        // New windows open fully on screen.
        win.x = Math.max(8, Math.min(win.x, a.w - w - 8));
        win.y = Math.max(8, Math.min(win.y, a.h - h - 8));
        layer().appendChild(el);
        draw(win);
        wire(win);
        el.addEventListener('animationend', () => el.classList.remove('opening'), { once: true });
        return win;
    }

    function wire(win) {
        const { el } = win;
        const bar = el.querySelector('.titlebar');

        // Any click inside a window brings it to the front.
        el.addEventListener('pointerdown', () => focus(win), true);

        el.querySelector('.win-controls').addEventListener('click', (e) => {
            const btn = e.target.closest('.win-btn');
            if (!btn) return;
            if (btn.dataset.act === 'min') minimize(win);
            if (btn.dataset.act === 'max') toggleMaximize(win);
            if (btn.dataset.act === 'close') close(win.id);
        });
        bar.addEventListener('dblclick', (e) => {
            if (!e.target.closest('.win-btn')) toggleMaximize(win);
        });

        // Dragging by the title bar.
        let drag = null;
        bar.addEventListener('pointerdown', (e) => {
            if (e.button !== 0 || e.target.closest('.win-btn')) return;
            drag = { startX: e.clientX, startY: e.clientY, dx: e.clientX - win.x, dy: e.clientY - win.y };
            bar.setPointerCapture(e.pointerId);
        });
        bar.addEventListener('pointermove', (e) => {
            if (!drag) return;
            if (win.maximized) {
                // Only un-maximize once the pointer really moves, so a plain click does nothing.
                if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) < 5) return;
                const ratio = e.clientX / area().w;
                win.maximized = false;
                drag.dx = win.w * ratio;
                drag.dy = e.clientY;
            }
            el.classList.add('dragging');
            win.x = e.clientX - drag.dx;
            win.y = e.clientY - drag.dy;
            clamp(win);
            draw(win);
        });
        const endDrag = () => {
            drag = null;
            el.classList.remove('dragging');
        };
        bar.addEventListener('pointerup', endDrag);
        bar.addEventListener('pointercancel', endDrag);

        // Resizing from the edges and bottom corners.
        el.querySelectorAll('.rz').forEach((handle) => {
            let start = null;
            handle.addEventListener('pointerdown', (e) => {
                if (e.button !== 0 || win.maximized) return;
                start = { px: e.clientX, py: e.clientY, x: win.x, w: win.w, h: win.h, dir: handle.dataset.dir };
                handle.setPointerCapture(e.pointerId);
                el.classList.add('dragging');
            });
            handle.addEventListener('pointermove', (e) => {
                if (!start) return;
                const dx = e.clientX - start.px;
                const dy = e.clientY - start.py;
                if (start.dir.includes('e')) win.w = Math.max(minW(win), start.w + dx);
                if (start.dir.includes('s')) win.h = Math.max(minH(win), start.h + dy);
                if (start.dir.includes('w')) {
                    win.w = Math.max(minW(win), start.w - dx);
                    win.x = start.x + start.w - win.w;
                }
                draw(win);
            });
            const end = () => {
                start = null;
                el.classList.remove('dragging');
            };
            handle.addEventListener('pointerup', end);
            handle.addEventListener('pointercancel', end);
        });
    }

    function markFocus() {
        for (const w of windows.values()) w.el.classList.toggle('active', w === focusedWin);
    }

    function focus(win) {
        if (focusedWin === win && Number(win.el.style.zIndex) === zTop) return;
        zTop += 1;
        win.el.style.zIndex = zTop;
        focusedWin = win;
        markFocus();
        changed();
    }

    // Focus whichever visible window is on top, or nothing.
    function focusTopmost() {
        let best = null;
        for (const w of windows.values()) {
            if (!w.minimized && (!best || Number(w.el.style.zIndex) > Number(best.el.style.zIndex))) best = w;
        }
        if (best) focus(best);
        else {
            focusedWin = null;
            markFocus();
            changed();
        }
    }

    function minimize(win) {
        win.minimized = true;
        win.el.classList.add('minimized');
        if (focusedWin === win) focusTopmost();
        changed();
    }

    function restore(win) {
        if (win.minimized) {
            win.minimized = false;
            win.el.classList.remove('minimized');
        }
        focus(win);
        changed();
    }

    function toggleMaximize(win) {
        win.maximized = !win.maximized;
        draw(win);
    }

    function open(id, args) {
        const existing = windows.get(id);
        if (existing) {
            restore(existing);
            return existing;
        }
        const app = apps.get(id);
        if (!app) return null;
        const win = create(app);
        windows.set(id, win);
        app.open(win.content, win, args);
        focus(win);
        changed();
        return win;
    }

    function close(id) {
        const win = windows.get(id);
        if (!win) return;
        if (win.app.onClose) win.app.onClose(win);
        windows.delete(id);
        win.el.classList.add('closing');
        setTimeout(() => win.el.remove(), 160);
        if (focusedWin === win) {
            focusedWin = null;
            focusTopmost();
        }
        changed();
    }

    // What clicking an app on the taskbar does, same as Windows.
    function taskbarClick(id) {
        const win = windows.get(id);
        if (!win) open(id);
        else if (win.minimized) restore(win);
        else if (focusedWin === win) minimize(win);
        else focus(win);
    }

    // The thin button at the far right of the taskbar.
    function toggleDesktop() {
        const visible = [...windows.values()].filter((w) => !w.minimized);
        if (visible.length) {
            hiddenByShowDesktop = visible;
            visible.forEach(minimize);
        } else {
            hiddenByShowDesktop.filter((w) => windows.get(w.id) === w).forEach(restore);
            hiddenByShowDesktop = [];
        }
    }

    function blur() {
        if (!focusedWin) return;
        focusedWin = null;
        markFocus();
        changed();
    }

    window.addEventListener('resize', () => {
        for (const w of windows.values()) {
            w.w = Math.min(w.w, area().w);
            w.h = Math.min(w.h, area().h);
            clamp(w);
            draw(w);
        }
    });

    return {
        register: (app) => apps.set(app.id, app),
        open,
        close,
        taskbarClick,
        toggleDesktop,
        blur,
        onChange: (fn) => listeners.push(fn),
        apps: () => [...apps.values()],
        app: (id) => apps.get(id),
        get: (id) => windows.get(id),
        list: () => [...windows.values()],
        focused: () => focusedWin,
    };
})();
