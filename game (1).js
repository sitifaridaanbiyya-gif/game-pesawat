// ==========================================
// COSMIC VANGUARD - GALAXY SHOOTER ENGINE
// HTML5 Canvas + Procedural Visuals + Particles
// ==========================================

(() => {
  'use strict';

  // Game Constants
  const STATE = {
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAMEOVER: 'GAMEOVER',
    VICTORY: 'VICTORY'
  };

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  // UI Elements
  const hudLayer = document.getElementById('game-hud');
  const scoreDisplay = document.getElementById('score-display');
  const highscoreDisplay = document.getElementById('highscore-display');
  const waveDisplay = document.getElementById('wave-display');
  const hullBar = document.getElementById('hull-bar');
  const shieldBar = document.getElementById('shield-bar');
  const bombIcons = document.getElementById('bomb-icons');
  const bossHud = document.getElementById('boss-hud-container');
  const bossHpBar = document.getElementById('boss-hp-bar');
  const bossHpText = document.getElementById('boss-hp-text');

  const startScreen = document.getElementById('start-screen');
  const pauseScreen = document.getElementById('pause-screen');
  const gameoverScreen = document.getElementById('gameover-screen');
  const victoryScreen = document.getElementById('victory-screen');
  const touchControls = document.getElementById('touch-controls');

  const startHighscoreVal = document.getElementById('start-highscore-val');
  const finalScore = document.getElementById('final-score');
  const finalWave = document.getElementById('final-wave');
  const finalKills = document.getElementById('final-kills');
  const finalHighscore = document.getElementById('final-highscore');
  const victoryScore = document.getElementById('victory-score');
  const victoryHighscore = document.getElementById('victory-highscore');

  const btnStart = document.getElementById('btn-start-game');
  const btnPause = document.getElementById('btn-pause');
  const btnResume = document.getElementById('btn-resume-game');
  const btnRestartFromPause = document.getElementById('btn-restart-from-pause');
  const btnRestart = document.getElementById('btn-restart-game');
  const btnHome = document.getElementById('btn-home');
  const btnContinueEndless = document.getElementById('btn-continue-endless');
  const btnVictoryHome = document.getElementById('btn-victory-home');
  const btnAudioToggle = document.getElementById('btn-audio-toggle');
  const audioIcon = document.getElementById('audio-icon');

  const btnTouchBomb = document.getElementById('btn-touch-bomb');
  const btnTouchShoot = document.getElementById('btn-touch-shoot');

  // Game Dimensions & Scaling
  let width = window.innerWidth;
  let height = window.innerHeight;

  function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    if (typeof starfield !== 'undefined' && starfield) {
      starfield.init();
    }
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Detect mobile
  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  if (isTouchDevice) {
    touchControls.classList.remove('hidden');
  }

  // ==========================================
  // INPUT SYSTEM
  // ==========================================
  const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    KeyW: false,
    KeyS: false,
    KeyA: false,
    KeyD: false,
    Space: false,
    KeyB: false
  };

  let isShooting = false;
  let touchPos = null;
  let touchActive = false;

  window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.code)) {
      keys[e.code] = true;
    }
    if (e.code === 'Space') {
      isShooting = true;
    }
    if (e.code === 'KeyB') {
      triggerBomb();
    }
    if (e.code === 'Escape' || e.code === 'KeyP') {
      togglePause();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.code)) {
      keys[e.code] = false;
    }
    if (e.code === 'Space') {
      isShooting = false;
    }
  });

  // Mouse / Pointer click & movement
  window.addEventListener('mousedown', (e) => {
    if (gameState === STATE.PLAYING && e.button === 0 && e.target === canvas) {
      isShooting = true;
    }
  });

  window.addEventListener('mouseup', () => {
    if (!keys.Space) isShooting = false;
  });

  // Touch Support
  canvas.addEventListener('touchstart', (e) => {
    touchActive = true;
    const t = e.touches[0];
    touchPos = { x: t.clientX, y: t.clientY };
  }, { passive: true });

  canvas.addEventListener('touchmove', (e) => {
    if (!touchActive) return;
    const t = e.touches[0];
    touchPos = { x: t.clientX, y: t.clientY };
  }, { passive: true });

  canvas.addEventListener('touchend', () => {
    touchActive = false;
    touchPos = null;
  }, { passive: true });

  if (btnTouchBomb) {
    btnTouchBomb.addEventListener('click', () => triggerBomb());
  }
  if (btnTouchShoot) {
    let touchFiring = false;
    btnTouchShoot.addEventListener('touchstart', (e) => {
      e.preventDefault();
      touchFiring = true;
      isShooting = true;
    });
    btnTouchShoot.addEventListener('touchend', (e) => {
      e.preventDefault();
      touchFiring = false;
      if (!keys.Space) isShooting = false;
    });
  }

  // ==========================================
  // AUDIO TOGGLE
  // ==========================================
  btnAudioToggle.addEventListener('click', () => {
    window.soundManager.ensureContext();
    const muted = window.soundManager.toggleMute();
    audioIcon.textContent = muted ? '🔇' : '🔊';
  });

  // ==========================================
  // STARFIELD & NEBULA BACKGROUND
  // ==========================================
  class Starfield {
    constructor() {
      this.stars = [];
      this.nebulaClouds = [];
      this.init();
    }

    init() {
      this.stars = [];
      const count = Math.floor((width * height) / 4500);
      for (let i = 0; i < count; i++) {
        this.stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 2 + 0.5,
          speed: Math.random() * 1.5 + 0.3,
          alpha: Math.random() * 0.8 + 0.2,
          flicker: Math.random() * 0.05
        });
      }

      this.nebulaClouds = [
        { x: width * 0.2, y: height * 0.3, radius: 250, color: 'rgba(99, 102, 241, 0.08)' },
        { x: width * 0.8, y: height * 0.7, radius: 300, color: 'rgba(168, 85, 247, 0.07)' },
        { x: width * 0.5, y: height * 0.9, radius: 350, color: 'rgba(6, 182, 212, 0.06)' }
      ];
    }

    update(speedMultiplier = 1) {
      for (const star of this.stars) {
        star.y += star.speed * speedMultiplier;
        if (star.y > height) {
          star.y = 0;
          star.x = Math.random() * width;
        }
        star.alpha += (Math.random() - 0.5) * star.flicker;
        if (star.alpha < 0.2) star.alpha = 0.2;
        if (star.alpha > 1) star.alpha = 1;
      }
    }

    draw(ctx) {
      // Nebulas
      for (const neb of this.nebulaClouds) {
        const grad = ctx.createRadialGradient(neb.x, neb.y, 0, neb.x, neb.y, neb.radius);
        grad.addColorStop(0, neb.color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(neb.x, neb.y, neb.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Stars
      for (const star of this.stars) {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
      }
    }
  }

  // ==========================================
  // FLOATING TEXT & PARTICLES
  // ==========================================
  class Particle {
    constructor(x, y, vx, vy, color, size, life, shape = 'circle') {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.color = color;
      this.size = size;
      this.life = life;
      this.maxLife = life;
      this.shape = shape;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vx *= 0.96;
      this.vy *= 0.96;
      this.life--;
    }

    draw(ctx) {
      const alpha = Math.max(0, this.life / this.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      if (this.shape === 'square') {
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
      } else {
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  class FloatingText {
    constructor(text, x, y, color = '#00f0ff', size = 18) {
      this.text = text;
      this.x = x;
      this.y = y;
      this.color = color;
      this.size = size;
      this.life = 50;
      this.maxLife = 50;
    }

    update() {
      this.y -= 1.2;
      this.life--;
    }

    draw(ctx) {
      const alpha = Math.max(0, this.life / this.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `bold ${this.size}px 'Orbitron', sans-serif`;
      ctx.fillStyle = this.color;
      ctx.textAlign = 'center';
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;
      ctx.fillText(this.text, this.x, this.y);
      ctx.restore();
    }
  }

  // ==========================================
  // PROJECTILES
  // ==========================================
  class Bullet {
    constructor(x, y, vx, vy, isPlayer = true, damage = 20, color = '#00f0ff') {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.isPlayer = isPlayer;
      this.damage = damage;
      this.color = color;
      this.width = isPlayer ? 4 : 6;
      this.height = isPlayer ? 14 : 10;
      this.alive = true;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.y < -30 || this.y > height + 30 || this.x < -30 || this.x > width + 30) {
        this.alive = false;
      }
    }

    draw(ctx) {
      ctx.save();
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      if (this.isPlayer) {
        ctx.rect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
      } else {
        ctx.arc(this.x, this.y, this.width, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.restore();
    }
  }

  // ==========================================
  // POWER-UPS
  // ==========================================
  class PowerUp {
    constructor(x, y, type) {
      this.x = x;
      this.y = y;
      this.type = type; // 'WEAPON', 'SHIELD', 'BOMB', 'SCORE'
      this.radius = 16;
      this.vy = 1.5;
      this.alive = true;
      this.pulse = 0;

      switch (type) {
        case 'WEAPON':
          this.label = 'P';
          this.color = '#ff007f';
          break;
        case 'SHIELD':
          this.label = 'S';
          this.color = '#38bdf8';
          break;
        case 'BOMB':
          this.label = 'B';
          this.color = '#fbbf24';
          break;
        case 'SCORE':
          this.label = '2X';
          this.color = '#10b981';
          break;
      }
    }

    update(player) {
      this.pulse += 0.08;
      this.y += this.vy;

      // Magnet attraction if player is close
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 140) {
        this.x += (dx / dist) * 4.5;
        this.y += (dy / dist) * 4.5;
      }

      if (this.y > height + 30) {
        this.alive = false;
      }
    }

    draw(ctx) {
      ctx.save();
      const currentRadius = this.radius + Math.sin(this.pulse) * 2;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 15;
      ctx.fillStyle = 'rgba(10, 15, 30, 0.8)';
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = this.color;
      ctx.font = `bold ${this.type === 'SCORE' ? 12 : 14}px 'Orbitron', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.label, this.x, this.y);
      ctx.restore();
    }
  }

  // ==========================================
  // PLAYER SHIP
  // ==========================================
  class Player {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = width / 2;
      this.y = height - 120;
      this.targetX = this.x;
      this.targetY = this.y;
      this.vx = 0;
      this.vy = 0;
      this.speed = 6.5;
      this.radius = 24;

      this.maxHull = 100;
      this.hull = 100;
      this.maxShield = 100;
      this.shield = 100;
      this.shieldRegenCooldown = 0;

      this.weaponLevel = 1; // 1 to 4
      this.bombs = 3;
      this.scoreMultiplier = 1;
      this.multiplierTimer = 0;

      this.fireCooldown = 0;
      this.fireRate = 12; // Frames between shots

      this.invincibleTimer = 0;
      this.tilt = 0; // Visual bank
    }

    update() {
      // Movement Input (Keyboard)
      let moveX = 0;
      let moveY = 0;

      if (keys.ArrowLeft || keys.KeyA) moveX -= 1;
      if (keys.ArrowRight || keys.KeyD) moveX += 1;
      if (keys.ArrowUp || keys.KeyW) moveY -= 1;
      if (keys.ArrowDown || keys.KeyS) moveY += 1;

      // Handle touch dragging
      if (touchActive && touchPos) {
        const dx = touchPos.x - this.x;
        const dy = (touchPos.y - 60) - this.y; // 60px above finger
        this.x += dx * 0.15;
        this.y += dy * 0.15;
        this.tilt = Math.max(-0.4, Math.min(0.4, dx * 0.02));
      } else {
        if (moveX !== 0 && moveY !== 0) {
          moveX *= 0.7071;
          moveY *= 0.7071;
        }

        this.vx = this.vx * 0.8 + moveX * this.speed * 0.2;
        this.vy = this.vy * 0.8 + moveY * this.speed * 0.2;

        this.x += this.vx;
        this.y += this.vy;

        this.tilt = this.vx * 0.05;
      }

      // Screen boundaries
      this.x = Math.max(30, Math.min(width - 30, this.x));
      this.y = Math.max(50, Math.min(height - 40, this.y));

      // Thruster flame particles
      if (Math.random() < 0.7) {
        particles.push(new Particle(
          this.x + (Math.random() - 0.5) * 8,
          this.y + 22,
          (Math.random() - 0.5) * 1.5,
          Math.random() * 3 + 2,
          Math.random() < 0.5 ? '#00f0ff' : '#0077ff',
          Math.random() * 3 + 2,
          18
        ));
      }

      // Shield Regen
      if (this.shieldRegenCooldown > 0) {
        this.shieldRegenCooldown--;
      } else if (this.shield < this.maxShield) {
        this.shield = Math.min(this.maxShield, this.shield + 0.15);
        updateGauges();
      }

      // Multiplier countdown
      if (this.scoreMultiplier > 1) {
        this.multiplierTimer--;
        if (this.multiplierTimer <= 0) {
          this.scoreMultiplier = 1;
          floatingTexts.push(new FloatingText('MULTIPLIER ENDED', this.x, this.y - 30, '#94a3b8', 14));
        }
      }

      // Invincibility flicker
      if (this.invincibleTimer > 0) {
        this.invincibleTimer--;
      }

      // Fire weapon
      if (this.fireCooldown > 0) {
        this.fireCooldown--;
      }

      if (isShooting && this.fireCooldown <= 0) {
        this.shoot();
      }
    }

    shoot() {
      this.fireCooldown = Math.max(6, this.fireRate - (this.weaponLevel * 1.2));
      window.soundManager.playLaser(1 + this.weaponLevel * 0.08);

      switch (this.weaponLevel) {
        case 1:
          bullets.push(new Bullet(this.x - 10, this.y - 12, 0, -14, true, 25));
          bullets.push(new Bullet(this.x + 10, this.y - 12, 0, -14, true, 25));
          break;
        case 2:
          bullets.push(new Bullet(this.x, this.y - 16, 0, -15, true, 28));
          bullets.push(new Bullet(this.x - 14, this.y - 10, -1, -14, true, 24));
          bullets.push(new Bullet(this.x + 14, this.y - 10, 1, -14, true, 24));
          break;
        case 3:
          bullets.push(new Bullet(this.x - 6, this.y - 16, 0, -16, true, 30));
          bullets.push(new Bullet(this.x + 6, this.y - 16, 0, -16, true, 30));
          bullets.push(new Bullet(this.x - 18, this.y - 8, -2.5, -15, true, 25));
          bullets.push(new Bullet(this.x + 18, this.y - 8, 2.5, -15, true, 25));
          break;
        default: // Level 4+
          bullets.push(new Bullet(this.x, this.y - 20, 0, -18, true, 45, '#a855f7'));
          bullets.push(new Bullet(this.x - 10, this.y - 14, -1, -17, true, 30, '#00f0ff'));
          bullets.push(new Bullet(this.x + 10, this.y - 14, 1, -17, true, 30, '#00f0ff'));
          bullets.push(new Bullet(this.x - 22, this.y - 6, -3.5, -15, true, 25, '#ff007f'));
          bullets.push(new Bullet(this.x + 22, this.y - 6, 3.5, -15, true, 25, '#ff007f'));
          break;
      }
    }

    takeDamage(amount) {
      if (this.invincibleTimer > 0) return;

      this.invincibleTimer = 40; // 40 frames of iframes
      this.shieldRegenCooldown = 180; // 3 seconds before shield recharges
      triggerScreenShake(10);

      if (this.shield > 0) {
        window.soundManager.playShieldHit();
        this.shield -= amount;
        if (this.shield < 0) {
          this.hull += this.shield; // Overflow to hull
          this.shield = 0;
        }
      } else {
        window.soundManager.playExplosion(false);
        this.hull -= amount;
      }

      updateGauges();

      if (this.hull <= 0) {
        this.hull = 0;
        gameOver();
      }
    }

    draw(ctx) {
      if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer / 4) % 2 === 0) {
        return; // Flash when invulnerable
      }

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.tilt);

      // Shield Aura
      if (this.shield > 0) {
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.3 + (this.shield / this.maxShield) * 0.4})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 8, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Spaceship Vector Model
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12;

      // Main Fuselage
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(0, -26); // Nose
      ctx.lineTo(14, 14); // Right wing tip
      ctx.lineTo(8, 20);  // Right engine
      ctx.lineTo(-8, 20); // Left engine
      ctx.lineTo(-14, 14); // Left wing tip
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Wing Cannons
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-15, 6, 3, 10);
      ctx.fillRect(12, 6, 3, 10);

      // Cockpit Glow
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.ellipse(0, -6, 4, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Core Reactor
      ctx.fillStyle = '#ff007f';
      ctx.beginPath();
      ctx.arc(0, 8, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // ==========================================
  // ENEMIES & BOSS
  // ==========================================
  class Enemy {
    constructor(type, x, y) {
      this.type = type; // 'SCOUT', 'INTERCEPTOR', 'CRUISER', 'ASTEROID'
      this.x = x;
      this.y = y;
      this.alive = true;
      this.time = Math.random() * 100;
      this.shootCooldown = Math.floor(Math.random() * 60) + 40;

      switch (type) {
        case 'SCOUT':
          this.hp = 30;
          this.maxHp = 30;
          this.speed = 3.2;
          this.radius = 16;
          this.score = 100;
          this.color = '#00f0ff';
          break;
        case 'INTERCEPTOR':
          this.hp = 65;
          this.maxHp = 65;
          this.speed = 2.4;
          this.radius = 20;
          this.score = 250;
          this.color = '#ff007f';
          break;
        case 'CRUISER':
          this.hp = 220;
          this.maxHp = 220;
          this.speed = 1.2;
          this.radius = 32;
          this.score = 600;
          this.color = '#a855f7';
          break;
        case 'ASTEROID':
          this.hp = 80;
          this.maxHp = 80;
          this.speed = 1.8;
          this.radius = 24;
          this.score = 150;
          this.color = '#94a3b8';
          this.rotation = 0;
          this.rotSpeed = (Math.random() - 0.5) * 0.04;
          break;
      }
    }

    update(player) {
      this.time += 0.05;

      switch (this.type) {
        case 'SCOUT':
          this.y += this.speed;
          this.x += Math.sin(this.time * 2) * 3;
          break;
        case 'INTERCEPTOR':
          this.y += this.speed;
          // Slowly track player X
          if (this.x < player.x - 20) this.x += 1.2;
          if (this.x > player.x + 20) this.x -= 1.2;
          break;
        case 'CRUISER':
          this.y += this.speed;
          break;
        case 'ASTEROID':
          this.y += this.speed;
          this.rotation += this.rotSpeed;
          break;
      }

      // Shooting logic
      if (this.type !== 'ASTEROID') {
        this.shootCooldown--;
        if (this.shootCooldown <= 0 && this.y > 0 && this.y < height - 150) {
          this.shoot(player);
          this.shootCooldown = this.type === 'CRUISER' ? 75 : 90;
        }
      }

      if (this.y > height + 50) {
        this.alive = false;
      }
    }

    shoot(player) {
      window.soundManager.playEnemyLaser();
      if (this.type === 'SCOUT') {
        bullets.push(new Bullet(this.x, this.y + 15, 0, 7, false, 15, '#ff2a55'));
      } else if (this.type === 'INTERCEPTOR') {
        bullets.push(new Bullet(this.x - 10, this.y + 15, -1, 7.5, false, 15, '#ff007f'));
        bullets.push(new Bullet(this.x + 10, this.y + 15, 1, 7.5, false, 15, '#ff007f'));
      } else if (this.type === 'CRUISER') {
        bullets.push(new Bullet(this.x - 16, this.y + 20, -1.8, 6.5, false, 20, '#a855f7'));
        bullets.push(new Bullet(this.x, this.y + 22, 0, 7, false, 20, '#a855f7'));
        bullets.push(new Bullet(this.x + 16, this.y + 20, 1.8, 6.5, false, 20, '#a855f7'));
      }
    }

    takeDamage(amount) {
      this.hp -= amount;
      // Hit spark particles
      for (let i = 0; i < 3; i++) {
        particles.push(new Particle(
          this.x + (Math.random() - 0.5) * 15,
          this.y + (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 4,
          this.color,
          2.5,
          15
        ));
      }

      if (this.hp <= 0) {
        this.alive = false;
        killEnemy(this);
      }
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);

      if (this.type === 'ASTEROID') {
        ctx.rotate(this.rotation);
        ctx.strokeStyle = '#94a3b8';
        ctx.fillStyle = '#1e293b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Jagged rock polygon
        const pts = 7;
        for (let i = 0; i < pts; i++) {
          const angle = (i / pts) * Math.PI * 2;
          const r = this.radius * (0.8 + ((i % 2) * 0.4));
          const px = Math.cos(angle) * r;
          const py = Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;

        if (this.type === 'SCOUT') {
          // Sharp downward dart
          ctx.beginPath();
          ctx.moveTo(0, 18);
          ctx.lineTo(14, -14);
          ctx.lineTo(0, -6);
          ctx.lineTo(-14, -14);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (this.type === 'INTERCEPTOR') {
          // Diamond fighter
          ctx.beginPath();
          ctx.moveTo(0, 20);
          ctx.lineTo(18, 0);
          ctx.lineTo(12, -18);
          ctx.lineTo(-12, -18);
          ctx.lineTo(-18, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (this.type === 'CRUISER') {
          // Heavy dread-cruiser
          ctx.beginPath();
          ctx.moveTo(0, 28);
          ctx.lineTo(28, 4);
          ctx.lineTo(24, -26);
          ctx.lineTo(-24, -26);
          ctx.lineTo(-28, 4);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Glowing engines
          ctx.fillStyle = '#ff0055';
          ctx.fillRect(-18, -28, 8, 4);
          ctx.fillRect(10, -28, 8, 4);
        }
      }

      ctx.restore();
    }
  }

  // ==========================================
  // TITAN DREADNOUGHT (BOSS)
  // ==========================================
  class Boss {
    constructor() {
      this.x = width / 2;
      this.y = -100;
      this.targetY = 120;
      this.maxHp = 2500;
      this.hp = 2500;
      this.radius = 70;
      this.alive = true;
      this.phase = 1;
      this.time = 0;
      this.attackTimer = 0;

      bossHud.classList.remove('hidden');
      updateBossHp();
      window.soundManager.playBossAlert();
    }

    update(player) {
      this.time += 0.03;

      // Entrance movement
      if (this.y < this.targetY) {
        this.y += 1.5;
        return;
      }

      // Hover swaying motion
      this.x = width / 2 + Math.sin(this.time) * (width * 0.28);

      // Phase calculation
      if (this.hp < this.maxHp * 0.45) {
        this.phase = 2;
      }

      this.attackTimer++;

      // Attack patterns
      if (this.phase === 1) {
        if (this.attackTimer % 45 === 0) {
          // Dual heavy plasma cannons
          window.soundManager.playEnemyLaser();
          bullets.push(new Bullet(this.x - 45, this.y + 40, -1, 6.5, false, 25, '#ff0055'));
          bullets.push(new Bullet(this.x + 45, this.y + 40, 1, 6.5, false, 25, '#ff0055'));
        }
        if (this.attackTimer % 110 === 0) {
          // Spread fan
          for (let i = -3; i <= 3; i++) {
            bullets.push(new Bullet(this.x, this.y + 50, i * 1.5, 6, false, 18, '#ffd700'));
          }
        }
      } else {
        // Phase 2: Overdrive Bullet Hell & Spawns
        if (this.attackTimer % 25 === 0) {
          const angle = this.time * 4;
          bullets.push(new Bullet(this.x, this.y + 45, Math.cos(angle) * 5, Math.sin(angle) * 5 + 3, false, 20, '#ff007f'));
          bullets.push(new Bullet(this.x, this.y + 45, -Math.cos(angle) * 5, Math.sin(angle) * 5 + 3, false, 20, '#ff007f'));
        }

        if (this.attackTimer % 160 === 0) {
          // Spawn escort drone
          enemies.push(new Enemy('INTERCEPTOR', this.x - 60, this.y + 20));
          enemies.push(new Enemy('INTERCEPTOR', this.x + 60, this.y + 20));
        }
      }
    }

    takeDamage(amount) {
      this.hp -= amount;
      updateBossHp();

      for (let i = 0; i < 4; i++) {
        particles.push(new Particle(
          this.x + (Math.random() - 0.5) * 80,
          this.y + (Math.random() - 0.5) * 50,
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 6,
          '#ff0055',
          3,
          20
        ));
      }

      if (this.hp <= 0) {
        this.alive = false;
        bossDefeated();
      }
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);

      ctx.shadowColor = this.phase === 2 ? '#ff007f' : '#ff0055';
      ctx.shadowBlur = 25;

      // Dreadnought Silhouette
      ctx.fillStyle = '#080d1a';
      ctx.strokeStyle = this.phase === 2 ? '#ff007f' : '#ff0055';
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.moveTo(0, 65); // Front ram
      ctx.lineTo(55, 30);
      ctx.lineTo(80, -20);
      ctx.lineTo(50, -55);
      ctx.lineTo(0, -40);
      ctx.lineTo(-50, -55);
      ctx.lineTo(-80, -20);
      ctx.lineTo(-55, 30);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Core Reactor
      ctx.fillStyle = this.phase === 2 ? '#ff00ff' : '#ffaa00';
      ctx.beginPath();
      ctx.arc(0, 0, 18 + Math.sin(this.time * 5) * 3, 0, Math.PI * 2);
      ctx.fill();

      // Wing Cannons
      ctx.fillStyle = '#ff0055';
      ctx.fillRect(-50, 20, 10, 20);
      ctx.fillRect(40, 20, 10, 20);

      ctx.restore();
    }
  }

  function updateBossHp() {
    if (!boss) return;
    const pct = Math.max(0, (boss.hp / boss.maxHp) * 100);
    bossHpBar.style.width = `${pct}%`;
    bossHpText.textContent = `${Math.ceil(pct)}%`;
  }

  // ==========================================
  // GAME STATE & MANAGER
  // ==========================================
  let gameState = STATE.MENU;
  let score = 0;
  let highscore = parseInt(localStorage.getItem('cosmic_vanguard_highscore') || '0', 10);
  let wave = 1;
  let kills = 0;
  let endlessMode = false;

  let player = new Player();
  let starfield = new Starfield();
  let bullets = [];
  let enemies = [];
  let powerups = [];
  let particles = [];
  let floatingTexts = [];
  let boss = null;

  let waveSpawnTimer = 0;
  let enemiesLeftToSpawn = 0;
  let screenShake = 0;

  // Initialize UI
  highscoreDisplay.textContent = highscore;
  startHighscoreVal.textContent = highscore;

  function triggerScreenShake(magnitude = 8) {
    screenShake = magnitude;
  }

  function triggerBomb() {
    if (gameState !== STATE.PLAYING || player.bombs <= 0) return;
    player.bombs--;
    updateBombUI();
    window.soundManager.playBomb();
    triggerScreenShake(20);

    // Destroy all enemy bullets
    bullets = bullets.filter(b => b.isPlayer);

    // Massive damage to all enemies on screen
    for (const enemy of enemies) {
      enemy.takeDamage(400);
    }
    if (boss && boss.alive) {
      boss.takeDamage(500);
    }

    // Bomb shockwave particle ring
    for (let i = 0; i < 90; i++) {
      const angle = (i / 90) * Math.PI * 2;
      const spd = Math.random() * 8 + 6;
      particles.push(new Particle(
        player.x,
        player.y,
        Math.cos(angle) * spd,
        Math.sin(angle) * spd,
        '#fbbf24',
        Math.random() * 4 + 2,
        45
      ));
    }

    floatingTexts.push(new FloatingText('NOVA BOMB!', player.x, player.y - 40, '#fbbf24', 24));
  }

  function updateBombUI() {
    const dots = bombIcons.querySelectorAll('.bomb-dot');
    dots.forEach((dot, idx) => {
      if (idx < player.bombs) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  function updateGauges() {
    const hullPct = Math.max(0, (player.hull / player.maxHull) * 100);
    const shieldPct = Math.max(0, (player.shield / player.maxShield) * 100);

    hullBar.style.width = `${hullPct}%`;
    shieldBar.style.width = `${shieldPct}%`;

    // Dynamic color warning for hull
    if (hullPct < 30) {
      hullBar.style.background = 'linear-gradient(90deg, #ff2a55, #dc2626)';
    } else {
      hullBar.style.background = 'linear-gradient(90deg, #10b981, #059669)';
    }
  }

  function addScore(amount) {
    const finalAmount = amount * player.scoreMultiplier;
    score += finalAmount;
    scoreDisplay.textContent = score;

    if (score > highscore) {
      highscore = score;
      highscoreDisplay.textContent = highscore;
      localStorage.setItem('cosmic_vanguard_highscore', highscore.toString());
    }
  }

  function killEnemy(enemy) {
    kills++;
    addScore(enemy.score);
    floatingTexts.push(new FloatingText(`+${enemy.score * player.scoreMultiplier}`, enemy.x, enemy.y, '#00f0ff', 16));
    window.soundManager.playExplosion(enemy.type === 'CRUISER');

    // Spawn explosion particles
    const pCount = enemy.type === 'CRUISER' ? 30 : 15;
    for (let i = 0; i < pCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 5 + 1;
      particles.push(new Particle(
        enemy.x,
        enemy.y,
        Math.cos(angle) * spd,
        Math.sin(angle) * spd,
        Math.random() < 0.5 ? enemy.color : '#ffaa00',
        Math.random() * 3 + 2,
        Math.floor(Math.random() * 20) + 15
      ));
    }

    // Chance to drop power-up
    const dropRate = enemy.type === 'CRUISER' ? 0.8 : (enemy.type === 'ASTEROID' ? 0.5 : 0.2);
    if (Math.random() < dropRate) {
      const types = ['WEAPON', 'SHIELD', 'BOMB', 'SCORE'];
      const chosen = types[Math.floor(Math.random() * types.length)];
      powerups.push(new PowerUp(enemy.x, enemy.y, chosen));
    }
  }

  function startNextWave() {
    wave++;
    waveDisplay.textContent = wave;
    floatingTexts.push(new FloatingText(`WAVE ${wave}`, width / 2, height / 2 - 50, '#00f0ff', 32));

    if (wave === 5 && !endlessMode) {
      // Spawn Dreadnought Boss!
      boss = new Boss();
      enemiesLeftToSpawn = 0;
    } else {
      enemiesLeftToSpawn = 10 + wave * 4;
    }
  }

  function spawnWaveEnemies() {
    if (boss && boss.alive) return;

    if (enemiesLeftToSpawn > 0) {
      waveSpawnTimer++;
      if (waveSpawnTimer >= 55) {
        waveSpawnTimer = 0;
        enemiesLeftToSpawn--;

        const rand = Math.random();
        const spawnX = Math.random() * (width - 100) + 50;

        if (rand < 0.45) {
          enemies.push(new Enemy('SCOUT', spawnX, -30));
        } else if (rand < 0.75) {
          enemies.push(new Enemy('INTERCEPTOR', spawnX, -30));
        } else if (rand < 0.90) {
          enemies.push(new Enemy('ASTEROID', spawnX, -30));
        } else {
          enemies.push(new Enemy('CRUISER', spawnX, -40));
        }
      }
    } else if (enemies.length === 0 && !boss) {
      startNextWave();
    }
  }

  function bossDefeated() {
    boss = null;
    bossHud.classList.add('hidden');
    triggerScreenShake(30);
    window.soundManager.playBomb();
    addScore(10000);

    for (let i = 0; i < 120; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 9 + 2;
      particles.push(new Particle(
        width / 2 + (Math.random() - 0.5) * 100,
        150 + (Math.random() - 0.5) * 60,
        Math.cos(angle) * spd,
        Math.sin(angle) * spd,
        Math.random() < 0.5 ? '#ffd700' : '#ff007f',
        Math.random() * 4 + 3,
        60
      ));
    }

    if (!endlessMode) {
      setTimeout(() => {
        showVictoryScreen();
      }, 1500);
    } else {
      floatingTexts.push(new FloatingText('BOSS DESTROYED!', width / 2, height / 2, '#ffd700', 36));
      startNextWave();
    }
  }

  function showVictoryScreen() {
    gameState = STATE.VICTORY;
    victoryScore.textContent = score;
    victoryHighscore.textContent = highscore;
    victoryScreen.classList.remove('hidden');
    hudLayer.classList.add('hidden');
  }

  function gameOver() {
    gameState = STATE.GAMEOVER;
    finalScore.textContent = score;
    finalWave.textContent = `Wave ${wave}`;
    finalKills.textContent = kills;
    finalHighscore.textContent = highscore;

    gameoverScreen.classList.remove('hidden');
    hudLayer.classList.add('hidden');
    bossHud.classList.add('hidden');
  }

  function startGame() {
    window.soundManager.ensureContext();
    score = 0;
    wave = 1;
    kills = 0;
    endlessMode = false;
    scoreDisplay.textContent = '0';
    waveDisplay.textContent = '1';

    player.reset();
    bullets = [];
    enemies = [];
    powerups = [];
    particles = [];
    floatingTexts = [];
    boss = null;
    enemiesLeftToSpawn = 12;

    updateGauges();
    updateBombUI();

    startScreen.classList.add('hidden');
    gameoverScreen.classList.add('hidden');
    victoryScreen.classList.add('hidden');
    pauseScreen.classList.add('hidden');
    hudLayer.classList.remove('hidden');

    gameState = STATE.PLAYING;
  }

  function togglePause() {
    if (gameState === STATE.PLAYING) {
      gameState = STATE.PAUSED;
      pauseScreen.classList.remove('hidden');
    } else if (gameState === STATE.PAUSED) {
      gameState = STATE.PLAYING;
      pauseScreen.classList.add('hidden');
    }
  }

  // ==========================================
  // BUTTON LISTENERS
  // ==========================================
  btnStart.addEventListener('click', startGame);
  btnRestart.addEventListener('click', startGame);
  btnPause.addEventListener('click', togglePause);
  btnResume.addEventListener('click', togglePause);
  btnRestartFromPause.addEventListener('click', () => {
    pauseScreen.classList.add('hidden');
    startGame();
  });
  btnHome.addEventListener('click', () => {
    gameoverScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    gameState = STATE.MENU;
  });
  btnVictoryHome.addEventListener('click', () => {
    victoryScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    gameState = STATE.MENU;
  });
  btnContinueEndless.addEventListener('click', () => {
    endlessMode = true;
    victoryScreen.classList.add('hidden');
    hudLayer.classList.remove('hidden');
    gameState = STATE.PLAYING;
    startNextWave();
  });

  // ==========================================
  // MAIN LOOP & RENDERING
  // ==========================================
  function checkCollisions() {
    // Player bullets hitting enemies
    for (const b of bullets) {
      if (!b.isPlayer || !b.alive) continue;

      // Check standard enemies
      for (const e of enemies) {
        if (!e.alive) continue;
        const dist = Math.hypot(b.x - e.x, b.y - e.y);
        if (dist < e.radius + b.width) {
          b.alive = false;
          e.takeDamage(b.damage);
          break;
        }
      }

      // Check Boss
      if (boss && boss.alive && b.alive) {
        const dist = Math.hypot(b.x - boss.x, b.y - boss.y);
        if (dist < boss.radius + b.width) {
          b.alive = false;
          boss.takeDamage(b.damage);
        }
      }
    }

    // Enemy bullets hitting player
    for (const b of bullets) {
      if (b.isPlayer || !b.alive) continue;
      const dist = Math.hypot(b.x - player.x, b.y - player.y);
      if (dist < player.radius + b.width) {
        b.alive = false;
        player.takeDamage(b.damage);
      }
    }

    // Player colliding with enemies directly
    for (const e of enemies) {
      if (!e.alive) continue;
      const dist = Math.hypot(player.x - e.x, player.y - e.y);
      if (dist < player.radius + e.radius) {
        e.takeDamage(100);
        player.takeDamage(35);
      }
    }

    // Player collecting powerups
    for (const p of powerups) {
      if (!p.alive) continue;
      const dist = Math.hypot(player.x - p.x, player.y - p.y);
      if (dist < player.radius + p.radius) {
        p.alive = false;
        window.soundManager.playPowerup();

        switch (p.type) {
          case 'WEAPON':
            player.weaponLevel = Math.min(4, player.weaponLevel + 1);
            floatingTexts.push(new FloatingText('WEAPON UPGRADED!', player.x, player.y - 30, '#ff007f', 18));
            break;
          case 'SHIELD':
            player.shield = player.maxShield;
            updateGauges();
            floatingTexts.push(new FloatingText('SHIELD RESTORED!', player.x, player.y - 30, '#38bdf8', 18));
            break;
          case 'BOMB':
            player.bombs = Math.min(3, player.bombs + 1);
            updateBombUI();
            floatingTexts.push(new FloatingText('+1 NOVA BOMB!', player.x, player.y - 30, '#fbbf24', 18));
            break;
          case 'SCORE':
            player.scoreMultiplier = 2;
            player.multiplierTimer = 720; // 12 seconds
            floatingTexts.push(new FloatingText('2X MULTIPLIER!', player.x, player.y - 30, '#10b981', 18));
            break;
        }
      }
    }
  }

  function gameLoop() {
    // Clear Canvas
    ctx.clearRect(0, 0, width, height);

    // Apply Screen Shake
    ctx.save();
    if (screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * screenShake;
      const shakeY = (Math.random() - 0.5) * screenShake;
      ctx.translate(shakeX, shakeY);
      screenShake *= 0.9;
      if (screenShake < 0.5) screenShake = 0;
    }

    // Update & Draw Starfield
    starfield.update(gameState === STATE.PLAYING ? 1.5 : 0.5);
    starfield.draw(ctx);

    // Game Logic if playing
    if (gameState === STATE.PLAYING) {
      player.update();
      spawnWaveEnemies();

      // Bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.update();
        if (!b.alive) {
          bullets.splice(i, 1);
        } else {
          b.draw(ctx);
        }
      }

      // Enemies
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        e.update(player);
        if (!e.alive) {
          enemies.splice(i, 1);
        } else {
          e.draw(ctx);
        }
      }

      // Boss
      if (boss) {
        boss.update(player);
        if (boss && boss.alive) {
          boss.draw(ctx);
        }
      }

      // Powerups
      for (let i = powerups.length - 1; i >= 0; i--) {
        const p = powerups[i];
        p.update(player);
        if (!p.alive) {
          powerups.splice(i, 1);
        } else {
          p.draw(ctx);
        }
      }

      // Collisions
      checkCollisions();
    }

    // Draw Player if playing or paused
    if (gameState === STATE.PLAYING || gameState === STATE.PAUSED) {
      player.draw(ctx);
    }

    // Draw Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.update();
      if (pt.life <= 0) {
        particles.splice(i, 1);
      } else {
        pt.draw(ctx);
      }
    }

    // Floating Texts
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.update();
      if (ft.life <= 0) {
        floatingTexts.splice(i, 1);
      } else {
        ft.draw(ctx);
      }
    }

    ctx.restore();

    requestAnimationFrame(gameLoop);
  }

  // Start the render loop
  requestAnimationFrame(gameLoop);
})();
