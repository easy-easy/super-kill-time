// @ts-check
(function () {
  'use strict';

  const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('game'));
  const ctx = canvas.getContext('2d');

  // 論理サイズは固定。表示サイズは CSS 側で拡縮する。
  const W = canvas.width;
  const H = canvas.height;

  // --- ゲーム設定 -------------------------------------------------------
  const PLAYER_W = 36;
  const PLAYER_H = 14;
  const PLAYER_Y = H - 32;
  const PLAYER_SPEED = 300; // px/sec

  const BULLET_W = 3;
  const BULLET_H = 10;
  const BULLET_SPEED = 480; // px/sec（上方向）

  const ENEMY_COLS = 8;
  const ENEMY_ROWS = 4;
  const TOTAL_ENEMIES = ENEMY_COLS * ENEMY_ROWS;
  const ENEMY_GAP = 14;
  const ENEMY_TOP = 48;
  const ENEMY_W = 28;
  const ENEMY_H = 18;
  const ENEMY_SIDE = (W - (ENEMY_COLS * ENEMY_W + (ENEMY_COLS - 1) * ENEMY_GAP)) / 2;
  const ENEMY_STEP_Y = 16; // 端に着いたときに下がる量
  const ENEMY_BASE_SPEED = 40; // px/sec
  const ENEMY_SPEED_PER_KILL = 4; // 撃破1体につき加速

  const ENEMY_BULLET_LIMIT = 3;
  const ENEMY_BULLET_SPEED = 220; // px/sec（下方向）
  const ENEMY_BULLET_W = 3;
  const ENEMY_BULLET_H = 10;
  const ENEMY_FIRE_CHANCE_PER_SEC = 0.6;

  const STATE = { READY: 'ready', PLAYING: 'playing', OVER: 'over', CLEAR: 'clear' };

  // --- 状態 -------------------------------------------------------------
  const player = { x: (W - PLAYER_W) / 2, w: PLAYER_W, h: PLAYER_H, speed: PLAYER_SPEED };
  /** @type {{x: number, y: number, w: number, h: number, dy: number} | null} */
  let playerBullet = null;
  /** @type {{x: number, y: number, w: number, h: number, dy: number}[]} */
  let enemyBullets = [];
  /** @type {{col: number, row: number, alive: boolean}[]} */
  let enemies = [];
  let blockX = 0;
  let blockY = 0;
  let blockDir = 1;
  let state = STATE.READY;

  const pressed = new Set();

  // --- 初期化 -------------------------------------------------------------
  function buildEnemies() {
    const list = [];
    for (let row = 0; row < ENEMY_ROWS; row++) {
      for (let col = 0; col < ENEMY_COLS; col++) {
        list.push({ col, row, alive: true });
      }
    }
    return list;
  }

  function enemyX(e) {
    return ENEMY_SIDE + blockX + e.col * (ENEMY_W + ENEMY_GAP);
  }

  function enemyY(e) {
    return ENEMY_TOP + blockY + e.row * (ENEMY_H + ENEMY_GAP);
  }

  function newGame() {
    enemies = buildEnemies();
    blockX = 0;
    blockY = 0;
    blockDir = 1;
    player.x = (W - PLAYER_W) / 2;
    playerBullet = null;
    enemyBullets = [];
    state = STATE.READY;
  }

  function startGame() {
    state = STATE.PLAYING;
  }

  // --- 入力 -------------------------------------------------------------
  const MOVE_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D']);

  window.addEventListener('keydown', (e) => {
    if (MOVE_KEYS.has(e.key) || e.code === 'Space') {
      e.preventDefault();
    }
    pressed.add(e.key);

    if (e.code === 'Space') {
      if (state === STATE.READY) {
        startGame();
      } else if (state === STATE.OVER || state === STATE.CLEAR) {
        newGame();
      } else if (state === STATE.PLAYING && !playerBullet) {
        playerBullet = {
          x: player.x + player.w / 2 - BULLET_W / 2,
          y: PLAYER_Y - BULLET_H,
          w: BULLET_W,
          h: BULLET_H,
          dy: -BULLET_SPEED
        };
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    pressed.delete(e.key);
  });

  // ウィンドウからフォーカスが外れたらキーの押しっぱなしを解除する
  window.addEventListener('blur', () => pressed.clear());

  function playerDirection() {
    let dir = 0;
    if (pressed.has('ArrowLeft') || pressed.has('a') || pressed.has('A')) dir -= 1;
    if (pressed.has('ArrowRight') || pressed.has('d') || pressed.has('D')) dir += 1;
    return dir;
  }

  // --- 更新 -------------------------------------------------------------
  function aliveCount() {
    let n = 0;
    for (const e of enemies) if (e.alive) n++;
    return n;
  }

  function updateEnemyBlock(dt) {
    const alive = enemies.filter((e) => e.alive);
    if (alive.length === 0) return;

    const speed = ENEMY_BASE_SPEED + (TOTAL_ENEMIES - alive.length) * ENEMY_SPEED_PER_KILL;
    blockX += blockDir * speed * dt;

    let minX = Infinity;
    let maxX = -Infinity;
    for (const e of alive) {
      const x = enemyX(e);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x + ENEMY_W);
    }

    if (maxX > W || minX < 0) {
      // めり込み分を戻してから反転・下降させる
      blockX -= blockDir * speed * dt;
      blockDir *= -1;
      blockY += ENEMY_STEP_Y;
    }
  }

  function fireEnemyBullet() {
    if (enemyBullets.length >= ENEMY_BULLET_LIMIT) return;

    /** @type {Map<number, {col: number, row: number, alive: boolean}>} */
    const frontByCol = new Map();
    for (const e of enemies) {
      if (!e.alive) continue;
      const current = frontByCol.get(e.col);
      if (!current || e.row > current.row) {
        frontByCol.set(e.col, e);
      }
    }
    const shooters = Array.from(frontByCol.values());
    if (shooters.length === 0) return;

    const shooter = shooters[Math.floor(Math.random() * shooters.length)];
    enemyBullets.push({
      x: enemyX(shooter) + ENEMY_W / 2 - ENEMY_BULLET_W / 2,
      y: enemyY(shooter) + ENEMY_H,
      w: ENEMY_BULLET_W,
      h: ENEMY_BULLET_H,
      dy: ENEMY_BULLET_SPEED
    });
  }

  function update(dt) {
    // 自機
    const dir = playerDirection();
    if (dir !== 0) {
      player.x += dir * player.speed * dt;
      player.x = Math.max(0, Math.min(W - player.w, player.x));
    }

    if (state !== STATE.PLAYING) {
      return;
    }

    updateEnemyBlock(dt);

    if (Math.random() < ENEMY_FIRE_CHANCE_PER_SEC * dt) {
      fireEnemyBullet();
    }

    // 自機弾
    if (playerBullet) {
      playerBullet.y += playerBullet.dy * dt;
      if (playerBullet.y + playerBullet.h < 0) {
        playerBullet = null;
      }
    }

    // 敵弾
    for (const b of enemyBullets) {
      b.y += b.dy * dt;
    }
    enemyBullets = enemyBullets.filter((b) => b.y < H);

    // 自機弾 × 敵
    if (playerBullet) {
      for (const e of enemies) {
        if (!e.alive) continue;
        const ex = enemyX(e);
        const ey = enemyY(e);
        if (
          playerBullet.x < ex + ENEMY_W &&
          playerBullet.x + playerBullet.w > ex &&
          playerBullet.y < ey + ENEMY_H &&
          playerBullet.y + playerBullet.h > ey
        ) {
          e.alive = false;
          playerBullet = null;
          break;
        }
      }
    }

    // 敵弾 × 自機
    for (const b of enemyBullets) {
      if (
        b.x < player.x + player.w &&
        b.x + b.w > player.x &&
        b.y < PLAYER_Y + player.h &&
        b.y + b.h > PLAYER_Y
      ) {
        state = STATE.OVER;
        return;
      }
    }

    // 侵略判定
    for (const e of enemies) {
      if (!e.alive) continue;
      if (enemyY(e) + ENEMY_H >= PLAYER_Y) {
        state = STATE.OVER;
        return;
      }
    }

    // クリア判定
    if (aliveCount() === 0) {
      state = STATE.CLEAR;
    }
  }

  // --- 描画 -------------------------------------------------------------
  function draw() {
    const { fg, accent } = SKT.themeColors();

    ctx.clearRect(0, 0, W, H);

    // 敵
    for (const e of enemies) {
      if (!e.alive) continue;
      ctx.fillStyle = accent;
      ctx.globalAlpha = 1 - e.row * 0.13;
      ctx.fillRect(enemyX(e), enemyY(e), ENEMY_W, ENEMY_H);
    }
    ctx.globalAlpha = 1;

    // 自機
    ctx.fillStyle = fg;
    ctx.fillRect(player.x, PLAYER_Y, player.w, player.h);

    // 弾
    if (playerBullet) {
      ctx.fillRect(playerBullet.x, playerBullet.y, playerBullet.w, playerBullet.h);
    }
    for (const b of enemyBullets) {
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }

    // メッセージ
    if (state !== STATE.PLAYING) {
      ctx.fillStyle = fg;
      ctx.textAlign = 'center';

      if (state === STATE.READY) {
        ctx.font = '16px sans-serif';
        ctx.fillText('Press Space to start', W / 2, H / 2 + 40);
      } else {
        ctx.font = 'bold 34px sans-serif';
        ctx.fillText(state === STATE.CLEAR ? 'CLEAR!' : 'GAME OVER', W / 2, H / 2);
        ctx.font = '16px sans-serif';
        ctx.fillText('Press Space to restart', W / 2, H / 2 + 34);
      }
    }
  }

  // --- ループ -------------------------------------------------------------
  newGame();
  SKT.runLoop({ update, draw });
})();
