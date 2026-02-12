/* ============================================
   Unicode Step Spinners — Main Script
   ============================================ */

/* -------------------------------------------
   Braille Grid Utility

   Each braille char is a 2-col x 4-row dot grid.
   Dot numbering & bit values:
     Row 0:  dot1 (0x01)  dot4 (0x08)
     Row 1:  dot2 (0x02)  dot5 (0x10)
     Row 2:  dot3 (0x04)  dot6 (0x20)
     Row 3:  dot7 (0x40)  dot8 (0x80)

   Base codepoint: U+2800
   ------------------------------------------- */
const BRAILLE_DOT_MAP = [
  [0x01, 0x08], // row 0
  [0x02, 0x10], // row 1
  [0x04, 0x20], // row 2
  [0x40, 0x80], // row 3
];

/**
 * Convert a 2D boolean grid into a braille string.
 * grid[row][col] = true means dot is raised.
 * Width must be even (2 dot-columns per braille char).
 */
function gridToBraille(grid) {
  const rows = grid.length;
  const cols = grid[0] ? grid[0].length : 0;
  const charCount = Math.ceil(cols / 2);
  let result = '';
  for (let c = 0; c < charCount; c++) {
    let code = 0x2800;
    for (let r = 0; r < 4 && r < rows; r++) {
      for (let d = 0; d < 2; d++) {
        const col = c * 2 + d;
        if (col < cols && grid[r] && grid[r][col]) {
          code |= BRAILLE_DOT_MAP[r][d];
        }
      }
    }
    result += String.fromCodePoint(code);
  }
  return result;
}

/** Create an empty grid of given dimensions */
function makeGrid(rows, cols) {
  return Array.from({ length: rows }, () => Array(cols).fill(false));
}

/* -------------------------------------------
   Braille Grid Frame Generators
   ------------------------------------------- */

// 1. Scan — bright vertical band sweeping L→R (4 chars = 8 cols)
function genScan() {
  const W = 8, H = 4, frames = [];
  for (let pos = -1; pos < W + 1; pos++) {
    const g = makeGrid(H, W);
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        if (c === pos || c === pos - 1) g[r][c] = true;
      }
    }
    frames.push(gridToBraille(g));
  }
  return frames;
}

// 2. Rain — dots falling down columns at staggered offsets (4 chars = 8 cols)
function genRain() {
  const W = 8, H = 4, totalFrames = 12, frames = [];
  const offsets = [0, 3, 1, 5, 2, 7, 4, 6]; // stagger per column
  for (let f = 0; f < totalFrames; f++) {
    const g = makeGrid(H, W);
    for (let c = 0; c < W; c++) {
      const row = (f + offsets[c]) % (H + 2); // +2 for gap
      if (row < H) g[row][c] = true;
    }
    frames.push(gridToBraille(g));
  }
  return frames;
}

// 3. Scan Line — horizontal line sweeping top→bottom (3 chars = 6 cols)
function genScanLine() {
  const W = 6, H = 4, frames = [];
  // Sweep down, then back up
  const positions = [0, 1, 2, 3, 2, 1];
  for (const row of positions) {
    const g = makeGrid(H, W);
    for (let c = 0; c < W; c++) {
      g[row][c] = true;
      // Faint trail
      if (row > 0) g[row - 1][c] = (c % 2 === 0);
    }
    frames.push(gridToBraille(g));
  }
  return frames;
}

// 4. Pulse — dots expanding from center outward, then contracting (3 chars = 6 cols)
function genPulse() {
  const W = 6, H = 4, frames = [];
  const cx = W / 2 - 0.5, cy = H / 2 - 0.5;
  const radii = [0.5, 1.2, 2, 3, 3.5];
  for (const r of radii) {
    const g = makeGrid(H, W);
    for (let row = 0; row < H; row++) {
      for (let col = 0; col < W; col++) {
        const dist = Math.sqrt((col - cx) ** 2 + (row - cy) ** 2);
        if (Math.abs(dist - r) < 0.9) g[row][col] = true;
      }
    }
    frames.push(gridToBraille(g));
  }
  return frames;
}

// 5. Snake — dot snaking through a 2-char grid (2 chars = 4 cols)
function genSnake() {
  const W = 4, H = 4;
  // Snake path: left→right on row 0, then right→left on row 1, etc.
  const path = [];
  for (let r = 0; r < H; r++) {
    if (r % 2 === 0) {
      for (let c = 0; c < W; c++) path.push([r, c]);
    } else {
      for (let c = W - 1; c >= 0; c--) path.push([r, c]);
    }
  }
  const frames = [];
  for (let i = 0; i < path.length; i++) {
    const g = makeGrid(H, W);
    // Draw tail (3 dots behind head)
    for (let t = 0; t < 4; t++) {
      const idx = (i - t + path.length) % path.length;
      g[path[idx][0]][path[idx][1]] = true;
    }
    frames.push(gridToBraille(g));
  }
  return frames;
}

// 6. Sparkle — random-looking dots twinkling (4 chars = 8 cols)
function genSparkle() {
  // Predefined "random" patterns that look like twinkling
  const patterns = [
    [1,0,0,1,0,0,1,0, 0,0,1,0,0,1,0,0, 0,1,0,0,1,0,0,1, 1,0,0,0,0,1,0,0],
    [0,1,0,0,1,0,0,1, 1,0,0,1,0,0,0,1, 0,0,0,1,0,1,0,0, 0,0,1,0,1,0,1,0],
    [0,0,1,0,0,1,0,0, 0,1,0,0,0,0,1,0, 1,0,1,0,0,0,0,1, 0,1,0,1,0,0,0,1],
    [1,0,0,0,0,0,1,1, 0,0,1,0,1,0,0,0, 0,0,0,0,1,0,1,0, 1,0,0,1,0,0,1,0],
    [0,0,0,1,1,0,0,0, 0,1,0,0,0,1,0,1, 1,0,0,1,0,0,0,0, 0,1,0,0,0,1,0,1],
    [0,1,1,0,0,0,0,1, 0,0,0,1,0,0,1,0, 0,1,0,0,0,1,0,0, 0,0,1,0,1,0,0,0],
  ];
  const W = 8, H = 4, frames = [];
  for (const pat of patterns) {
    const g = makeGrid(H, W);
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        g[r][c] = !!pat[r * W + c];
      }
    }
    frames.push(gridToBraille(g));
  }
  return frames;
}

// 7. Cascade — diagonal band sweeping top-left to bottom-right (4 chars = 8 cols)
function genCascade() {
  const W = 8, H = 4, frames = [];
  for (let offset = -2; offset < W + H; offset++) {
    const g = makeGrid(H, W);
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        const diag = c + r;
        if (diag === offset || diag === offset - 1) g[r][c] = true;
      }
    }
    frames.push(gridToBraille(g));
  }
  return frames;
}

// 8. Columns — columns filling up one by one, then clearing (3 chars = 6 cols)
function genColumns() {
  const W = 6, H = 4, frames = [];
  // Fill each column bottom-to-top, then clear
  for (let col = 0; col < W; col++) {
    for (let fillTo = H - 1; fillTo >= 0; fillTo--) {
      const g = makeGrid(H, W);
      // Previously filled columns
      for (let pc = 0; pc < col; pc++) {
        for (let r = 0; r < H; r++) g[r][pc] = true;
      }
      // Current column filling
      for (let r = fillTo; r < H; r++) g[r][col] = true;
      frames.push(gridToBraille(g));
    }
  }
  // Full
  const full = makeGrid(H, W);
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) full[r][c] = true;
  frames.push(gridToBraille(full));
  // Empty
  frames.push(gridToBraille(makeGrid(H, W)));
  return frames;
}

// 9. Orbit — a dot circling the perimeter of a single braille cell (1 char = 2 cols)
function genOrbit() {
  const W = 2, H = 4;
  // Perimeter path: top-left → top-right → down right side → bottom-right → bottom-left → up left side
  const path = [
    [0,0], [0,1],
    [1,1], [2,1], [3,1],
    [3,0],
    [2,0], [1,0],
  ];
  const frames = [];
  for (let i = 0; i < path.length; i++) {
    const g = makeGrid(H, W);
    // Head
    g[path[i][0]][path[i][1]] = true;
    // Trail
    const t1 = (i - 1 + path.length) % path.length;
    g[path[t1][0]][path[t1][1]] = true;
    frames.push(gridToBraille(g));
  }
  return frames;
}

// 10. Breathe — single char filling from empty → sparse → dense → full → back (1 char = 2 cols)
function genBreathe() {
  const stages = [
    [],                                    // empty
    [[1,0]],                               // 1 dot
    [[0,1],[2,0]],                         // 2 dots
    [[0,0],[1,1],[3,0]],                   // 3 dots
    [[0,0],[1,1],[2,0],[3,1]],             // 4 dots
    [[0,0],[0,1],[1,1],[2,0],[3,1]],       // 5 dots
    [[0,0],[0,1],[1,0],[2,1],[3,0],[3,1]], // 6 dots
    [[0,0],[0,1],[1,0],[1,1],[2,0],[3,0],[3,1]], // 7 dots
    [[0,0],[0,1],[1,0],[1,1],[2,0],[2,1],[3,0],[3,1]], // full
  ];
  const frames = [];
  const sequence = [...stages, ...stages.slice().reverse().slice(1)];
  for (const dots of sequence) {
    const g = makeGrid(4, 2);
    for (const [r, c] of dots) g[r][c] = true;
    frames.push(gridToBraille(g));
  }
  return frames;
}

// 11. Wave Rows — each row lights up in a wave, offset per column (4 chars = 8 cols)
function genWaveRows() {
  const W = 8, H = 4, totalFrames = 16, frames = [];
  for (let f = 0; f < totalFrames; f++) {
    const g = makeGrid(H, W);
    for (let c = 0; c < W; c++) {
      const phase = (f - c * 0.5);
      const row = Math.round((Math.sin(phase * 0.8) + 1) / 2 * (H - 1));
      g[row][c] = true;
      // Sub-dot for smoother look
      if (row > 0) g[row - 1][c] = (f + c) % 3 === 0;
    }
    frames.push(gridToBraille(g));
  }
  return frames;
}

// 12. Checkerboard — alternating checkerboard pattern flipping (3 chars = 6 cols)
function genCheckerboard() {
  const W = 6, H = 4, frames = [];
  for (let phase = 0; phase < 4; phase++) {
    const g = makeGrid(H, W);
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        if (phase < 2) {
          g[r][c] = (r + c + phase) % 2 === 0;
        } else {
          // Partial — only some dots
          g[r][c] = (r + c + phase) % 3 === 0;
        }
      }
    }
    frames.push(gridToBraille(g));
  }
  return frames;
}

// 13. Helix — two dots orbiting in opposite directions across a wide grid (4 chars = 8 cols)
function genHelix() {
  const W = 8, H = 4, totalFrames = 16, frames = [];
  for (let f = 0; f < totalFrames; f++) {
    const g = makeGrid(H, W);
    for (let c = 0; c < W; c++) {
      const phase = (f + c) * (Math.PI / 4);
      const y1 = Math.round((Math.sin(phase) + 1) / 2 * (H - 1));
      const y2 = Math.round((Math.sin(phase + Math.PI) + 1) / 2 * (H - 1));
      g[y1][c] = true;
      g[y2][c] = true;
    }
    frames.push(gridToBraille(g));
  }
  return frames;
}

// 14. Fill Sweep — bottom-to-top fill, then top-to-bottom clear (2 chars = 4 cols)
function genFillSweep() {
  const W = 4, H = 4, frames = [];
  // Fill from bottom
  for (let row = H - 1; row >= 0; row--) {
    const g = makeGrid(H, W);
    for (let r = row; r < H; r++) {
      for (let c = 0; c < W; c++) g[r][c] = true;
    }
    frames.push(gridToBraille(g));
  }
  // Hold full for 2 frames
  const full = makeGrid(H, W);
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) full[r][c] = true;
  frames.push(gridToBraille(full));
  frames.push(gridToBraille(full));
  // Clear from top
  for (let row = 0; row < H; row++) {
    const g = makeGrid(H, W);
    for (let r = row + 1; r < H; r++) {
      for (let c = 0; c < W; c++) g[r][c] = true;
    }
    frames.push(gridToBraille(g));
  }
  // Empty
  frames.push(gridToBraille(makeGrid(H, W)));
  return frames;
}

// 15. Diagonal Swipe — diagonal band fills top-left to bottom-right, leaves trail, then clears (4x4 grid, 2 chars)
function genDiagonalSwipe() {
  const W = 4, H = 4, frames = [];
  const maxDiag = W + H - 2;
  // Fill: each frame adds the next diagonal
  for (let d = 0; d <= maxDiag; d++) {
    const g = makeGrid(H, W);
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        if (r + c <= d) g[r][c] = true;
      }
    }
    frames.push(gridToBraille(g));
  }
  // Hold full for a beat
  const full = makeGrid(H, W);
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) full[r][c] = true;
  frames.push(gridToBraille(full));
  // Clear: each frame removes the next diagonal from top-left
  for (let d = 0; d <= maxDiag; d++) {
    const g = makeGrid(H, W);
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        if (r + c > d) g[r][c] = true;
      }
    }
    frames.push(gridToBraille(g));
  }
  // Empty
  frames.push(gridToBraille(makeGrid(H, W)));
  return frames;
}

/* -------------------------------------------
   Uniform 3-char (6 cols × 4 rows) Generators
   ------------------------------------------- */

function gen3Scan() {
  const W = 6, H = 4, frames = [];
  for (let pos = -1; pos <= W; pos++) {
    const g = makeGrid(H, W);
    for (let r = 0; r < H; r++) {
      if (pos >= 0 && pos < W) g[r][pos] = true;
      if (pos - 1 >= 0 && pos - 1 < W) g[r][pos - 1] = true;
    }
    frames.push(gridToBraille(g));
  }
  return frames;
}

function gen3Rain() {
  const W = 6, H = 4, totalFrames = 10, frames = [];
  const offsets = [0, 3, 1, 4, 2, 5];
  for (let f = 0; f < totalFrames; f++) {
    const g = makeGrid(H, W);
    for (let c = 0; c < W; c++) {
      const row = (f + offsets[c]) % (H + 2);
      if (row < H) g[row][c] = true;
    }
    frames.push(gridToBraille(g));
  }
  return frames;
}

function gen3Pulse() {
  const W = 6, H = 4, frames = [];
  const cx = W / 2 - 0.5, cy = H / 2 - 0.5;
  const radii = [0.5, 1.2, 2, 3];
  for (const r of radii) {
    const g = makeGrid(H, W);
    for (let row = 0; row < H; row++) {
      for (let col = 0; col < W; col++) {
        const dist = Math.sqrt((col - cx) ** 2 + (row - cy) ** 2);
        if (Math.abs(dist - r) < 0.9) g[row][col] = true;
      }
    }
    frames.push(gridToBraille(g));
  }
  return frames;
}

function gen3Snake() {
  const W = 6, H = 4;
  const path = [];
  for (let r = 0; r < H; r++) {
    if (r % 2 === 0) {
      for (let c = 0; c < W; c++) path.push([r, c]);
    } else {
      for (let c = W - 1; c >= 0; c--) path.push([r, c]);
    }
  }
  const frames = [];
  for (let i = 0; i < path.length; i++) {
    const g = makeGrid(H, W);
    for (let t = 0; t < 4; t++) {
      const idx = (i - t + path.length) % path.length;
      g[path[idx][0]][path[idx][1]] = true;
    }
    frames.push(gridToBraille(g));
  }
  return frames;
}

function gen3Cascade() {
  const W = 6, H = 4, frames = [];
  for (let offset = -2; offset < W + H; offset++) {
    const g = makeGrid(H, W);
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        const diag = c + r;
        if (diag === offset || diag === offset - 1) g[r][c] = true;
      }
    }
    frames.push(gridToBraille(g));
  }
  return frames;
}

function gen3Columns() {
  const W = 6, H = 4, frames = [];
  for (let col = 0; col < W; col++) {
    for (let fillTo = H - 1; fillTo >= 0; fillTo--) {
      const g = makeGrid(H, W);
      for (let pc = 0; pc < col; pc++) {
        for (let r = 0; r < H; r++) g[r][pc] = true;
      }
      for (let r = fillTo; r < H; r++) g[r][col] = true;
      frames.push(gridToBraille(g));
    }
  }
  const full = makeGrid(H, W);
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) full[r][c] = true;
  frames.push(gridToBraille(full));
  frames.push(gridToBraille(makeGrid(H, W)));
  return frames;
}

function gen3Helix() {
  const W = 6, H = 4, totalFrames = 12, frames = [];
  for (let f = 0; f < totalFrames; f++) {
    const g = makeGrid(H, W);
    for (let c = 0; c < W; c++) {
      const phase = (f + c) * (Math.PI / 3);
      const y1 = Math.round((Math.sin(phase) + 1) / 2 * (H - 1));
      const y2 = Math.round((Math.sin(phase + Math.PI) + 1) / 2 * (H - 1));
      g[y1][c] = true;
      g[y2][c] = true;
    }
    frames.push(gridToBraille(g));
  }
  return frames;
}

function gen3Wave() {
  const W = 6, H = 4, totalFrames = 12, frames = [];
  for (let f = 0; f < totalFrames; f++) {
    const g = makeGrid(H, W);
    for (let c = 0; c < W; c++) {
      const phase = (f - c * 0.6);
      const row = Math.round((Math.sin(phase * 0.9) + 1) / 2 * (H - 1));
      g[row][c] = true;
    }
    frames.push(gridToBraille(g));
  }
  return frames;
}

function gen3DiagSwipe() {
  const W = 6, H = 4, frames = [];
  const bandWidth = 2;
  const range = W + H - 1 + bandWidth;
  for (let s = -bandWidth; s < range; s++) {
    const g = makeGrid(H, W);
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        const diag = r + c;
        if (diag >= s && diag < s + bandWidth) g[r][c] = true;
      }
    }
    frames.push(gridToBraille(g));
  }
  for (let s = range - 1; s >= -bandWidth; s--) {
    const g = makeGrid(H, W);
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        const diag = r + c;
        if (diag >= s && diag < s + bandWidth) g[r][c] = true;
      }
    }
    frames.push(gridToBraille(g));
  }
  return frames;
}

function gen3Sparkle() {
  const W = 6, H = 4, frames = [];
  const patterns = [
    [1,0,0,1,0,0, 0,0,1,0,0,1, 0,1,0,0,1,0, 1,0,0,0,0,1],
    [0,1,0,0,1,0, 1,0,0,1,0,0, 0,0,0,1,0,1, 0,0,1,0,1,0],
    [0,0,1,0,0,1, 0,1,0,0,0,0, 1,0,1,0,0,0, 0,1,0,1,0,0],
    [1,0,0,0,0,0, 0,0,1,0,1,0, 0,0,0,0,1,0, 1,0,0,1,0,1],
    [0,0,0,1,1,0, 0,1,0,0,0,1, 1,0,0,1,0,0, 0,1,0,0,0,1],
    [0,1,1,0,0,0, 0,0,0,1,0,0, 0,1,0,0,0,1, 0,0,1,0,1,0],
  ];
  for (const pat of patterns) {
    const g = makeGrid(H, W);
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        g[r][c] = !!pat[r * W + c];
      }
    }
    frames.push(gridToBraille(g));
  }
  return frames;
}

function gen3Checkerboard() {
  const W = 6, H = 4, frames = [];
  for (let phase = 0; phase < 4; phase++) {
    const g = makeGrid(H, W);
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        if (phase < 2) {
          g[r][c] = (r + c + phase) % 2 === 0;
        } else {
          g[r][c] = (r + c + phase) % 3 === 0;
        }
      }
    }
    frames.push(gridToBraille(g));
  }
  return frames;
}

function gen3FillSweep() {
  const W = 6, H = 4, frames = [];
  for (let row = H - 1; row >= 0; row--) {
    const g = makeGrid(H, W);
    for (let r = row; r < H; r++) {
      for (let c = 0; c < W; c++) g[r][c] = true;
    }
    frames.push(gridToBraille(g));
  }
  const full = makeGrid(H, W);
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) full[r][c] = true;
  frames.push(gridToBraille(full));
  frames.push(gridToBraille(full));
  for (let row = 0; row < H; row++) {
    const g = makeGrid(H, W);
    for (let r = row + 1; r < H; r++) {
      for (let c = 0; c < W; c++) g[r][c] = true;
    }
    frames.push(gridToBraille(g));
  }
  frames.push(gridToBraille(makeGrid(H, W)));
  return frames;
}

function gen3ScanLine() {
  const W = 6, H = 4, frames = [];
  const positions = [0, 1, 2, 3];
  for (const row of positions) {
    const g = makeGrid(H, W);
    for (let c = 0; c < W; c++) {
      g[row][c] = true;
      if (row > 0) g[row - 1][c] = (c % 2 === 0);
    }
    frames.push(gridToBraille(g));
  }
  return frames;
}

/* -------------------------------------------
   Spinner Registry
   ------------------------------------------- */
const SPINNERS = {
  // === Original braille ===
  braille: {
    frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
    interval: 80,
  },
  braillewave: {
    frames: [
      '⠁⠂⠄⡀⢀⠠⠐⠈',
      '⠈⠁⠂⠄⡀⢀⠠⠐',
      '⠐⠈⠁⠂⠄⡀⢀⠠',
      '⠠⠐⠈⠁⠂⠄⡀⢀',
      '⢀⠠⠐⠈⠁⠂⠄⡀',
      '⡀⢀⠠⠐⠈⠁⠂⠄',
      '⠄⡀⢀⠠⠐⠈⠁⠂',
      '⠂⠄⡀⢀⠠⠐⠈⠁',
    ],
    interval: 100,
  },
  dna: {
    frames: [
      '⠋⠉⠙⠚⠒⠂⠂⠒⠲⠴⠤⠄',
      '⠙⠚⠒⠂⠂⠒⠲⠴⠤⠄⠄⠠',
      '⠹⠒⠂⠂⠒⠲⠴⠤⠄⠄⠠⠠',
      '⠸⠂⠂⠒⠲⠴⠤⠄⠄⠠⠠⠄',
      '⠼⠂⠒⠲⠴⠤⠄⠄⠠⠠⠄⠤',
      '⠴⠒⠲⠴⠤⠄⠄⠠⠠⠄⠤⠴',
      '⠦⠲⠴⠤⠄⠄⠠⠠⠄⠤⠴⠲',
      '⠧⠴⠤⠄⠄⠠⠠⠄⠤⠴⠲⠒',
      '⠇⠤⠄⠄⠠⠠⠄⠤⠴⠲⠒⠂',
      '⠏⠄⠄⠠⠠⠄⠤⠴⠲⠒⠂⠂',
      '⠋⠄⠠⠠⠄⠤⠴⠲⠒⠂⠂⠒',
      '⠉⠠⠠⠄⠤⠴⠲⠒⠂⠂⠒⠲',
    ],
    interval: 80,
  },

  // === Generated braille grid animations ===
  scan:         { frames: genScan(),         interval: 70 },
  rain:         { frames: genRain(),         interval: 100 },
  scanline:     { frames: genScanLine(),     interval: 120 },
  pulse:        { frames: genPulse(),        interval: 180 },
  snake:        { frames: genSnake(),        interval: 80 },
  sparkle:      { frames: genSparkle(),      interval: 150 },
  cascade:      { frames: genCascade(),      interval: 60 },
  columns:      { frames: genColumns(),      interval: 60 },
  orbit:        { frames: genOrbit(),        interval: 100 },
  breathe:      { frames: genBreathe(),      interval: 100 },
  waverows:     { frames: genWaveRows(),     interval: 90 },
  checkerboard: { frames: genCheckerboard(), interval: 250 },
  helix:        { frames: genHelix(),        interval: 80 },
  fillsweep:    { frames: genFillSweep(),    interval: 100 },
  diagswipe:    { frames: genDiagonalSwipe(), interval: 60 },

  // === Uniform 3-char grid animations ===
  u3scan:         { frames: gen3Scan(),         interval: 80 },
  u3rain:         { frames: gen3Rain(),         interval: 100 },
  u3pulse:        { frames: gen3Pulse(),        interval: 120 },
  u3snake:        { frames: gen3Snake(),        interval: 70 },
  u3cascade:      { frames: gen3Cascade(),      interval: 70 },
  u3columns:      { frames: gen3Columns(),      interval: 50 },
  u3helix:        { frames: gen3Helix(),        interval: 80 },
  u3wave:         { frames: gen3Wave(),         interval: 90 },
  u3diagswipe:    { frames: gen3DiagSwipe(),    interval: 60 },
  u3sparkle:      { frames: gen3Sparkle(),      interval: 150 },
  u3checkerboard: { frames: gen3Checkerboard(), interval: 250 },
  u3fillsweep:    { frames: gen3FillSweep(),    interval: 100 },
  u3scanline:     { frames: gen3ScanLine(),     interval: 140 },

  // === A few non-braille classics for variety ===
  arc: {
    frames: ['◜', '◠', '◝', '◞', '◡', '◟'],
    interval: 100,
  },
  halfmoon: {
    frames: ['◐', '◓', '◑', '◒'],
    interval: 180,
  },
  line: {
    frames: ['|', '/', '—', '\\'],
    interval: 100,
  },
  blocks: {
    frames: ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█', '▇', '▆', '▅', '▄', '▃', '▂'],
    interval: 100,
  },
};

/* -------------------------------------------
   3×3 → Braille Conversion
   ------------------------------------------- */

/**
 * Convert a 9-element array (3×3 row-major) into a 2-char braille string.
 * Char 1 covers cols 0–1, Char 2 covers col 2.
 * Only rows 0–2 of each braille cell are used.
 */
function grid3x3ToBraille(frame) {
  // Each grid column → its own braille char (left dot-column only, rows 0–2)
  let c1 = 0x2800, c2 = 0x2800, c3 = 0x2800;
  // Row 0
  if (frame[0]) c1 |= 0x01;
  if (frame[1]) c2 |= 0x01;
  if (frame[2]) c3 |= 0x01;
  // Row 1
  if (frame[3]) c1 |= 0x02;
  if (frame[4]) c2 |= 0x02;
  if (frame[5]) c3 |= 0x02;
  // Row 2
  if (frame[6]) c1 |= 0x04;
  if (frame[7]) c2 |= 0x04;
  if (frame[8]) c3 |= 0x04;
  return String.fromCodePoint(c1) + String.fromCodePoint(c2) + String.fromCodePoint(c3);
}

/* -------------------------------------------
   3×3 Dot Grid Animations
   ------------------------------------------- */

// Each pattern is an array of frames, each frame is an array of 9 booleans (row-major: [0,0] [0,1] [0,2] [1,0] ... [2,2])
const DOT_PATTERNS = {
  // Orbit — dot traces the perimeter
  'dot-orbit': {
    frames: [
      [1,0,0, 0,0,0, 0,0,0],
      [0,1,0, 0,0,0, 0,0,0],
      [0,0,1, 0,0,0, 0,0,0],
      [0,0,0, 0,0,1, 0,0,0],
      [0,0,0, 0,0,0, 0,0,1],
      [0,0,0, 0,0,0, 0,1,0],
      [0,0,0, 0,0,0, 1,0,0],
      [0,0,0, 1,0,0, 0,0,0],
    ],
    interval: 100,
  },
  // Pulse — center out and restart
  'dot-pulse': {
    frames: [
      [0,0,0, 0,1,0, 0,0,0],
      [0,1,0, 1,0,1, 0,1,0],
      [1,0,1, 0,0,0, 1,0,1],
      [0,0,0, 0,0,0, 0,0,0],
    ],
    interval: 180,
  },
  // Breathe — fill up then empty
  'dot-breathe': {
    frames: [
      [0,0,0, 0,1,0, 0,0,0],
      [0,1,0, 1,1,1, 0,1,0],
      [1,1,1, 1,1,1, 1,1,1],
      [0,1,0, 1,1,1, 0,1,0],
      [0,0,0, 0,1,0, 0,0,0],
      [0,0,0, 0,0,0, 0,0,0],
    ],
    interval: 160,
  },
  // Diagonal swipe — band top-left to bottom-right
  'dot-diag': {
    frames: [
      [1,0,0, 0,0,0, 0,0,0],
      [0,1,0, 1,0,0, 0,0,0],
      [0,0,1, 0,1,0, 1,0,0],
      [0,0,0, 0,0,1, 0,1,0],
      [0,0,0, 0,0,0, 0,0,1],
      [0,0,0, 0,0,0, 0,0,0],
    ],
    interval: 100,
  },
  // Rain — dots fall down columns staggered
  'dot-rain': {
    frames: [
      [1,0,0, 0,0,1, 0,0,0],
      [0,0,0, 1,0,0, 0,0,1],
      [0,0,1, 0,0,0, 1,0,0],
      [0,1,0, 0,0,1, 0,0,0],
      [0,0,0, 0,1,0, 0,0,1],
      [1,0,0, 0,0,0, 0,1,0],
    ],
    interval: 120,
  },
  // Scan line — row sweep down
  'dot-scan': {
    frames: [
      [1,1,1, 0,0,0, 0,0,0],
      [0,0,0, 1,1,1, 0,0,0],
      [0,0,0, 0,0,0, 1,1,1],
      [0,0,0, 0,0,0, 0,0,0],
    ],
    interval: 150,
  },
  // Columns — fill left to right
  'dot-columns': {
    frames: [
      [1,0,0, 1,0,0, 1,0,0],
      [1,1,0, 1,1,0, 1,1,0],
      [1,1,1, 1,1,1, 1,1,1],
      [0,1,1, 0,1,1, 0,1,1],
      [0,0,1, 0,0,1, 0,0,1],
      [0,0,0, 0,0,0, 0,0,0],
    ],
    interval: 120,
  },
  // Sparkle — random twinkling
  'dot-sparkle': {
    frames: [
      [1,0,0, 0,0,1, 0,1,0],
      [0,1,0, 1,0,0, 0,0,1],
      [0,0,1, 0,1,0, 1,0,0],
      [1,0,1, 0,0,0, 0,1,0],
      [0,1,0, 0,1,0, 1,0,1],
      [0,0,0, 1,0,1, 0,1,0],
    ],
    interval: 150,
  },
  // Snake — winds through grid
  'dot-snake': {
    frames: [
      [1,1,0, 0,0,0, 0,0,0],
      [0,1,1, 0,0,0, 0,0,0],
      [0,0,1, 0,0,1, 0,0,0],
      [0,0,0, 0,1,1, 0,0,0],
      [0,0,0, 1,1,0, 0,0,0],
      [0,0,0, 1,0,0, 1,0,0],
      [0,0,0, 0,0,0, 1,1,0],
      [0,0,0, 0,0,0, 0,1,1],
    ],
    interval: 100,
  },
  // Checkerboard — alternating
  'dot-checker': {
    frames: [
      [1,0,1, 0,1,0, 1,0,1],
      [0,1,0, 1,0,1, 0,1,0],
    ],
    interval: 300,
  },
  // Wave — sine across columns
  'dot-wave': {
    frames: [
      [1,0,0, 0,1,0, 0,0,1],
      [0,0,0, 1,0,1, 0,1,0],
      [0,0,1, 0,1,0, 1,0,0],
      [0,1,0, 1,0,1, 0,0,0],
    ],
    interval: 140,
  },
  // Cross — plus alternating with X
  'dot-cross': {
    frames: [
      [0,1,0, 1,1,1, 0,1,0],
      [1,0,1, 0,1,0, 1,0,1],
    ],
    interval: 350,
  },
  // Spiral — fills inward
  'dot-spiral': {
    frames: [
      [1,0,0, 0,0,0, 0,0,0],
      [1,1,0, 0,0,0, 0,0,0],
      [1,1,1, 0,0,0, 0,0,0],
      [1,1,1, 0,0,1, 0,0,0],
      [1,1,1, 0,0,1, 0,0,1],
      [1,1,1, 0,0,1, 0,1,1],
      [1,1,1, 0,0,1, 1,1,1],
      [1,1,1, 1,0,1, 1,1,1],
      [1,1,1, 1,1,1, 1,1,1],
      [0,0,0, 0,0,0, 0,0,0],
    ],
    interval: 100,
  },
};

// --- 9×9 pattern generators ---
function make9x9Frame(fn) {
  const f = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      f.push(fn(r, c) ? 1 : 0);
    }
  }
  return f;
}

// Braille 9×9 — rotating dot with trail tracing the perimeter
(function() {
  const path = [];
  for (let c = 0; c < 9; c++) path.push([0, c]);
  for (let r = 1; r < 9; r++) path.push([r, 8]);
  for (let c = 7; c >= 0; c--) path.push([8, c]);
  for (let r = 7; r >= 1; r--) path.push([r, 0]);
  const frames = [];
  for (let i = 0; i < path.length; i++) {
    const on = new Set();
    for (let t = 0; t < 4; t++) {
      const idx = (i - t + path.length) % path.length;
      on.add(path[idx][0] + ',' + path[idx][1]);
    }
    frames.push(make9x9Frame((r, c) => on.has(r + ',' + c)));
  }
  DOT_PATTERNS['dot9-braille'] = { frames, interval: 50 };
})();

// Orbit 9×9 — dot orbiting in a circle
(function() {
  const cx = 4, cy = 4, radius = 3.5;
  const steps = 24;
  const frames = [];
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const dr = Math.round(cy + radius * Math.sin(angle));
    const dc = Math.round(cx + radius * Math.cos(angle));
    const prev = (i - 1 + steps) % steps;
    const pa = (prev / steps) * Math.PI * 2;
    const pr = Math.round(cy + radius * Math.sin(pa));
    const pc = Math.round(cx + radius * Math.cos(pa));
    frames.push(make9x9Frame((r, c) =>
      (r === dr && c === dc) || (r === pr && c === pc)
    ));
  }
  DOT_PATTERNS['dot9-orbit'] = { frames, interval: 60 };
})();

// Breathe 9×9 — expanding rings from center
(function() {
  const cx = 4, cy = 4;
  const radii = [0, 1, 2, 3, 4, 3, 2, 1];
  const frames = [];
  for (const radius of radii) {
    frames.push(make9x9Frame((r, c) => {
      const dist = Math.sqrt((r - cy) ** 2 + (c - cx) ** 2);
      return radius === 0 ? (r === cy && c === cx) : Math.abs(dist - radius) < 0.7;
    }));
  }
  DOT_PATTERNS['dot9-breathe'] = { frames, interval: 150 };
})();

// --- 3×3 Braille spinners (DOT_PATTERNS → braille text) ---
['dot-orbit', 'dot-pulse', 'dot-breathe', 'dot-snake',
 'dot-columns', 'dot-diag', 'dot-rain', 'dot-scan',
 'dot-sparkle', 'dot-checker', 'dot-wave', 'dot-cross', 'dot-spiral'
].forEach(name => {
  const p = DOT_PATTERNS[name];
  if (p) {
    SPINNERS['b3-' + name.slice(4)] = {
      frames: p.frames.map(grid3x3ToBraille),
      interval: p.interval,
    };
  }
});

function startDotGrids() {
  const grids = document.querySelectorAll('.dot-grid[data-dot-pattern]');
  const groups = {};

  grids.forEach((grid) => {
    const type = grid.dataset.dotPattern;
    if (!groups[type]) groups[type] = [];
    groups[type].push(grid);
  });

  Object.entries(groups).forEach(([type, elements]) => {
    const pattern = DOT_PATTERNS[type];
    if (!pattern) return;

    let i = 0;
    // Initialize
    elements.forEach((grid) => {
      const dots = grid.querySelectorAll('.dot');
      pattern.frames[0].forEach((on, idx) => {
        dots[idx].classList.toggle('on', !!on);
      });
    });

    setInterval(() => {
      i = (i + 1) % pattern.frames.length;
      const frame = pattern.frames[i];
      elements.forEach((grid) => {
        const dots = grid.querySelectorAll('.dot');
        frame.forEach((on, idx) => {
          dots[idx].classList.toggle('on', !!on);
        });
      });
    }, pattern.interval);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  startAllSpinners();
  startDotGrids();
  populateFramePreviews();
  initLiveDemo();
});

/* -------------------------------------------
   Start all spinners on the page
   ------------------------------------------- */
/**
 * Size each spinner element so its content fits within its square box.
 * Uses the longest frame's character count to pick a font-size.
 */
function sizeSpinnerToSquare(el, spinner) {
  // No-op: let spinners render at natural size
}

function startAllSpinners() {
  const els = document.querySelectorAll('.text-spinner[data-spinner]');
  const groups = {};

  els.forEach((el) => {
    const type = el.dataset.spinner;
    if (!groups[type]) groups[type] = [];
    groups[type].push(el);
  });

  Object.entries(groups).forEach(([type, elements]) => {
    const spinner = SPINNERS[type];
    if (!spinner) return;
    let i = 0;
    elements.forEach((el) => {
      el.textContent = spinner.frames[0];
      sizeSpinnerToSquare(el, spinner);
    });

    setInterval(() => {
      i = (i + 1) % spinner.frames.length;
      elements.forEach((el) => (el.textContent = spinner.frames[i]));
    }, spinner.interval);
  });
}

/* -------------------------------------------
   Populate frame previews
   ------------------------------------------- */
function populateFramePreviews() {
  document.querySelectorAll('.frames-preview[data-spinner]').forEach((el) => {
    const type = el.dataset.spinner;
    const spinner = SPINNERS[type];
    if (!spinner) return;
    // Show first few unique frames
    const unique = [...new Set(spinner.frames)];
    const display = unique.length > 12 ? unique.slice(0, 12).join(' ') + ' ...' : unique.join(' ');
    el.textContent = display;
  });
}

/* -------------------------------------------
   Live Demo
   ------------------------------------------- */
function initLiveDemo() {
  const container = document.getElementById('live-demo-steps');
  if (!container) return;

  const scenario = [
    { delay: 0,     type: 'parent',         spinner: 'braille',  stepType: 'Agent', label: 'Implement user dashboard' },
    { delay: 600,   type: 'child',          icon: '▸', label: 'Search for existing components' },
    { delay: 1800,  type: 'child-complete',  index: 1 },
    { delay: 2000,  type: 'child',          icon: '▸', label: 'Read src/components/Layout.tsx' },
    { delay: 3200,  type: 'child-complete',  index: 3 },
    { delay: 3400,  type: 'child-loading',   spinner: 'scan',     label: 'Generate Dashboard component' },
    { delay: 5800,  type: 'child-complete',  index: 5 },
    { delay: 6000,  type: 'child-loading',   spinner: 'pulse',    label: 'Write unit tests' },
    { delay: 8200,  type: 'child-complete',  index: 7 },
    { delay: 8400,  type: 'child-loading',   spinner: 'rain',     label: 'Run test suite' },
    { delay: 10400, type: 'child-complete',  index: 9 },
    { delay: 10600, type: 'child',          icon: '$', label: 'npm run lint', mono: true },
    { delay: 12000, type: 'child-complete',  index: 11 },
    { delay: 12200, type: 'parent-complete', index: 0 },
  ];

  const activeIntervals = [];

  function clearActiveIntervals() {
    activeIntervals.forEach(clearInterval);
    activeIntervals.length = 0;
  }

  function startSpinner(el, type) {
    const spinner = SPINNERS[type];
    if (!spinner) return;
    let i = 0;
    el.textContent = spinner.frames[0];
    const id = setInterval(() => {
      i = (i + 1) % spinner.frames.length;
      el.textContent = spinner.frames[i];
    }, spinner.interval);
    activeIntervals.push(id);
  }

  function run() {
    clearActiveIntervals();
    container.innerHTML = '';
    const steps = [];

    scenario.forEach((event) => {
      setTimeout(() => {
        if (event.type === 'parent') {
          const el = createStep({ active: true, spinnerType: event.spinner, stepType: event.stepType, label: event.label });
          container.appendChild(el);
          steps.push(el);
          const loaderEl = el.querySelector('.text-spinner');
          if (loaderEl) startSpinner(loaderEl, event.spinner);
        }
        if (event.type === 'child') {
          const el = createStep({ child: true, icon: event.icon, label: event.label, mono: event.mono });
          el.classList.add('appear');
          container.appendChild(el);
          steps.push(el);
        }
        if (event.type === 'child-loading') {
          const el = createStep({ child: true, spinnerType: event.spinner, label: event.label });
          el.classList.add('appear');
          container.appendChild(el);
          steps.push(el);
          const loaderEl = el.querySelector('.text-spinner');
          if (loaderEl) startSpinner(loaderEl, event.spinner);
        }
        if (event.type === 'child-complete' || event.type === 'parent-complete') {
          completeStep(steps[event.index]);
        }
      }, event.delay);
    });

    const totalTime = scenario[scenario.length - 1].delay + 3000;
    setTimeout(run, totalTime);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        run();
        observer.disconnect();
      }
    },
    { threshold: 0.2 }
  );
  observer.observe(container.closest('.indicator-section'));
}

/* -------------------------------------------
   Helpers
   ------------------------------------------- */
function createStep({ active, child, spinnerType, stepType, label, icon, mono }) {
  const el = document.createElement('div');
  el.className = 'step';
  if (active) el.classList.add('active');
  if (child) el.classList.add('child');

  if (spinnerType) {
    const loaderEl = document.createElement('span');
    loaderEl.className = 'loader text-spinner wide';
    if (child) loaderEl.classList.add('sm');
    loaderEl.dataset.spinner = spinnerType;
    el.appendChild(loaderEl);
  }

  if (icon) {
    const iconEl = document.createElement('span');
    iconEl.className = 'step-icon';
    iconEl.textContent = icon;
    el.appendChild(iconEl);
  }

  if (stepType) {
    const typeEl = document.createElement('span');
    typeEl.className = 'step-type';
    typeEl.textContent = stepType;
    el.appendChild(typeEl);
  }

  if (label) {
    const labelEl = document.createElement('span');
    labelEl.className = 'step-label';
    if (mono) labelEl.classList.add('mono');
    labelEl.textContent = label;
    el.appendChild(labelEl);
  }

  return el;
}

function completeStep(el) {
  if (!el) return;
  const loader = el.querySelector('.text-spinner');
  if (loader) {
    const check = document.createElement('span');
    check.className = 'step-icon check';
    check.textContent = '✓';
    loader.replaceWith(check);
  }
  const icon = el.querySelector('.step-icon:not(.check)');
  if (icon) {
    icon.className = 'step-icon check';
    icon.textContent = '✓';
  }
  el.classList.add('completed');
  el.classList.remove('active');
}
