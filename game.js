// =====================================================================
// NYAN FLAP — game engine
// =====================================================================

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const W = canvas.width;
const H = canvas.height;

const RAINBOW = ['#ff4d6d', '#ff9f4d', '#ffde59', '#59ff8f', '#4dc9ff', '#b34dff'];

// ---------------------------------------------------------------
// Pixel-art cat sprite, built on a tiny offscreen canvas then
// scaled up with imageSmoothingEnabled=false for a crisp retro look.
// ---------------------------------------------------------------
function buildCatSprite(legUp) {
  const pw = 24, ph = 16;
  const off = document.createElement('canvas');
  off.width = pw; off.height = ph;
  const octx = off.getContext('2d');
  const px = (x, y, w, h, color) => { octx.fillStyle = color; octx.fillRect(x, y, w, h); };

  // pop-tart body
  px(1, 5, 15, 7, '#f4c790');           // tan body
  px(1, 5, 15, 1, '#ff8fc4');           // top pink crust
  px(1, 11, 15, 1, '#ff8fc4');          // bottom pink crust
  px(0, 6, 1, 5, '#ff8fc4');            // left crust cap
  // sprinkles
  px(4, 7, 1, 1, RAINBOW[0]);
  px(7, 9, 1, 1, RAINBOW[2]);
  px(10, 7, 1, 1, RAINBOW[4]);
  px(6, 6, 1, 1, RAINBOW[1]);
  px(9, 10, 1, 1, RAINBOW[5]);

  // head
  px(15, 3, 8, 8, '#fff6e8');
  px(15, 2, 2, 2, '#fff6e8');            // left ear block
  px(21, 2, 2, 2, '#fff6e8');            // right ear block
  px(15, 1, 1, 1, '#ffb3d9');
  px(22, 1, 1, 1, '#ffb3d9');
  // face
  px(17, 6, 1, 1, '#1a1a2e');            // eye
  px(20, 6, 1, 1, '#1a1a2e');            // eye
  px(18, 8, 2, 1, '#ff8fc4');            // mouth/cheek blush
  px(16, 8, 1, 1, '#ffcfe6');
  px(22, 8, 1, 1, '#ffcfe6');

  // legs (animate)
  if (legUp) {
    px(3, 12, 2, 3, '#fff6e8');
    px(11, 12, 2, 2, '#fff6e8');
  } else {
    px(3, 12, 2, 2, '#fff6e8');
    px(11, 12, 2, 3, '#fff6e8');
  }

  return off;
}

const CAT_FRAMES = [buildCatSprite(false), buildCatSprite(true)];

// ---------------------------------------------------------------
// Starfield background
// ---------------------------------------------------------------
const stars = Array.from({ length: 60 }, () => ({
  x: Math.random() * W,
  y: Math.random() * H,
  r: Math.random() * 1.6 + 0.4,
  s: Math.random() * 0.4 + 0.15,
}));

// ---------------------------------------------------------------
// Game state
// ---------------------------------------------------------------
const GRAVITY = 1400;       // px/s^2
const FLAP_VELOCITY = -380; // px/s
const PIPE_GAP = 165;
const PIPE_WIDTH = 56;
const PIPE_SPEED = 150;     // px/s
const PIPE_INTERVAL = 1450; // ms

let state = 'start'; // 'start' | 'playing' | 'over'
let cat, pipes, score, best, lastTime, spawnTimer, animTimer, animFrame, trailWave;

const bestScoreStartEl = document.getElementById('bestScoreStart');
const bestScoreEl = document.getElementById('bestScore');
const finalScoreEl = document.getElementById('finalScore');
const scoreEl = document.getElementById('score');
const hud = document.getElementById('hud');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');

function loadBest() {
  return Number(localStorage.getItem('nyanFlapBest') || 0);
}
function saveBest(v) {
  localStorage.setItem('nyanFlapBest', String(v));
}
best = loadBest();
bestScoreStartEl.textContent = best;

function resetGame() {
  cat = { x: 90, y: H / 2, vy: 0, radius: 10 };
  pipes = [];
  score = 0;
  spawnTimer = 0;
  animTimer = 0;
  animFrame = 0;
  trailWave = 0;
  scoreEl.textContent = '0';
}

function spawnPipe() {
  const margin = 70;
  const gapY = margin + Math.random() * (H - margin * 2 - PIPE_GAP);
  pipes.push({ x: W + PIPE_WIDTH, gapY, passed: false });
}

function flap() {
  if (state === 'start') {
    startGame();
    return;
  }
  if (state === 'playing') {
    cat.vy = FLAP_VELOCITY;
  }
}

function startGame() {
  resetGame();
  state = 'playing';
  startScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
  hud.classList.remove('hidden');
  cat.vy = FLAP_VELOCITY;
}

function endGame() {
  state = 'over';
  hud.classList.add('hidden');
  if (score > best) {
    best = score;
    saveBest(best);
  }
  finalScoreEl.textContent = score;
  bestScoreEl.textContent = best;
  gameOverScreen.classList.remove('hidden');
  resetKaraoke();
}

// ---------------------------------------------------------------
// Update / physics
// ---------------------------------------------------------------
function update(dt) {
  if (state !== 'playing') return;

  cat.vy += GRAVITY * dt;
  cat.y += cat.vy * dt;

  animTimer += dt;
  if (animTimer > 0.12) { animTimer = 0; animFrame = 1 - animFrame; }
  trailWave += dt;

  spawnTimer += dt * 1000;
  if (spawnTimer >= PIPE_INTERVAL) {
    spawnTimer = 0;
    spawnPipe();
  }

  for (const p of pipes) {
    p.x -= PIPE_SPEED * dt;
    if (!p.passed && p.x + PIPE_WIDTH < cat.x) {
      p.passed = true;
      score++;
      scoreEl.textContent = score;
    }
  }
  pipes = pipes.filter(p => p.x > -PIPE_WIDTH);

  // collisions: ceiling / floor
  if (cat.y - cat.radius < 0 || cat.y + cat.radius > H) {
    endGame();
    return;
  }

  // collisions: pipes
  for (const p of pipes) {
    const withinX = cat.x + cat.radius > p.x && cat.x - cat.radius < p.x + PIPE_WIDTH;
    if (withinX) {
      const inGap = cat.y - cat.radius > p.gapY && cat.y + cat.radius < p.gapY + PIPE_GAP;
      if (!inGap) {
        endGame();
        return;
      }
    }
  }
}

// ---------------------------------------------------------------
// Draw
// ---------------------------------------------------------------
function draw() {
  // sky
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#0a0e27');
  grad.addColorStop(1, '#171b3a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // stars
  for (const s of stars) {
    const twinkle = 0.5 + 0.5 * Math.sin(trailWave * 2 + s.x);
    ctx.fillStyle = `rgba(253,253,240,${0.3 + twinkle * 0.5})`;
    ctx.fillRect(s.x, s.y, s.r, s.r);
    if (state === 'playing') {
      s.x -= s.s * 30 * (1 / 60);
      if (s.x < 0) s.x = W;
    }
  }

  if (state !== 'start') {
    // rainbow trail behind the cat
    const bands = RAINBOW.length;
    const bandH = 26 / bands;
    const trailStartX = Math.max(0, cat.x - 240);
    for (let i = 0; i < bands; i++) {
      const wobble = Math.sin(trailWave * 6 + i) * 2;
      ctx.fillStyle = RAINBOW[i];
      ctx.fillRect(trailStartX, cat.y - 13 + i * bandH + wobble, cat.x - trailStartX, bandH + 1);
    }

    // pipes
    for (const p of pipes) {
      drawPipe(p);
    }

    // cat sprite
    const frame = CAT_FRAMES[animFrame];
    const drawW = 72, drawH = 48;
    ctx.save();
    const tilt = Math.max(-0.5, Math.min(0.9, cat.vy / 600));
    ctx.translate(cat.x, cat.y);
    ctx.rotate(tilt * 0.4);
    ctx.drawImage(frame, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  } else {
    // idle preview cat, gentle bob
    const bob = Math.sin(trailWave * 2) * 6;
    ctx.drawImage(CAT_FRAMES[0], W / 2 - 48, H / 2 - 32 + bob, 96, 64);
  }
}

function drawPipe(p) {
  const topH = p.gapY;
  const botY = p.gapY + PIPE_GAP;
  const botH = H - botY;

  drawPipeSegment(p.x, 0, PIPE_WIDTH, topH, true);
  drawPipeSegment(p.x, botY, PIPE_WIDTH, botH, false);
}

function drawPipeSegment(x, y, w, h, capAtBottom) {
  const bodyGrad = ctx.createLinearGradient(x, 0, x + w, 0);
  bodyGrad.addColorStop(0, '#2e2470');
  bodyGrad.addColorStop(0.5, '#4a3aad');
  bodyGrad.addColorStop(1, '#2e2470');
  ctx.fillStyle = bodyGrad;
  ctx.fillRect(x, y, w, h);

  // rainbow stripe cap
  const capH = 14;
  const capY = capAtBottom ? y + h - capH : y;
  const stripeW = w / RAINBOW.length;
  for (let i = 0; i < RAINBOW.length; i++) {
    ctx.fillStyle = RAINBOW[i];
    ctx.fillRect(x + i * stripeW, capY, stripeW + 1, capH);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
}

// ---------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------
function loop(t) {
  if (!lastTime) lastTime = t;
  const dt = Math.min(0.033, (t - lastTime) / 1000);
  lastTime = t;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

// ---------------------------------------------------------------
// Input
// ---------------------------------------------------------------
function handleInput(e) {
  if (e.type === 'keydown' && e.code !== 'Space') return;
  e.preventDefault();
  flap();
}
document.getElementById('startBtn').addEventListener('click', flap);
canvas.addEventListener('pointerdown', flap);
window.addEventListener('keydown', handleInput);

document.getElementById('restartBtn').addEventListener('click', () => {
  gameOverScreen.classList.add('hidden');
  startGame();
});

// ---------------------------------------------------------------
// KARAOKE / lyric sync engine
// ---------------------------------------------------------------
const bgm = document.getElementById('bgm');
const playBtn = document.getElementById('playBtn');
const lyricPrev = document.getElementById('lyricPrev');
const lyricNow = document.getElementById('lyricNow');
const lyricNext = document.getElementById('lyricNext');
const progressFill = document.getElementById('progressFill');
const reelL = document.getElementById('reelL');
const reelR = document.getElementById('reelR');

let lyricRAF = null;

function resetKaraoke() {
  bgm.pause();
  bgm.currentTime = 0;
  playBtn.textContent = '▶ PLAY';
  reelL.classList.remove('spin');
  reelR.classList.remove('spin');
  progressFill.style.width = '0%';
  lyricPrev.textContent = '';
  lyricNext.textContent = '';
  lyricNow.textContent = 'press play to spin the tape';
  if (lyricRAF) cancelAnimationFrame(lyricRAF);
}

function currentLyricIndex(time) {
  let idx = -1;
  for (let i = 0; i < LYRICS.length; i++) {
    if (LYRICS[i].time <= time) idx = i;
    else break;
  }
  return idx;
}

function updateKaraoke() {
  const t = bgm.currentTime;
  const dur = bgm.duration || 1;
  progressFill.style.width = `${Math.min(100, (t / dur) * 100)}%`;

  const idx = currentLyricIndex(t);
  lyricNow.textContent = idx >= 0 ? LYRICS[idx].text : '🎵 …';
  lyricPrev.textContent = idx > 0 ? LYRICS[idx - 1].text : '';
  lyricNext.textContent = idx >= 0 && idx < LYRICS.length - 1 ? LYRICS[idx + 1].text : '';

  if (!bgm.paused) {
    lyricRAF = requestAnimationFrame(updateKaraoke);
  }
}

playBtn.addEventListener('click', () => {
  if (bgm.paused) {
    bgm.play().catch(() => {
      lyricNow.textContent = '⚠ add your mp3 to assets/audio/ first';
    });
    playBtn.textContent = '⏸ PAUSE';
    reelL.classList.add('spin');
    reelR.classList.add('spin');
    updateKaraoke();
  } else {
    bgm.pause();
    playBtn.textContent = '▶ PLAY';
    reelL.classList.remove('spin');
    reelR.classList.remove('spin');
  }
});

bgm.addEventListener('ended', () => {
  playBtn.textContent = '▶ PLAY';
  reelL.classList.remove('spin');
  reelR.classList.remove('spin');
});

// ---------------------------------------------------------------
// Boot
// ---------------------------------------------------------------
resetGame();
requestAnimationFrame(loop);
