/* ============================================================
   TIME — Birthday Experience  ·  script.js
   ============================================================ */
'use strict';

/* ── Helpers ──────────────────────────────────────────────── */
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);
const wait = ms => new Promise(r => setTimeout(r, ms));

/* ── Scene Engine ─────────────────────────────────────────── */
let activeScene = $('s-opening');

async function goTo(nextId) {
    const next = $(nextId);
    activeScene.classList.add('fade-out');
    await wait(1100);
    activeScene.classList.remove('active', 'fade-out');
    activeScene = next;
    next.classList.add('active');
    // Hide sparkles on cream/light scenes
    const sparkleCanvas = $('sparkle-canvas');
    if (nextId === 's-flower') {
        sparkleCanvas.classList.add('hidden');
    } else {
        sparkleCanvas.classList.remove('hidden');
    }
    await wait(50);
}

function fadeIn(el, slow = false) {
    el.classList.remove('op-0');
    el.classList.add(slow ? 'fade-in-slow' : 'fade-in');
}

/* ── Sparkle / Glinting Stars ─────────────────────────────── */
(function initSparkles() {
    const canvas = $('sparkle-canvas');
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function makeSpark() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            maxR: 0.8 + Math.random() * 1.4,
            maxArm: 3 + Math.random() * 7,
            r: 0, armLen: 0, alpha: 0,
            phase: 'in',
            lifeIn: 10 + Math.random() * 20 | 0,
            lifeOut: 16 + Math.random() * 30 | 0,
            age: 0,
            delay: Math.random() * 180 | 0,
        };
    }

    const sparks = Array.from({ length: 25 }, makeSpark);

    function drawSpark(x, y, r, arm, alpha) {
        ctx.save();
        ctx.lineCap = 'round';
        // 4-point cross — thin white lines
        ctx.lineWidth = Math.max(r * 0.6, 0.5);
        ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
        ctx.beginPath(); ctx.moveTo(x - arm, y); ctx.lineTo(x + arm, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, y - arm); ctx.lineTo(x, y + arm); ctx.stroke();
        // Tiny center dot
        ctx.fillStyle = `rgba(255,255,255,${Math.min(alpha * 1.2, 1)})`;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    function tick() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        sparks.forEach((s, i) => {
            if (s.delay > 0) { s.delay--; return; }
            s.age++;
            if (s.phase === 'in') {
                const p = Math.min(s.age / s.lifeIn, 1);
                const e = 1 - (1 - p) * (1 - p);
                s.alpha = e * 0.7;   // max alpha = 0.7
                s.r = e * s.maxR;
                s.armLen = e * s.maxArm;
                if (p >= 1) { s.phase = 'out'; s.age = 0; }
            } else {
                const p = Math.min(s.age / s.lifeOut, 1);
                s.alpha = (1 - p * p) * 0.7;
                s.r = (1 - p) * s.maxR;
                s.armLen = (1 - p) * s.maxArm;
                if (p >= 1) { Object.assign(sparks[i], makeSpark()); return; }
            }
            drawSpark(s.x, s.y, s.r, s.armLen, s.alpha);
        });
        requestAnimationFrame(tick);
    }
    tick();
}());





/* ══════════════════════════════════════════════════════════════
   MUSIC — Real MP3 if available, synthesizer as fallback
   ★ Drop your romantic instrumental at:  assets/audio/music.mp3
     Recommended: "River Flows In You" — Yiruma (instrumental)
                  or any soft romantic piano from pixabay.com
══════════════════════════════════════════════════════════════ */
const musicToggle = $('music-toggle');
let musicPlaying = false;
let musicGain = null;
let musicScheduler = null;
let usingRealSong = false;

// Hidden audio element created in JS (no HTML needed)
const bgAudio = new Audio();
bgAudio.loop = true;

function startMusic() {
    fadeIn(musicToggle);
    musicToggle.textContent = '♪';

    // ── Try real MP3 first ─────────────────────────────────────
    bgAudio.src = 'assets/music/alexgrohl-the-romantic-piano-329088.mp3';
    bgAudio.volume = 0;

    bgAudio.addEventListener('canplaythrough', function onReady() {
        bgAudio.removeEventListener('canplaythrough', onReady);
        bgAudio.play().catch(() => { });
        usingRealSong = true;
        musicPlaying = true;
        // Fade in volume over 3s
        let v = 0;
        const fi = setInterval(() => {
            v = Math.min(v + 0.012, 0.55);
            bgAudio.volume = v;
            if (v >= 0.55) clearInterval(fi);
        }, 80);
    }, { once: true });

    bgAudio.addEventListener('error', function onError() {
        bgAudio.removeEventListener('error', onError);
        // MP3 not found — start synthesizer fallback
        startSynthMusic();
    }, { once: true });

    // Trigger load attempt
    bgAudio.load();
}

musicToggle.addEventListener('click', function () {
    if (usingRealSong) {
        if (musicPlaying) { bgAudio.pause(); musicToggle.classList.add('muted'); }
        else { bgAudio.play().catch(() => { }); musicToggle.classList.remove('muted'); }
        musicPlaying = !musicPlaying;
        return;
    }
    if (!musicGain) return;
    const ctx = getCtx();
    if (musicPlaying) {
        musicGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
        musicPlaying = false; musicToggle.classList.add('muted');
    } else {
        musicGain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.6);
        musicPlaying = true; musicToggle.classList.remove('muted');
    }
});

/* ─ Synthesizer fallback — rich piano harmonics, romantic melody ─ */
function startSynthMusic() {
    const ctx = getCtx();

    musicGain = ctx.createGain();
    musicGain.gain.value = 0;
    musicGain.connect(ctx.destination);

    // Warm reverb via feedback delay
    const dly = ctx.createDelay(2.0);
    const dfb = ctx.createGain();
    const dwt = ctx.createGain();
    dly.delayTime.value = 0.32; dfb.gain.value = 0.3; dwt.gain.value = 0.28;
    dly.connect(dfb); dfb.connect(dly); dly.connect(dwt); dwt.connect(musicGain);

    // Multi-harmonic piano note (sine at 1x, 2x, 3x, 4x)
    function pianoNote(freq, start, dur, vol) {
        vol = vol || 0.12;
        [1, 2, 3, 4].forEach(function (h, i) {
            const vols = [1, 0.45, 0.18, 0.07];
            const osc = ctx.createOscillator();
            const env = ctx.createGain();
            osc.connect(env);
            env.connect(musicGain);
            env.connect(dly);
            osc.type = 'sine';
            osc.frequency.value = freq * h;
            const v = vol * vols[i];
            env.gain.setValueAtTime(0, start);
            env.gain.linearRampToValueAtTime(v, start + 0.012); // crisp attack
            env.gain.setValueAtTime(v * 0.55, start + 0.08);    // piano decay
            env.gain.exponentialRampToValueAtTime(0.0001, start + dur);
            osc.start(start);
            osc.stop(start + dur + 0.06);
        });
    }

    // Slow romantic: 52 BPM, Am → F → C → G
    const BEAT = 60 / 52;
    const BAR = BEAT * 4;

    // Chord roots + voicings
    const CHORDS = [
        { bass: 110, mid: [220, 261.63, 329.63] }, // Am
        { bass: 87.31, mid: [174.61, 220, 261.63] }, // F
        { bass: 65.41, mid: [130.81, 261.63, 392] }, // C
        { bass: 98, mid: [196, 246.94, 329.63] }, // G
    ];

    // Romantic melody (slow descending A minor — "A Thousand Years"-like feel)
    // beat positions and note freqs across a 16-beat loop
    const MEL = [
        { b: 0, f: 659.26 }, // E5
        { b: 1, f: 587.33 }, // D5
        { b: 2, f: 523.25 }, // C5
        { b: 3, f: 493.88 }, // B4
        { b: 4, f: 440 }, // A4
        { b: 5, f: 392 }, // G4
        { b: 6, f: 440 }, // A4
        { b: 7, f: 523.25 }, // C5
        { b: 8, f: 587.33 }, // D5
        { b: 9, f: 523.25 }, // C5
        { b: 10, f: 440 }, // A4
        { b: 11, f: 392 }, // G4
        { b: 12, f: 349.23 }, // F4
        { b: 13, f: 392 }, // G4
        { b: 14, f: 440 }, // A4
        { b: 15, f: 493.88 }, // B4
    ];

    function scheduleBar(t, idx) {
        const ch = CHORDS[idx % CHORDS.length];

        // Sustained bass
        pianoNote(ch.bass, t, BAR * 0.9, 0.10);

        // Arpeggio (spread across first 1.5 beats)
        ch.mid.forEach(function (freq, i) {
            pianoNote(freq, t + i * BEAT * 0.3, BAR * 0.78, 0.09);
        });

        // Melody every 4-bar loop restart
        if (idx % CHORDS.length === 0) {
            MEL.forEach(function (m) {
                pianoNote(m.f, t + m.b * BEAT, BEAT * 0.8, 0.08);
            });
        }
    }

    let bar = 0, nextT = ctx.currentTime + 0.1;
    function scheduler() {
        while (nextT < ctx.currentTime + 2.5) {
            scheduleBar(nextT, bar);
            nextT += BAR; bar++;
        }
    }
    scheduler();
    musicScheduler = setInterval(scheduler, 600);

    musicGain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 3.5);
    musicPlaying = true;
    musicToggle.classList.remove('muted');
}




/* ══════════════════════════════════════════════════════════════
   AUDIO — Synthesised ticking clock (no file needed)
══════════════════════════════════════════════════════════════ */
let audioCtx = null;
let tickTimer = null;
let tickBpm = 60;

function getCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}

function playTick(vol = 0.12, pitch = 820) {
    try {
        const ctx = getCtx();
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.connect(env); env.connect(ctx.destination);
        osc.type = 'sine'; osc.frequency.value = pitch;
        env.gain.setValueAtTime(vol, ctx.currentTime);
        env.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.055);
        osc.start(); osc.stop(ctx.currentTime + 0.06);
    } catch (_) { }
}

function startTicking(bpm = 60) {
    stopTicking(); tickBpm = bpm;
    playTick();
    tickTimer = setInterval(() => playTick(), 60000 / bpm);
}

function stopTicking() {
    if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
}

async function rampTicking() {
    let bpm = tickBpm;
    while (bpm < 160) {
        bpm = Math.min(bpm + 10, 160);
        stopTicking(); playTick(0.18, 1050);
        tickTimer = setInterval(() => playTick(0.18, 1050), 60000 / bpm);
        await wait(400);
    }
}

/* ══════════════════════════════════════════════════════════════
   SCENE 1 — OPENING
══════════════════════════════════════════════════════════════ */
let openingStarted = false;

async function runOpening() {
    if (openingStarted) return;
    openingStarted = true;
    // startTicking(60);

    const ids = ['sq1', 'sq2', 'sq3', 'sq4'];
    for (const id of ids) {
        await wait(700);
        $(id).classList.add('vis');
        await wait(2400);
    }
    await wait(600);
    fadeIn($('btn-enter'));
}

document.addEventListener('click', function initAudio() {
    runOpening();
    document.removeEventListener('click', initAudio);
}, { once: true });

window.addEventListener('load', () => {
    setTimeout(async () => {
        if (!openingStarted) {
            try {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                if (audioCtx.state !== 'suspended') runOpening();
                else document.addEventListener('click', () => audioCtx.resume().then(() => runOpening()), { once: true });
            } catch (_) { }
        }
    }, 200);
});

$('btn-enter').addEventListener('click', async () => {
    startMusic();              // Music begins on first real interaction
    await goTo('s-beginning');
    runBeginning();
});

/* ══════════════════════════════════════════════════════════════
   SCENE 2 — THE BEGINNING
══════════════════════════════════════════════════════════════ */
async function runBeginning() {
    await wait(400);
    $('b1').classList.add('vis');
    $('b2').classList.add('vis');
}

$('btn-c1').addEventListener('click', async () => {
    // Scene 2 → Scene 3 (Test of Time)  – gift video is now the secret section at the end
    await goTo('s-timeline');
    runTimeline();
});


/* ══════════════════════════════════════════════════════════════
   SCENE 4 — TEST OF TIME
══════════════════════════════════════════════════════════════ */
const tlLines = $$('.tl-line');
let tlCurrent = 0;
let tlDone = false;

async function runTimeline() {
    await wait(400);
    showNextLine();
}

function showNextLine() {
    if (tlDone) return;
    if (tlCurrent < tlLines.length) {
        tlLines[tlCurrent].classList.add('vis');
        tlCurrent++;
        if (tlCurrent === tlLines.length) {
            tlDone = true;
            $('tap-hint').classList.add('hidden');
            $('s-timeline').classList.add('golden-glow');
            wait(1400).then(() => {
                const btn = $('btn-c3');
                btn.classList.remove('op-0');
                fadeIn(btn);
            });
        }
    }
}

$('s-timeline').addEventListener('click', () => { if (!tlDone) showNextLine(); });
$('btn-c3').addEventListener('click', async (e) => {
    e.stopPropagation();
    await goTo('s-memories');
    runMemories();
});

/* ══════════════════════════════════════════════════════════════
   SCENE 5 — OUR MEMORIES (Cinematic Photo Gallery)

   ★ EDIT HERE: Add your photos and captions.
     Drop photo files into:  assets/photos/
     Then update the array below.
══════════════════════════════════════════════════════════════ */
const MEMORIES = [
    { src: 'assets/photos/mem-1.jpeg', caption: 'The beginning of everything.' },
    { src: 'assets/photos/mem-2.jpeg', caption: 'A small moment I never want to forget.' },
    { src: 'assets/photos/mem-3.jpeg', caption: 'You, accompany me home. My favourite version.' },
    { src: 'assets/photos/mem-4.jpeg', caption: 'We stayed with the cats 🐱 for a while.' },
    { src: 'assets/photos/mem-5.jpeg', caption: 'The moment when you will leave for Jakarta again' },
    { src: 'assets/photos/mem-6.jpeg', caption: 'My birthday moments, did ATV ride.' },
    { src: 'assets/photos/mem-7.jpeg', caption: 'You sleep in my arms 🤍' },
    { src: 'assets/photos/mem-8.jpeg', caption: 'I took a photo of you when you were sleeping 😴' },
    { src: 'assets/photos/mem-9.jpeg', caption: 'You come to my hotel and surprised me to celebrate my graduation 🥹' },
    { src: 'assets/photos/mem-10.jpeg', caption: "Look at the smile, we're happy right? 🥹" },
    { src: 'assets/photos/mem-11.jpeg', caption: "I love you so much 🤍" },
    // Add more: { src: 'assets/photos/mem-6.jpg', caption: 'Your caption here.' },
];

let memIndex = 0;
let memSlides = [];
let memDots = [];
let memAutoTimer = null;

function buildMemoryGallery() {
    const slidesEl = $('mem-slides');
    const dotsEl = $('mem-dots');
    slidesEl.innerHTML = '';
    dotsEl.innerHTML = '';
    memSlides = [];
    memDots = [];

    MEMORIES.forEach((m, i) => {
        const slide = document.createElement('div');
        slide.className = 'mem-slide';

        const img = new Image();
        img.onload = () => { slide.style.backgroundImage = `url('${m.src}')`; };
        img.onerror = () => {
            const ph = document.createElement('div');
            ph.className = 'mem-slide-ph';
            ph.innerHTML = `📷<small>${m.src}</small>`;
            slide.appendChild(ph);
        };
        img.src = m.src;

        slidesEl.appendChild(slide);
        memSlides.push(slide);

        const dot = document.createElement('button');
        dot.className = 'mem-dot';
        dot.addEventListener('click', () => {
            const dir = i > memIndex ? 'next' : 'prev';
            showMemSlide(i, dir);
        });
        dotsEl.appendChild(dot);
        memDots.push(dot);
    });
}

/* ── Page-turn sound (real book feel) ───────────────────── */
function playPageTurn() {
    try {
        const ctx = getCtx();
        const now = ctx.currentTime;

        // ── Layer 1: Swoosh (page moving through air) ──
        // High-to-low frequency sweep noise — like a page cutting through air
        const swooshDur = 0.22;
        const bufLen = ctx.sampleRate * swooshDur;
        const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

        const swooshSrc = ctx.createBufferSource();
        swooshSrc.buffer = buf;

        // Bandpass sweeps from high (fast flick) to low (slowing down)
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(3800, now);
        bp.frequency.exponentialRampToValueAtTime(700, now + swooshDur);
        bp.Q.value = 1.4;

        const swooshGain = ctx.createGain();
        swooshGain.gain.setValueAtTime(0, now);
        swooshGain.gain.linearRampToValueAtTime(0.28, now + 0.018); // sharp attack
        swooshGain.gain.exponentialRampToValueAtTime(0.0001, now + swooshDur);

        swooshSrc.connect(bp);
        bp.connect(swooshGain);
        swooshGain.connect(ctx.destination);
        swooshSrc.start(now);
        swooshSrc.stop(now + swooshDur + 0.02);

        // ── Layer 2: Thump (page landing on the stack) ──
        // Short low-frequency percussive hit ~70% through the swoosh
        const thumpAt = now + swooshDur * 0.72;
        const thumpOsc = ctx.createOscillator();
        thumpOsc.type = 'sine';
        thumpOsc.frequency.setValueAtTime(130, thumpAt);
        thumpOsc.frequency.exponentialRampToValueAtTime(55, thumpAt + 0.06);

        const thumpGain = ctx.createGain();
        thumpGain.gain.setValueAtTime(0.14, thumpAt);
        thumpGain.gain.exponentialRampToValueAtTime(0.0001, thumpAt + 0.08);

        thumpOsc.connect(thumpGain);
        thumpGain.connect(ctx.destination);
        thumpOsc.start(thumpAt);
        thumpOsc.stop(thumpAt + 0.1);
    } catch (_) { }
}


/* ── Slide transition ────────────────────────────────────── */
let memAnimating = false;

function showMemSlide(idx, dir = 'next') {
    if (memAnimating || idx === memIndex) return;
    memAnimating = true;

    const capEl = $('mem-caption-text');
    const prevIdx = memIndex;

    const enterFrom = dir === 'next' ? 'slide-from-right' : 'slide-from-left';
    const exitTo = dir === 'next' ? 'slide-to-left' : 'slide-to-right';

    // Outgoing slide
    const outSlide = memSlides[prevIdx];
    outSlide.classList.add(exitTo);
    outSlide.addEventListener('animationend', () => {
        outSlide.classList.remove('active', exitTo);
        memAnimating = false;
    }, { once: true });

    // Caption fade out
    capEl.classList.remove('vis');

    // Incoming slide
    memIndex = idx;
    const inSlide = memSlides[idx];
    inSlide.classList.add(enterFrom, 'active');
    inSlide.addEventListener('animationend', () => {
        inSlide.classList.remove(enterFrom);
    }, { once: true });

    // Dots
    memDots.forEach(d => d.classList.remove('active'));
    memDots[idx].classList.add('active');

    // Caption
    capEl.textContent = MEMORIES[idx].caption;
    setTimeout(() => capEl.classList.add('vis'), 220);

    // Page-turn sound
    playPageTurn();

    // Continue button — only on last slide, manual only
    const btn = $('btn-mem-done');
    if (idx === MEMORIES.length - 1) {
        wait(900).then(() => {
            btn.classList.remove('op-0');
            fadeIn(btn);
        });
    } else {
        btn.classList.add('op-0');
        btn.classList.remove('fade-in', 'fade-in-slow');
    }
}

async function runMemories() {
    buildMemoryGallery();
    await wait(300);
    // First slide — silent, no animation
    memSlides[0].classList.add('active');
    memDots[0].classList.add('active');
    const capEl = $('mem-caption-text');
    capEl.textContent = MEMORIES[0].caption;
    setTimeout(() => capEl.classList.add('vis'), 400);
    memIndex = 0;
}

$('mem-prev').addEventListener('click', () => {
    if (memIndex > 0) showMemSlide(memIndex - 1, 'prev');
});
$('mem-next').addEventListener('click', () => {
    if (memIndex < MEMORIES.length - 1) showMemSlide(memIndex + 1, 'next');
});
$('btn-mem-done').addEventListener('click', async () => {
    await goTo('s-flower');
    runFlower();
});

/* ══════════════════════════════════════════════════════════════
   DATE-BASED UNLOCK LOGIC
   25 Feb → show mini ending + unlock input
   26 Feb+ → show full content immediately
══════════════════════════════════════════════════════════════ */
const UNLOCK_DATE = 26;   // ← The date that unlocks the full experience
const BIRTHDAY_MONTH = 2; // February (1-indexed)
const BIRTHDAY_YEAR = 2026;

function getTodayDate() {
    const now = new Date();
    return { day: now.getDate(), month: now.getMonth() + 1, year: now.getFullYear() };
}

function showEnding() {
    // Show the final ending text and the gallery
    const me = $('mini-ending');
    me.classList.remove('op-0');
    fadeIn(me, true);

    setTimeout(() => {
        buildChildGallery();
        const gallery = $('child-gallery');
        gallery.classList.remove('op-0');
        gallery.classList.add('vis');

        // Then automatically open the surprise info modal
        setTimeout(() => {
            $('surprise-overlay').classList.add('open');
        }, 2200);
    }, 1200);
}

// ── SURPRISE MODAL HANDLERS ──

$('surprise-close').addEventListener('click', () => {
    $('surprise-overlay').classList.remove('open');
});

$('surprise-ok').addEventListener('click', () => {
    $('surprise-overlay').classList.remove('open');
});



/* ══════════════════════════════════════════════════════════════
   SCENE 7 — FLOWER FINALE
══════════════════════════════════════════════════════════════ */
async function runFlower() {
    // Soften music for intimate finale
    if (musicPlaying && !usingRealSong && musicGain) {
        musicGain.gain.linearRampToValueAtTime(0.22, getCtx().currentTime + 2);
    }

    // Step 1: Show poetic closing lines (they stagger via CSS transition-delay)
    // data-i="0" → 0s delay, data-i="1" → 0.5s delay, data-i="2" → 1s delay
    // Each takes 0.9s transition → last line fully visible at ~1.9s
    await wait(400);
    $$('.flower-line').forEach(el => el.classList.add('vis'));

    // Step 2: Wait for all three lines to finish (last line: 1s delay + 0.9s transition)
    await wait(2800);

    // Step 3: Flower bloom
    const svg = $('flower-svg');
    svg.classList.remove('op-0');
    svg.classList.add('vis');

    await wait(1600);

    // Step 4: Confetti
    // Step 5: Final content (Text + Gallery)
    showEnding();
}



/* ── Childhood photo gallery ─────────────────────────────── */
/*
   ★ EDIT HERE: Add childhood photo filenames.
     Put files in:  assets/photos/child/
     Add as many as you want — they'll auto-layout.
*/
const CHILD_PHOTOS = [
    { src: 'assets/photos/child/c1.jpeg', label: '' },
    { src: 'assets/photos/child/c2.jpeg', label: '' },
    { src: 'assets/photos/child/c3.jpeg', label: '' },
    { src: 'assets/photos/child/c4.jpeg', label: '' },
    { src: 'assets/photos/child/c5.jpeg', label: '' },
    { src: 'assets/photos/child/c6.jpeg', label: '' },
    { src: 'assets/photos/child/c7.jpeg', label: '' },
    { src: 'assets/photos/child/c8.jpeg', label: '' },
    // Add more: { src: 'assets/photos/child/c9.jpg', label: '' },
];

// Alternating Polaroid tilts — no absolute positioning needed (flex-wrap handles layout)
const TILTS = [-5, 3, -2, 6, -4, 2, -6, 4];   // ★ edit freely

function buildChildGallery() {
    const gallery = $('child-gallery');
    gallery.innerHTML = ''; // clear out old content

    const track = document.createElement('div');
    track.className = 'carousel-track';

    // Create a longer sequence that doesn't just obviously repeat 1-8 immediately.
    // E.g., First 8 photos in order (or slightly shuffled), next 8 randomly shuffled.
    const set1 = [...CHILD_PHOTOS];
    const set2 = [...CHILD_PHOTOS].sort(() => Math.random() - 0.5);

    // Ensure the boundary between set1 and set2 doesn't have identical photos
    if (set1[set1.length - 1] === set2[0]) {
        const temp = set2[0];
        set2[0] = set2[1];
        set2[1] = temp;
    }

    // Combine them to make a 16-photo sequence
    const baseSequence = [...set1, ...set2];

    // Ensure the loop boundary (end to start) doesn't have identical photos
    if (baseSequence[baseSequence.length - 1] === baseSequence[0]) {
        const temp = baseSequence[baseSequence.length - 1];
        baseSequence[baseSequence.length - 1] = baseSequence[baseSequence.length - 2];
        baseSequence[baseSequence.length - 2] = temp;
    }

    // To make an infinite seamless scroll, we must duplicate the ENTIRE sequence once.
    // The CSS animation scrolls exactly from 0 to -50% of the track's width.
    const allPhotosList = [...baseSequence, ...baseSequence];

    // We set a dynamic animation duration based on total length
    // 16 base items * 4 seconds = 64 seconds for a full loop
    track.style.animation = `scrollLeft ${baseSequence.length * 4}s linear infinite`;

    allPhotosList.forEach(function (photo, i) {
        // slight random rotation for a messy/polaroid look
        const rot = TILTS[i % TILTS.length];

        const el = document.createElement('img');
        el.className = 'child-photo';
        el.src = photo.src;
        el.alt = 'Memory';
        el.style.setProperty('--rot', rot + 'deg');

        el.onerror = function () {
            const ph = document.createElement('div');
            ph.className = 'child-photo-ph';
            ph.style.setProperty('--rot', rot + 'deg');
            ph.innerHTML = '📸<small>' + photo.src.split('/').pop() + '</small>';
            el.replaceWith(ph); // replace the broken img with placeholder
        };

        // Append synchronously to maintain EXACT array order
        track.appendChild(el);
    });

    gallery.appendChild(track);
}







/* ── Mini confetti (warm palette) ────────────────────────── */
function startMiniConfetti() {
    const canvas = $('mini-confetti');
    const ctx = canvas.getContext('2d');
    setTimeout(() => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
        const COLORS = ['#D4AF37', '#C87080', '#B5A090', '#E8C8A0', '#9E8878'];
        const pieces = Array.from({ length: 80 }, () => ({
            x: Math.random() * canvas.width,
            y: -10 - Math.random() * canvas.height * 0.5,
            vy: 0.7 + Math.random() * 1.2, vx: (Math.random() - 0.5) * 0.6,
            w: 4 + Math.random() * 6, h: 7 + Math.random() * 5,
            rot: Math.random() * 360, rotV: (Math.random() - 0.5) * 1.5,
            color: COLORS[Math.random() * COLORS.length | 0],
        }));
        function tick() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            pieces.forEach(p => {
                ctx.save(); ctx.globalAlpha = 0.55; ctx.fillStyle = p.color;
                ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180);
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
                p.y += p.vy; p.x += p.vx; p.rot += p.rotV;
                if (p.y > canvas.height + 20) { p.y = -20; p.x = Math.random() * canvas.width; }
            });
            requestAnimationFrame(tick);
        }
        tick();
    }, 80);
}


