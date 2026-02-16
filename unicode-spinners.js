/**
 * Unicode Braille Spinners
 *
 * A collection of animated unicode spinners built on braille characters (U+2800 block).
 * Each braille char is a 2×4 dot grid — these generators compose them into
 * multi-character animated frames for use as loading indicators.
 *
 * Usage:
 *   const spinner = SPINNERS.braille; // or .scan, .rain, .pulse, etc.
 *   let i = 0;
 *   setInterval(() => {
 *     process.stdout.write('\r' + spinner.frames[i]);
 *     i = (i + 1) % spinner.frames.length;
 *   }, spinner.interval);
 *
 * Or in the browser:
 *   <span class="spinner" data-spinner="braille"></span>
 *   startAllSpinners(); // auto-finds [data-spinner] elements
 */

/* -------------------------------------------
   Braille Grid Utility

   Each braille char is a 2-col × 4-row dot grid.
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
   Frame Generators
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
  const positions = [0, 1, 2, 3, 2, 1];
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

// 4. Pulse — dots expanding from center outward (3 chars = 6 cols)
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

// 6. Sparkle — random-looking dots twinkling (4 chars = 8 cols)
function genSparkle() {
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

// 9. Orbit — a dot circling the perimeter of a single braille cell (1 char = 2 cols)
function genOrbit() {
  const W = 2, H = 4;
  const path = [
    [0,0], [0,1],
    [1,1], [2,1], [3,1],
    [3,0],
    [2,0], [1,0],
  ];
  const frames = [];
  for (let i = 0; i < path.length; i++) {
    const g = makeGrid(H, W);
    g[path[i][0]][path[i][1]] = true;
    const t1 = (i - 1 + path.length) % path.length;
    g[path[t1][0]][path[t1][1]] = true;
    frames.push(gridToBraille(g));
  }
  return frames;
}

// 10. Breathe — single char filling from empty → full → back (1 char = 2 cols)
function genBreathe() {
  const stages = [
    [],
    [[1,0]],
    [[0,1],[2,0]],
    [[0,0],[1,1],[3,0]],
    [[0,0],[1,1],[2,0],[3,1]],
    [[0,0],[0,1],[1,1],[2,0],[3,1]],
    [[0,0],[0,1],[1,0],[2,1],[3,0],[3,1]],
    [[0,0],[0,1],[1,0],[1,1],[2,0],[3,0],[3,1]],
    [[0,0],[0,1],[1,0],[1,1],[2,0],[2,1],[3,0],[3,1]],
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

// 11. Wave Rows — each row lights up in a wave (4 chars = 8 cols)
function genWaveRows() {
  const W = 8, H = 4, totalFrames = 16, frames = [];
  for (let f = 0; f < totalFrames; f++) {
    const g = makeGrid(H, W);
    for (let c = 0; c < W; c++) {
      const phase = (f - c * 0.5);
      const row = Math.round((Math.sin(phase * 0.8) + 1) / 2 * (H - 1));
      g[row][c] = true;
      if (row > 0) g[row - 1][c] = (f + c) % 3 === 0;
    }
    frames.push(gridToBraille(g));
  }
  return frames;
}

// 12. Checkerboard — alternating checkerboard flipping (3 chars = 6 cols)
function genCheckerboard() {
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

// 13. Helix — two dots orbiting in opposite directions (4 chars = 8 cols)
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

// 15. Diagonal Swipe — diagonal band fills then clears (2 chars = 4 cols)
function genDiagonalSwipe() {
  const W = 4, H = 4, frames = [];
  const maxDiag = W + H - 2;
  for (let d = 0; d <= maxDiag; d++) {
    const g = makeGrid(H, W);
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        if (r + c <= d) g[r][c] = true;
      }
    }
    frames.push(gridToBraille(g));
  }
  const full = makeGrid(H, W);
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) full[r][c] = true;
  frames.push(gridToBraille(full));
  for (let d = 0; d <= maxDiag; d++) {
    const g = makeGrid(H, W);
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        if (r + c > d) g[r][c] = true;
      }
    }
    frames.push(gridToBraille(g));
  }
  frames.push(gridToBraille(makeGrid(H, W)));
  return frames;
}

/* -------------------------------------------
   Spinner Registry

   Each spinner has:
   - frames: string[] — the unicode characters for each animation frame
   - interval: number — milliseconds between frames
   ------------------------------------------- */
const SPINNERS = {
  // === Classic braille single-char ===
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

  // === Non-braille classics ===
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
   Browser Runtime (optional)

   Auto-animates any element with data-spinner attribute:
   <span data-spinner="braille"></span>
   <span data-spinner="scan"></span>
   ------------------------------------------- */
function startAllSpinners() {
  const els = document.querySelectorAll('[data-spinner]');
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
    });

    setInterval(() => {
      i = (i + 1) % spinner.frames.length;
      elements.forEach((el) => (el.textContent = spinner.frames[i]));
    }, spinner.interval);
  });
}

/* -------------------------------------------
   Node.js / Terminal Usage (optional)

   const spinner = SPINNERS.scan;
   let i = 0;
   const id = setInterval(() => {
     process.stdout.write('\r  ' + spinner.frames[i] + '  Loading...');
     i = (i + 1) % spinner.frames.length;
   }, spinner.interval);
   // clearInterval(id) when done
   ------------------------------------------- */

// Export for Node.js / ESM
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SPINNERS, gridToBraille, makeGrid };
}
