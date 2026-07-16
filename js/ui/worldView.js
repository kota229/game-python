// worldView.js — マップ描画とトレース再生アニメーション（Canvas / 自作グラフィック）。
// ブラウザ専用（Node テストからは読み込まない）。

const DIR_ANGLE = [-Math.PI / 2, 0, Math.PI / 2, Math.PI]; // 0上,1右,2下,3左

const key = (x, y) => `${x},${y}`;

export function createWorldView(canvas) {
  const ctx = canvas.getContext('2d');
  let stage = null;
  let cols = 5, rows = 5;
  let walls = new Set();
  let goal = null;
  let gems = new Set();       // 表示上の残ジェム
  let robot = { x: 0, y: 0, dir: 1 };
  let bumpFlash = 0;          // ぶつかった演出用カウンタ

  function setStage(s) {
    stage = s;
    cols = s.grid.cols; rows = s.grid.rows;
    walls = new Set((s.walls || []).map((c) => key(c.x, c.y)));
    goal = s.goal || null;
    reset();
  }

  function reset() {
    gems = new Set((stage.gems || []).map((c) => key(c.x, c.y)));
    robot = { x: stage.robot.x, y: stage.robot.y, dir: stage.robot.dir ?? 1 };
    bumpFlash = 0;
    render();
  }

  // 盤面の1マスのピクセルサイズと原点を計算（正方形セル・中央寄せ）
  function layout() {
    const W = canvas.width, H = canvas.height;
    const pad = Math.round(Math.min(W, H) * 0.04);
    const cell = Math.floor(Math.min((W - pad * 2) / cols, (H - pad * 2) / rows));
    const ox = Math.round((W - cell * cols) / 2);
    const oy = Math.round((H - cell * rows) / 2);
    return { cell, ox, oy };
  }

  function render() {
    const { cell, ox, oy } = layout();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 背景の草原
    ctx.fillStyle = '#dcfce7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // タイル
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const px = ox + x * cell, py = oy + y * cell;
        const wall = walls.has(key(x, y));
        ctx.fillStyle = wall ? '#4b5563' : ((x + y) % 2 ? '#bbf7d0' : '#d1fae5');
        ctx.fillRect(px, py, cell, cell);
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, cell, cell);
        if (wall) {
          ctx.fillStyle = '#374151';
          ctx.font = `${cell * 0.5}px sans-serif`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('🧱', px + cell / 2, py + cell / 2);
        }
      }
    }

    // ゴール（旗）
    if (goal) drawEmoji('🚩', goal.x, goal.y, cell, ox, oy, 0.7);
    // ジェム
    for (const k of gems) {
      const [gx, gy] = k.split(',').map(Number);
      drawEmoji('💎', gx, gy, cell, ox, oy, 0.6);
    }
    // ロボット
    drawRobot(cell, ox, oy);
  }

  function drawEmoji(ch, x, y, cell, ox, oy, scale) {
    ctx.font = `${cell * scale}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(ch, ox + x * cell + cell / 2, oy + y * cell + cell / 2);
  }

  function drawRobot(cell, ox, oy) {
    const cx = ox + robot.x * cell + cell / 2;
    const cy = oy + robot.y * cell + cell / 2;
    const r = cell * 0.34;
    ctx.save();
    ctx.translate(cx, cy);

    // ぶつかった時の赤フラッシュ
    if (bumpFlash > 0) {
      ctx.fillStyle = `rgba(239,68,68,${0.3 * bumpFlash})`;
      ctx.beginPath(); ctx.arc(0, 0, cell * 0.48, 0, Math.PI * 2); ctx.fill();
    }

    // 体
    ctx.fillStyle = '#2563eb';
    roundRect(-r, -r, r * 2, r * 2, r * 0.4);
    ctx.fill();
    // 顔（白）
    ctx.fillStyle = '#e0f2fe';
    roundRect(-r * 0.7, -r * 0.7, r * 1.4, r * 1.1, r * 0.3);
    ctx.fill();
    // 目
    ctx.fillStyle = '#1e293b';
    ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.15, r * 0.16, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.3, -r * 0.15, r * 0.16, 0, Math.PI * 2); ctx.fill();
    // 向きの矢印（顔の向き）
    ctx.rotate(DIR_ANGLE[robot.dir]);
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(r * 0.95, 0);
    ctx.lineTo(r * 0.55, -r * 0.3);
    ctx.lineTo(r * 0.55, r * 0.3);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function roundRect(x, y, w, h, rad) {
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }

  // --- アニメーション ---
  // trace を1ステップずつ再生する。callbacks: onStep(step)（効果音用）
  function play(trace, { stepMs = 380, onStep } = {}) {
    return new Promise((resolve) => {
      let i = 0;
      const from = { x: robot.x, y: robot.y, dir: robot.dir };
      let prev = { ...from };

      function nextStep() {
        if (i >= trace.length) { resolve(); return; }
        const step = trace[i];
        const target = step.robot;
        if (onStep) onStep(step);

        const startX = prev.x, startY = prev.y;
        const startDir = prev.dir;
        // 向きの差を最短回転で補間
        let dDir = target.dir - startDir;
        if (dDir > 2) dDir -= 4; if (dDir < -2) dDir += 4;

        const t0 = performance.now();
        function frame(now) {
          const t = Math.min(1, (now - t0) / stepMs);
          const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          robot.x = startX + (target.x - startX) * ease;
          robot.y = startY + (target.y - startY) * ease;
          robot.dir = startDir + dDir * ease;
          if (step.bumped) {
            // ぶつかり: 少し前に出て戻る演出
            bumpFlash = Math.sin(t * Math.PI);
          }
          render();
          if (t < 1) {
            requestAnimationFrame(frame);
          } else {
            robot.x = target.x; robot.y = target.y;
            robot.dir = ((target.dir % 4) + 4) % 4;
            bumpFlash = 0;
            // collect 済みならジェムを消す
            if (step.action === 'collect' && step.picked) {
              gems.delete(key(target.x, target.y));
            }
            render();
            prev = { x: target.x, y: target.y, dir: target.dir };
            i++;
            setTimeout(nextStep, 40);
          }
        }
        requestAnimationFrame(frame);
      }
      nextStep();
    });
  }

  return { setStage, reset, render, play, layout };
}
