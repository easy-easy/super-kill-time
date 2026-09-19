// @ts-check
(function () {
  'use strict';

  const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('game'));
  const ctx = canvas.getContext('2d');

  // 論理サイズは固定。表示サイズは CSS 側で拡縮する。
  const W = canvas.width;
  const H = canvas.height;

  // --- ゲーム設定 -------------------------------------------------------
  const PADDLE_W = 96;
  const PADDLE_H = 12;
  const PADDLE_Y = H - 32;
  const PADDLE_SPEED = 460; // px/sec

  const BALL_R = 6;
  const BALL_SPEED = 340; // px/sec
  const MAX_BOUNCE_ANGLE = (60 * Math.PI) / 180;

  const BRICK_COLS = 10;
  const BRICK_ROWS = 5;
  const BRICK_GAP = 4;
  const BRICK_TOP = 48;
  const BRICK_SIDE = 24;
  const BRICK_H = 20;
  const BRICK_W = (W - BRICK_SIDE * 2 - BRICK_GAP * (BRICK_COLS - 1)) / BRICK_COLS;

  const STATE = { READY: 'ready', PLAYING: 'playing', OVER: 'over', CLEAR: 'clear' };

  // --- 状態 -------------------------------------------------------------
  const paddle = { x: (W - PADDLE_W) / 2, w: PADDLE_W, h: PADDLE_H, speed: PADDLE_SPEED };
  const ball = { x: 0, y: 0, dx: 0, dy: 0, r: BALL_R };
  /** @type {{x: number, y: number, row: number, alive: boolean}[]} */
  let bricks = [];
  let state = STATE.READY;

  const pressed = new Set();

  // --- 初期化 -----------------------------------------------------------
  function buildBricks() {
    const list = [];
    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        list.push({
          x: BRICK_SIDE + col * (BRICK_W + BRICK_GAP),
          y: BRICK_TOP + row * (BRICK_H + BRICK_GAP),
          row,
          alive: true
        });
      }
    }
    return list;
  }

  function resetBall() {
    ball.x = paddle.x + paddle.w / 2;
    ball.y = PADDLE_Y - BALL_R - 1;
    ball.dx = 0;
    ball.dy = 0;
  }

  function newGame() {
    bricks = buildBricks();
    paddle.x = (W - PADDLE_W) / 2;
    resetBall();
    state = STATE.READY;
  }

  function launchBall() {
    // 真上からわずかにずらして打ち出す
    const angle = (-Math.PI / 2) + (Math.random() - 0.5) * (Math.PI / 6);
    ball.dx = Math.cos(angle) * BALL_SPEED;
    ball.dy = Math.sin(angle) * BALL_SPEED;
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
        launchBall();
      } else if (state === STATE.OVER || state === STATE.CLEAR) {
        newGame();
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    pressed.delete(e.key);
  });

  // ウィンドウからフォーカスが外れたらキーの押しっぱなしを解除する
  window.addEventListener('blur', () => pressed.clear());

  function paddleDirection() {
    let dir = 0;
    if (pressed.has('ArrowLeft') || pressed.has('a') || pressed.has('A')) dir -= 1;
    if (pressed.has('ArrowRight') || pressed.has('d') || pressed.has('D')) dir += 1;
    return dir;
  }

  // --- 更新 -------------------------------------------------------------
  function update(dt) {
    // パドル
    const dir = paddleDirection();
    if (dir !== 0) {
      paddle.x += dir * paddle.speed * dt;
      paddle.x = Math.max(0, Math.min(W - paddle.w, paddle.x));
    }

    if (state === STATE.READY) {
      // 発射前はパドルに追従させる
      ball.x = paddle.x + paddle.w / 2;
      ball.y = PADDLE_Y - BALL_R - 1;
      return;
    }

    if (state !== STATE.PLAYING) {
      return;
    }

    ball.x += ball.dx * dt;
    ball.y += ball.dy * dt;

    // 壁
    if (ball.x - ball.r < 0) {
      ball.x = ball.r;
      ball.dx = Math.abs(ball.dx);
    } else if (ball.x + ball.r > W) {
      ball.x = W - ball.r;
      ball.dx = -Math.abs(ball.dx);
    }
    if (ball.y - ball.r < 0) {
      ball.y = ball.r;
      ball.dy = Math.abs(ball.dy);
    }

    // パドル（下向きに進んでいるときだけ判定する）
    if (
      ball.dy > 0 &&
      ball.y + ball.r >= PADDLE_Y &&
      ball.y - ball.r <= PADDLE_Y + paddle.h &&
      ball.x >= paddle.x &&
      ball.x <= paddle.x + paddle.w
    ) {
      // 当たった位置（-1..1）で反射角を決める
      const offset = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
      const angle = offset * MAX_BOUNCE_ANGLE;
      ball.dx = Math.sin(angle) * BALL_SPEED;
      ball.dy = -Math.cos(angle) * BALL_SPEED;
      ball.y = PADDLE_Y - ball.r;
    }

    // ブロック
    for (const b of bricks) {
      if (!b.alive) continue;
      if (
        ball.x + ball.r < b.x ||
        ball.x - ball.r > b.x + BRICK_W ||
        ball.y + ball.r < b.y ||
        ball.y - ball.r > b.y + BRICK_H
      ) {
        continue;
      }

      b.alive = false;

      // ブロック中心からのめり込み量が小さい軸で反射させる
      const overlapX =
        ball.r + BRICK_W / 2 - Math.abs(ball.x - (b.x + BRICK_W / 2));
      const overlapY =
        ball.r + BRICK_H / 2 - Math.abs(ball.y - (b.y + BRICK_H / 2));
      if (overlapX < overlapY) {
        ball.dx = -ball.dx;
      } else {
        ball.dy = -ball.dy;
      }
      break; // 1 フレームに壊すのは 1 個まで
    }

    // 落下
    if (ball.y - ball.r > H) {
      state = STATE.OVER;
      return;
    }

    // クリア
    if (!bricks.some((b) => b.alive)) {
      state = STATE.CLEAR;
    }
  }

  // --- 描画 -------------------------------------------------------------
  function draw() {
    const { fg, accent } = SKT.themeColors();

    ctx.clearRect(0, 0, W, H);

    // ブロック
    for (const b of bricks) {
      if (!b.alive) continue;
      ctx.fillStyle = accent;
      ctx.globalAlpha = 1 - b.row * 0.13;
      ctx.fillRect(b.x, b.y, BRICK_W, BRICK_H);
    }
    ctx.globalAlpha = 1;

    // パドル
    ctx.fillStyle = fg;
    ctx.fillRect(paddle.x, PADDLE_Y, paddle.w, paddle.h);

    // ボール
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();

    // メッセージ
    if (state !== STATE.PLAYING) {
      ctx.fillStyle = fg;
      ctx.textAlign = 'center';

      if (state === STATE.READY) {
        ctx.font = '16px sans-serif';
        ctx.fillText('Press Space to launch', W / 2, H / 2 + 40);
      } else {
        ctx.font = 'bold 34px sans-serif';
        ctx.fillText(state === STATE.CLEAR ? 'CLEAR!' : 'GAME OVER', W / 2, H / 2);
        ctx.font = '16px sans-serif';
        ctx.fillText('Press Space to restart', W / 2, H / 2 + 34);
      }
    }
  }

  // --- ループ -----------------------------------------------------------
  newGame();
  SKT.runLoop({ update, draw });
})();
