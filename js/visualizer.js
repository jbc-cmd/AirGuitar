/**
 * AirGuitar AI — Dynamic Canvas Visualizer & FX Engine
 * Renders glowing hand landmarks, energetic string vibrations, particle bursts & audio waveforms.
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

    this.initStrings();
  }

  initStrings() {
    this.strings = [];
    const numStrings = 6;
    for (let i = 0; i < numStrings; i++) {
      this.strings.push({
        yPos: 0,
        amplitude: 0,
        frequency: 8 + i * 2,
        decay: 0.94,
        color: ['#00f0ff', '#38bdf8', '#818cf8', '#a855f7', '#ec4899', '#ff0055'][i],
        vibrating: false
      });
    }
  }

  // Trigger vibration and particle explosion on string
  triggerNoteVisual(stringIndex = 3, fret = 0) {
    const sIdx = Math.max(0, Math.min(5, stringIndex));
    const targetString = this.strings[sIdx];
    if (targetString) {
      targetString.amplitude = 18;
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
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 4,
        color: color,
        life: 1.0,
        decay: 0.03 + Math.random() * 0.04
      });
    }
  }

  // Main Render Loop
  render(videoElement, landmarks, controlPoint, isPlayingTune) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;

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
      this.drawBackdropGrid(w, h);
    }

    // 2. Draw Holographic Guitar Strings
    this.drawGuitarStrings(w, h);

    // 3. Draw Hand Landmarks & Glowing Skeleton
    if (landmarks && this.showSkeleton) {
      this.drawHandSkeleton(landmarks, w, h);
    }

    // 4. Draw Primary Hand Tracking Point Target & Energy Halo
    if (controlPoint) {
      this.drawTrackingPoint(controlPoint, w, h, isPlayingTune);
    }

    // 5. Update and Draw Particle Sparks
    this.updateParticles();

    // 6. Draw Waveform Visualizer on Mini Canvas
    if (this.scopeCtx) {
      this.drawScope();
    }
  }

  drawCyberVignette(w, h) {
    const ctx = this.ctx;
    const grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.4, w / 2, h / 2, h * 0.85);
    grad.addColorStop(0, 'rgba(8, 10, 16, 0)');
    grad.addColorStop(1, 'rgba(8, 10, 16, 0.7)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  drawBackdropGrid(w, h) {
    const ctx = this.ctx;
    ctx.fillStyle = '#080a10';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
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

  drawGuitarStrings(w, h) {
    const ctx = this.ctx;
    const startY = h * 0.62;
    const spacing = 22;

    this.strings.forEach((str, i) => {
      str.yPos = startY + i * spacing;

      if (str.vibrating) {
        str.amplitude *= str.decay;
        if (str.amplitude < 0.2) {
          str.amplitude = 0;
          str.vibrating = false;
        }
      }

      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = str.amplitude > 1 ? str.color : 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = str.amplitude > 1 ? 3.5 : 2;

      if (str.amplitude > 1) {
        ctx.shadowColor = str.color;
        ctx.shadowBlur = 15;
      }

      const time = performance.now() * 0.02;
      const numSegments = 30;
      const dx = w / numSegments;

      for (let s = 0; s <= numSegments; s++) {
        const x = s * dx;
        // String standing wave displacement
        const wave = Math.sin((s / numSegments) * Math.PI) * Math.sin(time * str.frequency) * str.amplitude;
        const y = str.yPos + wave;

        if (s === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    });
  }

  drawHandSkeleton(landmarks, w, h) {
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

    // Draw bones with neon glow
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;

    connections.forEach(([i, j]) => {
      const p1 = landmarks[i];
      const p2 = landmarks[j];
      // Mirror X
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
      ctx.arc(x, y, isTip ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = isTip ? '#ff0055' : '#00f0ff';
      ctx.shadowColor = isTip ? '#ff0055' : '#00f0ff';
      ctx.shadowBlur = 12;
      ctx.fill();
    });
    ctx.restore();
  }

  drawTrackingPoint(pt, w, h, isPlaying) {
    const ctx = this.ctx;
    const px = pt.x * w;
    const py = pt.y * h;
    const time = performance.now() * 0.003;

    ctx.save();
    // Glowing Crosshair / Reticle
    const radius = 24 + Math.sin(time * 4) * 4;
    ctx.strokeStyle = isPlaying ? '#00f0ff' : '#a855f7';
    ctx.lineWidth = 2;
    ctx.shadowColor = isPlaying ? '#00f0ff' : '#a855f7';
    ctx.shadowBlur = 16;

    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Rotating outer segments
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

    // Sound control coordinates label
    ctx.fillStyle = 'rgba(0, 240, 255, 0.9)';
    ctx.font = '11px "JetBrains Mono", monospace';
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

  drawScope() {
    const ctx = this.scopeCtx;
    const w = this.scopeCanvas.width;
    const h = this.scopeCanvas.height;
    const audio = window.airGuitarAudio;

    ctx.fillStyle = '#05070c';
    ctx.fillRect(0, 0, w, h);

    if (!audio || !audio.analyser) {
      // Idle line
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
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

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 6;
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
