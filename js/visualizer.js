/**
 * AirGuitar AI — Next-Gen Dynamic Canvas Visualizer & FX Engine
 * Features:
 * - 4 Luxury Aesthetic Visual Themes (Cyber Synthwave, Obsidian Gold, Matrix Emerald, Solar Sunset)
 * - 4 Switchable Visualizer Modes (Laser Strings, Cyber Orbit, 3D Grid Fretboard, Cosmic Nebula)
 * - Interactive direct string plucking with mouse & touch
 * - High-speed particle dynamics, glowing hand skeleton & dual-mode oscilloscope
 */

class AirGuitarVisualizer {
  constructor(canvas, scopeCanvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scopeCanvas = scopeCanvas;
    this.scopeCtx = scopeCanvas ? scopeCanvas.getContext('2d') : null;

    this.particles = [];
    this.strings = [];
    this.activeFretIndex = 0;
    this.showSkeleton = true;
    this.showParticles = true;

    // Visualizer Mode & Theme
    this.currentTheme = 'cyber-synthwave';
    this.visualizerMode = 'laser-strings'; // 'laser-strings', 'cyber-orbit', 'grid-3d', 'particle-nebula'

    // Interactive Hover & Mouse Pluck
    this.hoveredStringIndex = -1;
    this.onInteractivePluck = null; // Callback: (stringIndex, fret) => void

    // Hand Trail Points
    this.trailHistory = [];
    this.maxTrailPoints = 18;

    // 3D Grid Wave offset
    this.gridOffset = 0;

    // Theme Color Palettes
    this.themePalettes = {
      'cyber-synthwave': {
        primary: '#00f0ff',
        secondary: '#8b5cf6',
        accent: '#ff0055',
        glow: 'rgba(0, 240, 255, 0.4)',
        bgGrid: 'rgba(0, 240, 255, 0.05)',
        stringColors: ['#00f0ff', '#38bdf8', '#818cf8', '#a855f7', '#ec4899', '#ff0055'],
        sparkColors: ['#00f0ff', '#8b5cf6', '#ff0055', '#38bdf8']
      },
      'obsidian-gold': {
        primary: '#ffd700',
        secondary: '#f59e0b',
        accent: '#fb923c',
        glow: 'rgba(255, 215, 0, 0.45)',
        bgGrid: 'rgba(255, 215, 0, 0.05)',
        stringColors: ['#fef08a', '#fde047', '#ffd700', '#f59e0b', '#fb923c', '#ea580c'],
        sparkColors: ['#ffd700', '#f59e0b', '#fffbeb', '#fb923c']
      },
      'matrix-emerald': {
        primary: '#10b981',
        secondary: '#00ff66',
        accent: '#34d399',
        glow: 'rgba(16, 185, 129, 0.45)',
        bgGrid: 'rgba(16, 185, 129, 0.06)',
        stringColors: ['#a7f3d0', '#6ee7b7', '#34d399', '#10b981', '#059669', '#00ff66'],
        sparkColors: ['#10b981', '#00ff66', '#a7f3d0', '#34d399']
      },
      'solar-sunset': {
        primary: '#ff3366',
        secondary: '#fb923c',
        accent: '#c084fc',
        glow: 'rgba(255, 51, 102, 0.45)',
        bgGrid: 'rgba(255, 51, 102, 0.05)',
        stringColors: ['#fed7aa', '#fb923c', '#f97316', '#ff3366', '#f43f5e', '#c084fc'],
        sparkColors: ['#ff3366', '#fb923c', '#f43f5e', '#e879f9']
      }
    };

    this.initStrings();
    this.setupCanvasInteractions();
  }

  setTheme(themeName) {
    if (this.themePalettes[themeName]) {
      this.currentTheme = themeName;
      this.initStrings();
    }
  }

  setVisualizerMode(mode) {
    this.visualizerMode = mode;
  }

  initStrings() {
    this.strings = [];
    const palette = this.themePalettes[this.currentTheme] || this.themePalettes['cyber-synthwave'];
    const numStrings = 6;
    for (let i = 0; i < numStrings; i++) {
      this.strings.push({
        yPos: 0,
        amplitude: 0,
        frequency: 8 + i * 2,
        decay: 0.93,
        color: palette.stringColors[i],
        vibrating: false
      });
    }
  }

  // Mouse & Touch String Plucking Listener
  setupCanvasInteractions() {
    const handleMove = (clientX, clientY) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (clientX - rect.left) * (this.canvas.width / rect.width);
      const y = (clientY - rect.top) * (this.canvas.height / rect.height);

      let closest = -1;
      let minDistance = 20;

      this.strings.forEach((str, i) => {
        const dist = Math.abs(y - str.yPos);
        if (dist < minDistance) {
          minDistance = dist;
          closest = i;
        }
      });

      this.hoveredStringIndex = closest;
      return { x, y, stringIndex: closest };
    };

    const handlePluck = (clientX, clientY) => {
      const info = handleMove(clientX, clientY);
      if (info.stringIndex !== -1) {
        // Calculate fret from X position (0 to 12 frets across width)
        const fret = Math.max(0, Math.min(12, Math.floor((info.x / this.canvas.width) * 14)));
        this.triggerNoteVisual(info.stringIndex, fret);
        if (this.onInteractivePluck) {
          this.onInteractivePluck(info.stringIndex, fret);
        }
      }
    };

    this.canvas.addEventListener('mousemove', (e) => handleMove(e.clientX, e.clientY));
    this.canvas.addEventListener('mouseleave', () => { this.hoveredStringIndex = -1; });
    this.canvas.addEventListener('mousedown', (e) => handlePluck(e.clientX, e.clientY));

    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        handlePluck(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const info = handleMove(e.touches[0].clientX, e.touches[0].clientY);
        if (info.stringIndex !== -1 && !this.strings[info.stringIndex].vibrating) {
          const fret = Math.max(0, Math.min(12, Math.floor((info.x / this.canvas.width) * 14)));
          this.triggerNoteVisual(info.stringIndex, fret);
          if (this.onInteractivePluck) {
            this.onInteractivePluck(info.stringIndex, fret);
          }
        }
      }
    }, { passive: true });
  }

  // Trigger vibration and particle explosion on string
  triggerNoteVisual(stringIndex = 3, fret = 0) {
    const sIdx = Math.max(0, Math.min(5, stringIndex));
    const targetString = this.strings[sIdx];
    if (targetString) {
      targetString.amplitude = 22;
      targetString.vibrating = true;
    }

    this.activeFretIndex = fret;

    // Spawn sparks at the fret location
    if (this.showParticles) {
      const fretX = (this.canvas.width * (0.15 + (fret / 14) * 0.7));
      const fretY = targetString ? targetString.yPos : this.canvas.height * 0.7;
      this.spawnSparkBurst(fretX, fretY, targetString?.color || '#00f0ff');
    }
  }

  spawnSparkBurst(x, y, color = '#00f0ff') {
    const count = 18;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 7;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.5 + Math.random() * 4.5,
        color: color,
        life: 1.0,
        decay: 0.025 + Math.random() * 0.035
      });
    }
  }

  // Main Render Loop
  render(videoElement, landmarks, controlPoint, isPlayingTune) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;
    const palette = this.themePalettes[this.currentTheme] || this.themePalettes['cyber-synthwave'];

    ctx.clearRect(0, 0, w, h);

    // 1. Draw Mirrored Webcam Video
    if (videoElement && videoElement.readyState >= 2) {
      ctx.save();
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.filter = 'brightness(0.85) contrast(1.1)';
      ctx.drawImage(videoElement, 0, 0, w, h);
      ctx.restore();

      // Cyberpunk subtle vignette and scanlines
      this.drawCyberVignette(w, h);
    } else {
      // Dark Grid Background when camera is off
      this.drawBackdropGrid(w, h, palette);
    }

    // 2. Draw Mode-Specific FX
    if (this.visualizerMode === 'grid-3d') {
      this.draw3DGrid(w, h, palette, isPlayingTune);
    } else if (this.visualizerMode === 'cyber-orbit' && controlPoint) {
      this.drawCyberOrbit(controlPoint, w, h, palette, isPlayingTune);
    } else if (this.visualizerMode === 'particle-nebula' && controlPoint) {
      this.drawParticleNebula(controlPoint, w, h, palette, isPlayingTune);
    }

    // Always draw Guitar Strings (with interactive glowing laser style)
    this.drawGuitarStrings(w, h, palette);

    // 3. Draw Hand Landmarks & Glowing Skeleton
    if (landmarks && this.showSkeleton) {
      this.drawHandSkeleton(landmarks, w, h, palette);
    }

    // 4. Draw Primary Hand Tracking Target Reticle
    if (controlPoint) {
      this.drawTrackingPoint(controlPoint, w, h, isPlayingTune, palette);
    }

    // 5. Update and Draw Particle Sparks
    this.updateParticles();

    // 6. Draw Waveform Visualizer on Mini Canvas
    if (this.scopeCtx) {
      this.drawScope(palette);
    }
  }

  drawCyberVignette(w, h) {
    const ctx = this.ctx;
    const grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.4, w / 2, h / 2, h * 0.85);
    grad.addColorStop(0, 'rgba(6, 8, 14, 0)');
    grad.addColorStop(1, 'rgba(6, 8, 14, 0.78)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  drawBackdropGrid(w, h, palette) {
    const ctx = this.ctx;
    ctx.fillStyle = '#06080e';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = palette.bgGrid;
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = 0; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  drawGuitarStrings(w, h, palette) {
    const ctx = this.ctx;
    const startY = h * 0.60;
    const spacing = 24;

    this.strings.forEach((str, i) => {
      str.yPos = startY + i * spacing;

      if (str.vibrating) {
        str.amplitude *= str.decay;
        if (str.amplitude < 0.2) {
          str.amplitude = 0;
          str.vibrating = false;
        }
      }

      const isHovered = (this.hoveredStringIndex === i);
      const isVibrating = str.amplitude > 0.5;

      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = (isVibrating || isHovered) ? str.color : 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = isVibrating ? 3.8 : (isHovered ? 3.0 : 1.8);

      if (isVibrating || isHovered) {
        ctx.shadowColor = str.color;
        ctx.shadowBlur = isVibrating ? 20 : 12;
      }

      const time = performance.now() * 0.02;
      const numSegments = 40;
      const dx = w / numSegments;

      for (let s = 0; s <= numSegments; s++) {
        const x = s * dx;
        const waveAmp = str.amplitude + (isHovered && !str.vibrating ? 3.5 : 0);
        // Harmonic standing wave displacement
        const wave = Math.sin((s / numSegments) * Math.PI) * Math.sin(time * str.frequency) * waveAmp;
        const y = str.yPos + wave;

        if (s === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // String Head & Tail Neon Nodes
      if (isVibrating || isHovered) {
        ctx.fillStyle = str.color;
        ctx.beginPath();
        ctx.arc(12, str.yPos, 4, 0, Math.PI * 2);
        ctx.arc(w - 12, str.yPos, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  draw3DGrid(w, h, palette, isPlaying) {
    const ctx = this.ctx;
    this.gridOffset = (this.gridOffset + (isPlaying ? 1.5 : 0.4)) % 40;

    ctx.save();
    ctx.strokeStyle = palette.primary;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.22;

    const horizonY = h * 0.45;
    const numLines = 14;

    // Perspective converging rays
    for (let i = 0; i <= numLines; i++) {
      const xBottom = (w / numLines) * i;
      const xTop = (w / 2) + (xBottom - w / 2) * 0.15;
      ctx.beginPath();
      ctx.moveTo(xTop, horizonY);
      ctx.lineTo(xBottom, h);
      ctx.stroke();
    }

    // Horizontal moving perspective lines
    for (let y = horizonY; y < h; y += 18) {
      const depthRatio = (y - horizonY) / (h - horizonY);
      const actualY = horizonY + Math.pow(depthRatio, 1.8) * (h - horizonY) + this.gridOffset * depthRatio;
      if (actualY <= h) {
        ctx.beginPath();
        ctx.moveTo(0, actualY);
        ctx.lineTo(w, actualY);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  drawCyberOrbit(pt, w, h, palette, isPlaying) {
    const ctx = this.ctx;
    const px = pt.x * w;
    const py = pt.y * h;
    const time = performance.now() * 0.002;

    ctx.save();
    ctx.translate(px, py);

    const baseRadius = 45;
    const rings = 3;

    for (let r = 1; r <= rings; r++) {
      ctx.save();
      ctx.rotate(time * (r % 2 === 0 ? 1 : -1) * (r * 0.7));
      ctx.strokeStyle = r === 1 ? palette.primary : (r === 2 ? palette.secondary : palette.accent);
      ctx.lineWidth = 1.8;
      ctx.shadowColor = palette.glow;
      ctx.shadowBlur = 14;
      ctx.globalAlpha = isPlaying ? 0.8 : 0.4;

      const radius = baseRadius * r * 0.65;
      const segments = 8;
      for (let s = 0; s < segments; s++) {
        if (s % 2 === 0) {
          ctx.beginPath();
          ctx.arc(0, 0, radius, (s / segments) * Math.PI * 2, ((s + 0.7) / segments) * Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    ctx.restore();
  }

  drawParticleNebula(pt, w, h, palette, isPlaying) {
    const px = pt.x * w;
    const py = pt.y * h;

    this.trailHistory.push({ x: px, y: py, life: 1.0 });
    if (this.trailHistory.length > this.maxTrailPoints) {
      this.trailHistory.shift();
    }

    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();

    for (let i = 0; i < this.trailHistory.length - 1; i++) {
      const p1 = this.trailHistory[i];
      const p2 = this.trailHistory[i + 1];
      const alpha = (i / this.trailHistory.length) * (isPlaying ? 0.8 : 0.4);

      ctx.strokeStyle = palette.secondary;
      ctx.lineWidth = (i / this.trailHistory.length) * 8 + 2;
      ctx.shadowColor = palette.primary;
      ctx.shadowBlur = 12;
      ctx.globalAlpha = alpha;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawHandSkeleton(landmarks, w, h, palette) {
    const ctx = this.ctx;

    // Hand connections
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8],       // Index
      [0, 9], [9, 10], [10, 11], [11, 12],  // Middle
      [0, 13], [13, 14], [14, 15], [15, 16],// Ring
      [0, 17], [17, 18], [18, 19], [19, 20],// Pinky
      [5, 9], [9, 13], [13, 17]             // Palm base
    ];

    ctx.save();
    ctx.strokeStyle = palette.primary;
    ctx.lineWidth = 2.8;
    ctx.shadowColor = palette.glow;
    ctx.shadowBlur = 10;
    ctx.globalAlpha = 0.75;

    connections.forEach(([i, j]) => {
      const p1 = landmarks[i];
      const p2 = landmarks[j];
      const x1 = (1.0 - p1.x) * w;
      const y1 = p1.y * h;
      const x2 = (1.0 - p2.x) * w;
      const y2 = p2.y * h;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });

    // Draw joint nodes
    landmarks.forEach((p, index) => {
      const x = (1.0 - p.x) * w;
      const y = p.y * h;
      const isTip = [4, 8, 12, 16, 20].includes(index);

      ctx.beginPath();
      ctx.arc(x, y, isTip ? 6.5 : 4, 0, Math.PI * 2);
      ctx.fillStyle = isTip ? palette.accent : palette.primary;
      ctx.shadowColor = isTip ? palette.accent : palette.primary;
      ctx.shadowBlur = 14;
      ctx.globalAlpha = 0.95;
      ctx.fill();
    });
    ctx.restore();
  }

  drawTrackingPoint(pt, w, h, isPlaying, palette) {
    const ctx = this.ctx;
    const px = pt.x * w;
    const py = pt.y * h;
    const time = performance.now() * 0.003;

    ctx.save();
    const radius = 24 + Math.sin(time * 4) * 4;
    ctx.strokeStyle = isPlaying ? palette.primary : palette.secondary;
    ctx.lineWidth = 2;
    ctx.shadowColor = isPlaying ? palette.primary : palette.secondary;
    ctx.shadowBlur = 16;

    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Rotating outer reticle wings
    ctx.beginPath();
    ctx.arc(px, py, radius + 8, time, time + Math.PI * 0.6);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(px, py, radius + 8, time + Math.PI, time + Math.PI * 1.6);
    ctx.stroke();

    // Center laser point
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();

    // Sound coordinates HUD label
    ctx.fillStyle = palette.primary;
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.shadowBlur = 4;
    ctx.fillText(`PITCH: ${Math.round(pt.x * 100)}% | WAH: ${Math.round((1 - pt.y) * 100)}%`, px + 28, py + 4);

    ctx.restore();
  }

  updateParticles() {
    const ctx = this.ctx;
    ctx.save();
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.globalAlpha = p.life;
      ctx.fill();
    }
    ctx.restore();
  }

  drawScope(palette) {
    const ctx = this.scopeCtx;
    const w = this.scopeCanvas.width;
    const h = this.scopeCanvas.height;
    const audio = window.airGuitarAudio;

    ctx.fillStyle = '#05070c';
    ctx.fillRect(0, 0, w, h);

    if (!audio || !audio.analyser) {
      // Idle line
      ctx.strokeStyle = palette ? palette.primary : 'rgba(0, 240, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();
      return;
    }

    const bufferLength = audio.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    audio.analyser.getByteTimeDomainData(dataArray);

    ctx.lineWidth = 2.2;
    ctx.strokeStyle = palette ? palette.primary : '#00f0ff';
    ctx.shadowColor = palette ? palette.primary : '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();

    const sliceWidth = w / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * h) / 2;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);

      x += sliceWidth;
    }

    ctx.lineTo(w, h / 2);
    ctx.stroke();
  }
}

window.AirGuitarVisualizer = AirGuitarVisualizer;
