// catOS apps. Each app is registered with the window manager.
// open(content, win) fills the window's content area with the app.

const esc = (text) =>
    String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Icons: your photos for meow.txt and Cat Pics, hand-drawn retro ones for the rest.
const ICONS = {
    notes: '<img src="kitten-lying-in-blanket.jpg" alt="">',
    text: `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 3h13l6 6v20H7z" fill="#fff" stroke="#000"/><path d="M20 3v6h6" fill="#c0c0c0" stroke="#000"/><path d="M10 13h12M10 17h12M10 21h12M10 25h8" stroke="#000080"/></svg>`,
    cats: '<img src="img.png" alt="">',
    music: `<svg viewBox="0 0 32 32" aria-hidden="true">
        <rect x="3" y="3" width="26" height="26" fill="#c0c0c0" stroke="#000"/>
        <polygon points="12,9 26,6 26,10 12,13" fill="#000"/>
        <rect x="12" y="9" width="2" height="13" fill="#000"/><rect x="24" y="6" width="2" height="14" fill="#000"/>
        <ellipse cx="10" cy="22.5" rx="4" ry="3" fill="#e2416b" stroke="#000"/>
        <ellipse cx="22" cy="20.5" rx="4" ry="3" fill="#e2416b" stroke="#000"/></svg>`,
    paint: `<svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M16 5C8.5 5 3.5 9.8 3.5 15.5S8 25 12.5 25c2.8 0 2.5-3 4.6-3 2 0 2.8 3.6 6.4 2.7 3-.8 4-4.6 4-8.7C27.5 9.6 22.6 5 16 5z" fill="#e9d29a" stroke="#000"/>
        <circle cx="10" cy="13" r="2.2" fill="#ff0000" stroke="#000"/><circle cx="15.5" cy="10" r="2.2" fill="#ffff00" stroke="#000"/>
        <circle cx="21.5" cy="11.5" r="2.2" fill="#00a000" stroke="#000"/><circle cx="23" cy="17.5" r="2.2" fill="#0000ff" stroke="#000"/>
        <circle cx="10" cy="19" r="2" fill="#c0c0c0" stroke="#000"/></svg>`,
    settings: `<svg viewBox="0 0 32 32" aria-hidden="true">
        <rect x="3" y="5" width="26" height="18" fill="#c0c0c0" stroke="#000"/>
        <rect x="6" y="8" width="20" height="12" fill="#008080" stroke="#000"/>
        <rect x="12" y="23" width="8" height="3" fill="#808080" stroke="#000"/>
        <rect x="8" y="26" width="16" height="2" fill="#c0c0c0" stroke="#000"/>
        <circle cx="21" cy="12" r="2" fill="#ffff00"/></svg>`,
};


// ───────────────────────── Text files (Notepad) ─────────────────────────

function textFile({ id, name, icon, text }) {
    WM.register({
        id,
        name,
        icon,
        width: 460,
        height: 320,
        desktop: true,
        open(content) {
            content.classList.add('notepad');
            content.innerHTML = `
                <textarea class="np-text sunken" spellcheck="false" aria-label="${name}"></textarea>
                <div class="statusbar"><span class="np-count"></span><span>Saved</span></div>`;
            const box = content.querySelector('.np-text');
            const count = content.querySelector('.np-count');
            box.value = Store.get(id, text);
            const update = () => {
                const lines = box.value.split('\n').length;
                count.textContent = `${lines} ${lines === 1 ? 'line' : 'lines'}, ${box.value.length} characters`;
            };
            box.addEventListener('input', () => {
                Store.set(id, box.value);
                update();
            });
            update();
        },
    });
}

textFile({
    id: 'notes',
    name: 'meow.txt',
    icon: ICONS.notes,
    text: 'meow\n\nWelcome to catOS. This is meow.txt. Type anything, it saves itself.',
});

textFile({
    id: 'aboutme',
    name: 'aboutme.txt',
    icon: ICONS.text,
    text: 'im cole\n\ni like programming and cats\n\nok you can close this now',
});

// ───────────────────────── Music player ─────────────────────────
// Songs live in music/, covers in covers/. Add a line here to add a song.
const Music = (() => {
    const SONGS = [
        { title: 'words words words', artist: 'Bo Burnham', file: 'music/words words words.mp3', cover: 'covers/words-words-words.jpg' },
        { title: 'Flying Model Rockets', artist: 'The Front Bottoms', file: 'music/03 Flying Model Rockets (1).mp3', cover: 'covers/flying-model-rockets.jpg' },
        { title: 'Duck or ape', artist: 'Roar', file: 'music/Duck or ape.mp3', cover: 'covers/duck-or-ape.jpg' },
        { title: 'Legit Tattoo gun', artist: 'The Front Bottoms', file: 'music/Legit Tattoo gun.mp3', cover: 'covers/legit-tattoo-gun.jpg' },
        { title: 'Fuck Jobs', artist: 'The Front Bottoms', file: 'music/Fuck Jobs.mp3', cover: 'covers/fuck-jobs.jpg' },
    ];

    // Pixel glyphs for the transport buttons ("x" = one pixel).
    const glyph = (rows) => {
        let rects = '';
        rows.forEach((row, y) => [...row].forEach((c, x) => {
            if (c === 'x') rects += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
        }));
        return `<svg viewBox="0 0 ${rows[0].length} ${rows.length}" width="${rows[0].length}" height="${rows.length}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
    };
    const G = {
        prev: glyph(['xx....x', 'xx...xx', 'xx..xxx', 'xx.xxxx', 'xx..xxx', 'xx...xx', 'xx....x']),
        play: glyph(['x.....', 'xx....', 'xxx...', 'xxxx..', 'xxxxx.', 'xxxx..', 'xxx...', 'xx....', 'x.....']),
        pause: glyph(['xx..xx', 'xx..xx', 'xx..xx', 'xx..xx', 'xx..xx', 'xx..xx', 'xx..xx']),
        stop: glyph(['xxxxxxx', 'xxxxxxx', 'xxxxxxx', 'xxxxxxx', 'xxxxxxx', 'xxxxxxx', 'xxxxxxx']),
        next: glyph(['x....xx', 'xx...xx', 'xxx..xx', 'xxxx.xx', 'xxx..xx', 'xx...xx', 'x....xx']),
    };

    const audio = new Audio();
    audio.preload = 'metadata';
    const durations = SONGS.map(() => NaN);
    let index = 0;
    let shuffle = Store.get('shuffle', false);
    let started = false;     // music has started at least once
    let unlockedAt = 0;      // when the first click started it
    let ui = null;           // the open player's elements, or null when closed
    let ctx = null;
    let analyser = null;
    let gain = null;
    let freq = null;
    let tickerOffset = 0;
    const peaks = [];

    const fmt = (s) => {
        if (!isFinite(s)) return '--:--';
        s = Math.floor(s);
        return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    };

    // Read every song's length up front so the playlist can show it.
    SONGS.forEach((song, i) => {
        const probe = new Audio();
        probe.preload = 'metadata';
        probe.addEventListener('loadedmetadata', () => {
            durations[i] = probe.duration;
            if (ui) ui.items[i].querySelector('.mp-len').textContent = fmt(probe.duration);
        });
        probe.src = encodeURI(song.file);
    });

    function setVolume(v) {
        Store.set('volume', v);
        if (gain) gain.gain.value = v;
        else audio.volume = v;
        if (ui) ui.vol.value = Math.round(v * 100);
    }

    // The spectrum needs Web Audio, which browsers only allow after a click.
    // Opened straight from a file (file://) it would mute the music, so it's skipped there.
    function setupAudioGraph() {
        if (ctx || location.protocol === 'file:') return;
        try {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
            const source = ctx.createMediaElementSource(audio);
            analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            analyser.smoothingTimeConstant = 0.7;
            gain = ctx.createGain();
            source.connect(analyser);
            analyser.connect(gain);
            gain.connect(ctx.destination);
            freq = new Uint8Array(analyser.frequencyBinCount);
            audio.volume = 1;
            gain.gain.value = Store.get('volume', 0.8);
            ctx.resume();
        } catch {
            ctx = analyser = gain = null;
        }
    }

    // Called on the first click or key press anywhere in catOS.
    function unlock() {
        setupAudioGraph();
        if (ctx && ctx.state === 'suspended') ctx.resume();
        if (!started) {
            started = true;
            unlockedAt = performance.now();
            audio.play().catch(() => {});
        }
    }

    // Some browsers allow sound right away. Try it; if not, the first click starts it.
    function tryAutoplay() {
        audio.play().then(() => (started = true)).catch(() => {});
    }

    function load(i, play) {
        index = (i + SONGS.length) % SONGS.length;
        audio.src = encodeURI(SONGS[index].file);
        tickerOffset = 0;
        if (play) audio.play().catch(() => {});
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: SONGS[index].title,
                artist: SONGS[index].artist,
                artwork: [{ src: SONGS[index].cover, type: 'image/jpeg' }],
            });
        }
        render();
    }

    function next() {
        if (shuffle && SONGS.length > 1) {
            let n;
            do n = Math.floor(Math.random() * SONGS.length); while (n === index);
            load(n, true);
        } else load(index + 1, true);
    }

    function prev() {
        if (audio.currentTime > 3) audio.currentTime = 0;
        else load(index - 1, true);
    }

    function play() {
        if (performance.now() - unlockedAt < 600) return; // this click already started the music
        audio.play().catch(() => {});
    }

    function stop() {
        audio.pause();
        audio.currentTime = 0;
    }

    function render() {
        if (!ui) return;
        const song = SONGS[index];
        ui.cover.src = song.cover;
        ui.cover.alt = `${song.title} cover`;
        ui.artist.textContent = song.artist || 'Unknown artist';
        ui.state.textContent = audio.paused ? (audio.currentTime > 0 ? 'PAUSED' : 'STOPPED') : 'PLAYING';
        ui.playBtn.classList.toggle('on', !audio.paused);
        ui.pauseBtn.classList.toggle('on', audio.paused && audio.currentTime > 0);
        ui.shuffle.checked = shuffle;
        ui.items.forEach((li, i) => {
            li.classList.toggle('current', i === index);
            li.querySelector('.mp-mark').textContent = i === index && !audio.paused ? '▶' : '';
        });
        renderTime();
    }

    function renderTime() {
        if (!ui || ui.seeking) return;
        ui.time.textContent = fmt(audio.currentTime);
        ui.bar.value = audio.duration ? (audio.currentTime / audio.duration) * 1000 : 0;
    }

    // The scrolling song title in the display.
    function tick() {
        if (!ui) return;
        const song = SONGS[index];
        const text = started
            ? `${index + 1}. ${song.title}${song.artist ? ' - ' + song.artist : ''}  ***  `
            : 'CLICK ANYWHERE TO START THE MUSIC  ***  ';
        const width = Math.max(10, Math.floor(ui.ticker.clientWidth / 7.2));
        const loop = text.repeat(Math.ceil(width / text.length) + 1);
        ui.ticker.textContent = loop.substr(tickerOffset % text.length, width);
        tickerOffset += 1;
    }

    // Stepped LED spectrum with falling peak caps.
    function drawSpectrum(t) {
        if (!ui) return;
        requestAnimationFrame(drawSpectrum);
        const c = ui.spectrum;
        const w = c.clientWidth;
        const h = c.clientHeight;
        if (!w || !h) return;
        if (c.width !== w || c.height !== h) {
            c.width = w;
            c.height = h;
        }
        const g = c.getContext('2d');
        g.fillStyle = '#000';
        g.fillRect(0, 0, w, h);
        const cols = 19;
        const colW = Math.floor((w - (cols - 1)) / cols);
        const rows = Math.floor(h / 3);
        const playing = !audio.paused;
        if (analyser && playing) analyser.getByteFrequencyData(freq);
        for (let i = 0; i < cols; i++) {
            let v;
            if (analyser && playing) v = freq[Math.min(freq.length - 1, Math.floor(i * 1.25))] / 255;
            else if (playing) v = 0.45 + 0.35 * Math.sin(t / 210 + i * 0.7) * Math.sin(t / 530 + i * 0.3);
            else v = 0;
            const lit = Math.round(v * rows);
            peaks[i] = Math.max(lit, (peaks[i] || 0) - 0.25);
            const x = i * (colW + 1);
            for (let r = 0; r < lit; r++) {
                const f = r / rows;
                g.fillStyle = f > 0.8 ? '#ff3030' : f > 0.55 ? '#ffd400' : '#29d64a';
                g.fillRect(x, h - (r + 1) * 3, colW, 2);
            }
            if (peaks[i] >= 1) {
                g.fillStyle = '#c8c8c8';
                g.fillRect(x, h - Math.ceil(peaks[i]) * 3, colW, 1);
            }
        }
    }

    audio.addEventListener('timeupdate', renderTime);
    audio.addEventListener('loadedmetadata', renderTime);
    audio.addEventListener('play', render);
    audio.addEventListener('pause', render);
    audio.addEventListener('ended', next);
    if ('mediaSession' in navigator) {
        // Lets the keyboard's media keys and the Windows media popup control catOS.
        navigator.mediaSession.setActionHandler('play', () => audio.play());
        navigator.mediaSession.setActionHandler('pause', () => audio.pause());
        navigator.mediaSession.setActionHandler('nexttrack', next);
        navigator.mediaSession.setActionHandler('previoustrack', prev);
    }
    audio.volume = Store.get('volume', 0.8);
    load(0, false);

    function open(content) {
        content.classList.add('player');
        content.innerHTML = `
            <div class="mp-top">
                <div class="mp-cover sunken"><img alt=""></div>
                <div class="mp-lcd sunken">
                    <div class="mp-ticker"></div>
                    <div class="mp-row">
                        <span class="mp-time">00:00</span>
                        <span class="mp-meta"><span class="mp-state">STOPPED</span><span class="mp-artist"></span></span>
                    </div>
                    <canvas class="mp-spectrum" aria-hidden="true"></canvas>
                </div>
            </div>
            <input class="mp-seek" type="range" min="0" max="1000" value="0" aria-label="Seek">
            <div class="mp-controls">
                <button class="btn mp-btn" data-act="prev" title="Previous" aria-label="Previous">${G.prev}</button>
                <button class="btn mp-btn" data-act="play" title="Play" aria-label="Play">${G.play}</button>
                <button class="btn mp-btn" data-act="pause" title="Pause" aria-label="Pause">${G.pause}</button>
                <button class="btn mp-btn" data-act="stop" title="Stop" aria-label="Stop">${G.stop}</button>
                <button class="btn mp-btn" data-act="next" title="Next" aria-label="Next">${G.next}</button>
                <label class="mp-check"><input type="checkbox" class="mp-shuffle"> Shuffle</label>
                <label class="mp-volume">Vol <input class="mp-vol" type="range" min="0" max="100" aria-label="Volume"></label>
            </div>
            <ol class="mp-list sunken">
                ${SONGS.map((s, i) => `
                <li><button data-i="${i}">
                    <span class="mp-mark"></span>
                    <span class="mp-name">${i + 1}. ${esc(s.title)}</span>
                    <span class="mp-len">${fmt(durations[i])}</span>
                </button></li>`).join('')}
            </ol>`;

        const q = (sel) => content.querySelector(sel);
        ui = {
            cover: q('.mp-cover img'),
            ticker: q('.mp-ticker'),
            time: q('.mp-time'),
            state: q('.mp-state'),
            artist: q('.mp-artist'),
            spectrum: q('.mp-spectrum'),
            bar: q('.mp-seek'),
            playBtn: q('[data-act="play"]'),
            pauseBtn: q('[data-act="pause"]'),
            shuffle: q('.mp-shuffle'),
            vol: q('.mp-vol'),
            items: [...content.querySelectorAll('.mp-list li')],
            seeking: false,
            timer: setInterval(tick, 220),
        };

        q('.mp-controls').addEventListener('click', (e) => {
            const btn = e.target.closest('[data-act]');
            if (!btn) return;
            const act = btn.dataset.act;
            if (act === 'prev') prev();
            if (act === 'play') play();
            if (act === 'pause') audio.pause();
            if (act === 'stop') stop();
            if (act === 'next') next();
        });
        ui.shuffle.addEventListener('change', () => {
            shuffle = ui.shuffle.checked;
            Store.set('shuffle', shuffle);
        });
        // Double-click a song to play it, like old media players.
        ui.items.forEach((li) => {
            const btn = li.querySelector('button');
            btn.addEventListener('dblclick', () => load(Number(btn.dataset.i), true));
            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') load(Number(btn.dataset.i), true);
            });
        });

        // Seeking: move freely while dragging, jump when let go.
        ui.bar.addEventListener('input', () => {
            ui.seeking = true;
            ui.time.textContent = fmt((ui.bar.value / 1000) * (audio.duration || 0));
        });
        ui.bar.addEventListener('change', () => {
            if (audio.duration) audio.currentTime = (ui.bar.value / 1000) * audio.duration;
            ui.seeking = false;
        });
        ui.vol.addEventListener('input', () => setVolume(ui.vol.value / 100));

        setVolume(Store.get('volume', 0.8));
        render();
        tick();
        requestAnimationFrame(drawSpectrum);
    }

    return {
        unlock,
        tryAutoplay,
        stop: () => audio.pause(),
        app: {
            id: 'music',
            name: 'Music',
            icon: ICONS.music,
            width: 380,
            height: 340,
            minWidth: 340,
            minHeight: 300,
            corner: 'bottom-right',
            desktop: true,
            open,
            onClose() {
                audio.pause();
                if (ui) clearInterval(ui.timer);
                ui = null;
            },
        },
    };
})();
WM.register(Music.app);


// ───────────────────────── Paint ─────────────────────────
WM.register({
    id: 'paint',
    name: 'Paint',
    icon: ICONS.paint,
    width: 720,
    height: 540,
    minWidth: 440,
    minHeight: 360,
    desktop: true,
    open(content, win) {
        content.classList.add('paint');
        const TOOLS = [
            { id: 'pencil', name: 'Pencil', svg: '<path d="M2 14l1-4 8-8 3 3-8 8z" fill="#f4c542" stroke="#000"/><path d="M2 14l1-4 3 3z" fill="#000"/>' },
            { id: 'brush', name: 'Brush', svg: '<path d="M12 2l2 2-6 6-2-2z" fill="#a0522d" stroke="#000"/><path d="M6 8l2 2c0 2.5-2.5 4.5-6.5 4 1-1 1-2 1-3 0-2 1.5-3 3.5-3z" fill="#000"/>' },
            { id: 'eraser', name: 'Eraser', svg: '<path d="M2 10l6-6 6 6-4 4H6z" fill="#ff9ec7" stroke="#000"/><path d="M6 14h8" stroke="#000"/>' },
            { id: 'fill', name: 'Fill', svg: '<path d="M2.5 7.5l5-5 6 6-5 5z" fill="#c0c0c0" stroke="#000"/><path d="M13 9.5c1 1.8 2 3 2 4a1 1 0 0 1-2 0z" fill="#0060ff"/>' },
            { id: 'line', name: 'Line', svg: '<path d="M2 14L14 2" stroke="#000" stroke-width="2"/>' },
            { id: 'rect', name: 'Rectangle', svg: '<rect x="2.5" y="4.5" width="11" height="8" fill="none" stroke="#000"/>' },
            { id: 'ellipse', name: 'Ellipse', svg: '<ellipse cx="8" cy="8.5" rx="6" ry="4.5" fill="none" stroke="#000"/>' },
            { id: 'picker', name: 'Pick colour', svg: '<path d="M10 2l4 4-2 2-1-1-6 6H3v-2l6-6-1-1z" fill="#c0c0c0" stroke="#000"/>' },
        ];
        const SIZES = [1, 3, 6, 10];
        const PALETTE = [
            '#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080', '#808040', '#004040', '#0080ff', '#004080', '#8000ff', '#804000',
            '#ffffff', '#c0c0c0', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ffff80', '#00ff80', '#80ffff', '#8080ff', '#ff0080', '#ff8040',
        ];

        content.innerHTML = `
            <div class="pt-bar">
                <button class="btn" data-act="new">New</button>
                <button class="btn" data-act="undo">Undo</button>
                <button class="btn" data-act="save">Save</button>
            </div>
            <div class="pt-tools">
                <div class="pt-toolgrid">
                    ${TOOLS.map((t) => `<button class="btn pt-tool" data-tool="${t.id}" title="${t.name}" aria-label="${t.name}">
                        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">${t.svg}</svg></button>`).join('')}
                </div>
                <div class="pt-sizes sunken">
                    ${SIZES.map((s) => `<button class="pt-size" data-size="${s}" aria-label="Size ${s}"><i style="height:${Math.max(1, s)}px"></i></button>`).join('')}
                </div>
            </div>
            <div class="pt-area sunken"><canvas class="pt-canvas" width="640" height="400"></canvas></div>
            <div class="pt-palette">
                <div class="pt-current sunken" title="Front and back colour"><i class="pt-bgc"></i><i class="pt-fgc"></i></div>
                <div class="pt-colors">${PALETTE.map((c) => `<button class="pt-color" style="background:${c}" data-c="${c}" aria-label="Colour ${c}"></button>`).join('')}</div>
            </div>
            <div class="statusbar"><span class="pt-status"></span><span class="pt-pos"></span></div>`;

        const q = (sel) => content.querySelector(sel);
        const canvas = q('.pt-canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const W = canvas.width;
        const H = canvas.height;
        let tool = 'pencil';
        let size = 3;
        let fg = '#000000';
        let bg = '#ffffff';
        let drawing = null;
        let snapshot = null;
        const undo = [];

        const status = q('.pt-status');
        const HELP = 'Left click uses the front colour, right click the back colour.';

        function showTool() {
            content.querySelectorAll('.pt-tool').forEach((b) => b.classList.toggle('pressed', b.dataset.tool === tool));
            content.querySelectorAll('.pt-size').forEach((b) => b.classList.toggle('on', Number(b.dataset.size) === size));
            status.textContent = `${TOOLS.find((t) => t.id === tool).name}. ${HELP}`;
        }
        function showColours() {
            q('.pt-fgc').style.background = fg;
            q('.pt-bgc').style.background = bg;
        }
        function blank() {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, W, H);
        }
        function pushUndo() {
            undo.push(ctx.getImageData(0, 0, W, H));
            if (undo.length > 25) undo.shift();
        }

        const pos = (e) => {
            const r = canvas.getBoundingClientRect();
            return {
                x: Math.floor(((e.clientX - r.left) * W) / r.width),
                y: Math.floor(((e.clientY - r.top) * H) / r.height),
            };
        };

        // Pixel-perfect drawing: square stamps along Bresenham lines, no blur.
        function stamp(x, y, s, colour) {
            ctx.fillStyle = colour;
            const half = Math.floor(s / 2);
            ctx.fillRect(x - half, y - half, s, s);
        }
        function line(x0, y0, x1, y1, s, colour) {
            const dx = Math.abs(x1 - x0);
            const dy = -Math.abs(y1 - y0);
            const sx = x0 < x1 ? 1 : -1;
            const sy = y0 < y1 ? 1 : -1;
            let err = dx + dy;
            for (;;) {
                stamp(x0, y0, s, colour);
                if (x0 === x1 && y0 === y1) break;
                const e2 = 2 * err;
                if (e2 >= dy) { err += dy; x0 += sx; }
                if (e2 <= dx) { err += dx; y0 += sy; }
            }
        }
        function rect(a, b, s, colour) {
            line(a.x, a.y, b.x, a.y, s, colour);
            line(b.x, a.y, b.x, b.y, s, colour);
            line(b.x, b.y, a.x, b.y, s, colour);
            line(a.x, b.y, a.x, a.y, s, colour);
        }
        function ellipse(a, b, s, colour) {
            const cx = (a.x + b.x) / 2;
            const cy = (a.y + b.y) / 2;
            const rx = Math.abs(b.x - a.x) / 2;
            const ry = Math.abs(b.y - a.y) / 2;
            const steps = Math.max(24, Math.ceil((rx + ry) * 3));
            let last = null;
            for (let i = 0; i <= steps; i++) {
                const t = (i / steps) * Math.PI * 2;
                const p = { x: Math.round(cx + rx * Math.cos(t)), y: Math.round(cy + ry * Math.sin(t)) };
                if (last) line(last.x, last.y, p.x, p.y, s, colour);
                last = p;
            }
        }
        function floodFill(x, y, colour) {
            const img = ctx.getImageData(0, 0, W, H);
            const d = img.data;
            const start = (y * W + x) * 4;
            const target = [d[start], d[start + 1], d[start + 2], d[start + 3]];
            const n = parseInt(colour.slice(1), 16);
            const rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
            if (target[0] === rgb[0] && target[1] === rgb[1] && target[2] === rgb[2] && target[3] === 255) return;
            const same = (i) => d[i] === target[0] && d[i + 1] === target[1] && d[i + 2] === target[2] && d[i + 3] === target[3];
            const stack = [[x, y]];
            while (stack.length) {
                let [cx, cy] = stack.pop();
                let i = (cy * W + cx) * 4;
                while (cx >= 0 && same(i)) { cx--; i -= 4; }
                cx++;
                i += 4;
                let up = false;
                let down = false;
                while (cx < W && same(i)) {
                    d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2]; d[i + 3] = 255;
                    if (cy > 0) {
                        if (same(i - W * 4)) { if (!up) { stack.push([cx, cy - 1]); up = true; } } else up = false;
                    }
                    if (cy < H - 1) {
                        if (same(i + W * 4)) { if (!down) { stack.push([cx, cy + 1]); down = true; } } else down = false;
                    }
                    cx++;
                    i += 4;
                }
            }
            ctx.putImageData(img, 0, 0);
        }

        const strokeSize = () => (tool === 'pencil' ? 1 : tool === 'eraser' ? size * 2 + 4 : size);
        const inside = (p) => p.x >= 0 && p.y >= 0 && p.x < W && p.y < H;

        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        canvas.addEventListener('pointerdown', (e) => {
            if (e.button !== 0 && e.button !== 2) return;
            const p = pos(e);
            if (!inside(p)) return;
            const colour = e.button === 2 ? bg : fg;
            if (tool === 'picker') {
                const [r, g, b] = ctx.getImageData(p.x, p.y, 1, 1).data;
                const hex = '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
                if (e.button === 2) bg = hex;
                else fg = hex;
                showColours();
                return;
            }
            pushUndo();
            if (tool === 'fill') {
                floodFill(p.x, p.y, colour);
                return;
            }
            drawing = { start: p, last: p, colour: tool === 'eraser' ? bg : colour };
            canvas.setPointerCapture(e.pointerId);
            if (['line', 'rect', 'ellipse'].includes(tool)) snapshot = ctx.getImageData(0, 0, W, H);
            else stamp(p.x, p.y, strokeSize(), drawing.colour);
        });
        canvas.addEventListener('pointermove', (e) => {
            const p = pos(e);
            q('.pt-pos').textContent = inside(p) ? `${p.x}, ${p.y}` : '';
            if (!drawing) return;
            if (snapshot) {
                ctx.putImageData(snapshot, 0, 0);
                if (tool === 'line') line(drawing.start.x, drawing.start.y, p.x, p.y, size, drawing.colour);
                if (tool === 'rect') rect(drawing.start, p, size, drawing.colour);
                if (tool === 'ellipse') ellipse(drawing.start, p, size, drawing.colour);
            } else {
                line(drawing.last.x, drawing.last.y, p.x, p.y, strokeSize(), drawing.colour);
                drawing.last = p;
            }
        });
        const stopDrawing = () => {
            drawing = null;
            snapshot = null;
        };
        canvas.addEventListener('pointerup', stopDrawing);
        canvas.addEventListener('pointercancel', stopDrawing);
        canvas.addEventListener('pointerleave', () => (q('.pt-pos').textContent = ''));

        content.querySelectorAll('.pt-tool').forEach((b) => b.addEventListener('click', () => {
            tool = b.dataset.tool;
            showTool();
        }));
        content.querySelectorAll('.pt-size').forEach((b) => b.addEventListener('click', () => {
            size = Number(b.dataset.size);
            showTool();
        }));
        content.querySelectorAll('.pt-color').forEach((b) => {
            b.addEventListener('click', () => { fg = b.dataset.c; showColours(); });
            b.addEventListener('contextmenu', (e) => { e.preventDefault(); bg = b.dataset.c; showColours(); });
        });

        function doUndo() {
            if (undo.length) ctx.putImageData(undo.pop(), 0, 0);
        }
        q('.pt-bar').addEventListener('click', (e) => {
            const act = e.target.closest('[data-act]')?.dataset.act;
            if (act === 'new') { pushUndo(); blank(); }
            if (act === 'undo') doUndo();
            if (act === 'save') {
                canvas.toBlob((blob) => {
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = 'cat-painting.png';
                    a.click();
                    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
                });
            }
        });

        // Ctrl+Z undoes, but only while Paint is the window in front.
        win.onKey = (e) => {
            if (WM.focused() === win && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                doUndo();
            }
        };
        document.addEventListener('keydown', win.onKey);

        blank();
        showTool();
        showColours();
    },
    onClose(win) {
        document.removeEventListener('keydown', win.onKey);
    },
});


// ───────────────────────── Cat Pics ─────────────────────────
WM.register({
    id: 'cats',
    name: 'Cat Pics',
    icon: ICONS.cats,
    width: 440,
    height: 440,
    desktop: true,
    open(content) {
        content.classList.add('cats');
        content.innerHTML = `
            <div class="cat-frame sunken">
                <img class="cat-img" alt="A random cat">
                <p class="cat-msg">Finding a cat...</p>
            </div>
            <div class="cat-bar"><button class="btn cat-next">Next cat &gt;</button></div>
            <div class="statusbar"><span class="cat-status">Cats from thecatapi.com</span></div>`;
        const img = content.querySelector('.cat-img');
        const msg = content.querySelector('.cat-msg');
        const btn = content.querySelector('.cat-next');
        const status = content.querySelector('.cat-status');

        async function nextCat() {
            btn.disabled = true;
            msg.textContent = 'Finding a cat...';
            msg.hidden = false;
            img.classList.remove('shown');
            try {
                const res = await fetch('https://api.thecatapi.com/v1/images/search');
                const [cat] = await res.json();
                img.onload = () => {
                    msg.hidden = true;
                    img.classList.add('shown');
                    btn.disabled = false;
                    status.textContent = `${cat.width} x ${cat.height}`;
                };
                img.onerror = () => {
                    msg.textContent = "That cat wouldn't load. Try another one.";
                    btn.disabled = false;
                };
                img.src = cat.url;
            } catch {
                msg.textContent = "Couldn't reach the cat server. Check your internet and try again.";
                btn.disabled = false;
            }
        }
        btn.addEventListener('click', nextCat);
        nextCat();
    },
});


// ───────────────────────── Settings (Display Properties) ─────────────────────────
WM.register({
    id: 'settings',
    name: 'Display Properties',
    icon: ICONS.settings,
    width: 360,
    height: 400,
    minWidth: 320,
    minHeight: 360,
    open(content, win) {
        content.classList.add('settings');
        const options = [
            { id: 'img_1.png', label: 'Grass cat' },
            { id: 'img.png', label: 'Blanket cat' },
            { id: 'teal', label: 'Teal' },
            { id: 'solid', label: 'Midnight' },
        ];
        content.innerHTML = `
            <div class="set-monitor"><div class="set-screen sunken"></div><div class="set-neck"></div><div class="set-base"></div></div>
            <fieldset class="set-group">
                <legend>Wallpaper</legend>
                <select class="set-list sunken" size="4" aria-label="Wallpaper">
                    ${options.map((o) => `<option value="${o.id}">${o.label}</option>`).join('')}
                </select>
            </fieldset>
            <div class="set-buttons">
                <button class="btn" data-act="ok">OK</button>
                <button class="btn" data-act="cancel">Cancel</button>
                <button class="btn" data-act="apply">Apply</button>
            </div>`;
        const list = content.querySelector('.set-list');
        const screen = content.querySelector('.set-screen');
        const original = Store.get('wallpaper', 'img_1.png');
        list.value = original;
        const preview = () => {
            const colour = WALLPAPER_COLOURS[list.value];
            screen.style.background = colour || `center / cover url("${list.value}")`;
        };
        list.addEventListener('change', preview);
        content.querySelector('.set-buttons').addEventListener('click', (e) => {
            const act = e.target.closest('[data-act]')?.dataset.act;
            if (act === 'apply' || act === 'ok') setWallpaper(list.value);
            if (act === 'cancel') setWallpaper(original);
            if (act === 'ok' || act === 'cancel') WM.close(win.id);
        });
        preview();
    },
});
