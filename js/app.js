/**
 * AirGuitar AI — Main Studio Orchestrator
 * Integrates Audio Engine, Hand Tracking, Visualizer Modes, Theme Engine,
 * Live WAV Recorder, Interactive Canvas Strumming, 3-Band EQ & Keyboard Studio Mode.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Application State
  const state = {
    cameraActive: false,
    gestureMapping: { ...window.AirGuitarTunes.DEFAULT_GESTURE_MAPPING },
    activeGesture: 'none',
    activeTuneId: null,
    isMuted: false,
    currentTheme: localStorage.getItem('airguitar_theme') || 'cyber-synthwave'
  };

  // Set stored theme
  document.body.setAttribute('data-theme', state.currentTheme);
  const themeSelect = document.getElementById('themeSelect');
  if (themeSelect) themeSelect.value = state.currentTheme;

  // DOM Elements
  const video = document.getElementById('webcamVideo');
  const canvas = document.getElementById('guitarCanvas');
  const scopeCanvas = document.getElementById('audioVisualizerCanvas');
  const btnStartCamera = document.getElementById('btnStartCamera');
  const btnLaunchGuitar = document.getElementById('btnLaunchGuitar');
  const btnLaunchKeyboard = document.getElementById('btnLaunchKeyboard');
  const cameraBtnText = document.getElementById('cameraBtnText');
  const cameraBtnIcon = document.getElementById('cameraBtnIcon');
  const cameraStatus = document.getElementById('cameraStatus');
  const cameraStatusText = document.getElementById('cameraStatusText');
  const detectedGestureName = document.getElementById('detectedGestureName');
  const statusGestureIcon = document.getElementById('statusGestureIcon');
  const activeTuneName = document.getElementById('activeTuneName');
  const cameraHeroCard = document.getElementById('cameraHeroCard');

  // Clean UI Elements (Screenshot Style)
  const quickKeySelect = document.getElementById('quickKeySelect');
  const quickToneSelect = document.getElementById('quickToneSelect');
  const btnOpenGuide = document.getElementById('btnOpenGuide');
  const btnToggleStudioDrawer = document.getElementById('btnToggleStudioDrawer');
  const btnCloseDrawer = document.getElementById('btnCloseDrawer');
  const studioDrawer = document.getElementById('studioDrawer');
  const cleanChordTitle = document.getElementById('cleanChordTitle');
  const cleanChordSub = document.getElementById('cleanChordSub');
  const vuBars = document.querySelectorAll('.clean-vu-meter .vu-bar');

  // Recorder Elements
  const btnRecord = document.getElementById('btnRecord');
  const recordLed = document.getElementById('recordLed');
  const recordBtnText = document.getElementById('recordBtnText');
  const recordTimer = document.getElementById('recordTimer');
  const btnPauseRecord = document.getElementById('btnPauseRecord');
  const btnStopRecord = document.getElementById('btnStopRecord');
  const recordPauseIcon = document.getElementById('recordPauseIcon');
  const recordingExportModal = document.getElementById('recordingExportModal');
  const closeRecordModalBtn = document.getElementById('closeRecordModalBtn');
  const recordedAudioPlayer = document.getElementById('recordedAudioPlayer');
  const btnDownloadWav = document.getElementById('btnDownloadWav');
  const exportDurationText = document.getElementById('exportDurationText');

  // HUD Elements
  const hudGestureBanner = document.getElementById('hudGestureBanner');
  const hudGestureIcon = document.getElementById('hudGestureIcon');
  const hudGestureTitle = document.getElementById('hudGestureTitle');
  const hudTuneSubtitle = document.getElementById('hudTuneSubtitle');
  const hudToast = document.getElementById('hudToast');
  const hudToastMsg = document.getElementById('hudToastMsg');
  const pitchModBar = document.getElementById('pitchModBar');
  const pitchModVal = document.getElementById('pitchModVal');
  const wahModBar = document.getElementById('wahModBar');
  const wahModVal = document.getElementById('wahModVal');
  const fpsCounter = document.getElementById('fpsCounter');

  // Tune Card Elements
  const activeGestureIcon = document.getElementById('activeGestureIcon');
  const currentTuneTitle = document.getElementById('currentTuneTitle');
  const currentTuneStyle = document.getElementById('currentTuneStyle');
  const tuneKeyDisplay = document.getElementById('tuneKeyDisplay');
  const gestureTuneList = document.getElementById('gestureTuneList');

  // Modals
  const tutorialModal = document.getElementById('tutorialModal');
  const settingsModal = document.getElementById('settingsModal');
  const keyboardModal = document.getElementById('keyboardModal');
  const btnTutorial = document.getElementById('btnTutorial');
  const btnSettings = document.getElementById('btnSettings');
  const btnKeyboardGuide = document.getElementById('btnKeyboardGuide');
  const closeTutorialBtn = document.getElementById('closeTutorialBtn');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const closeKeyboardBtn = document.getElementById('closeKeyboardBtn');
  const btnCloseKeyboardModal = document.getElementById('btnCloseKeyboardModal');
  const btnGotIt = document.getElementById('btnGotIt');
  const btnSaveSettings = document.getElementById('btnSaveSettings');

  // Audio & Systems
  const audio = new window.AirGuitarAudioEngine();
  window.airGuitarAudio = audio;

  const visualizer = new window.AirGuitarVisualizer(canvas, scopeCanvas);
  visualizer.setTheme('obsidian-gold');
  const tracker = new window.AirGuitarHandTracker();

  // Resize canvas to full window
  function resizeCanvas() {
    canvas.width = window.innerWidth || 1280;
    canvas.height = window.innerHeight || 720;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Quick Key Selector Handler (A, B, C, D, E, F, G...)
  const keyToSemitone = {
    'C': -4, 'C#': -3, 'D': -2, 'D#': -1, 'E': 0, 'F': 1, 'F#': 2, 'G': 3, 'G#': 4, 'A': 5, 'A#': 6, 'B': 7
  };

  if (quickKeySelect) {
    quickKeySelect.addEventListener('change', (e) => {
      const key = e.target.value;
      const semitones = keyToSemitone[key] ?? 5;
      audio.pitchSemitones = semitones;
      if (cleanChordSub) {
        cleanChordSub.textContent = `Root: ${key} • ${quickToneSelect ? quickToneSelect.options[quickToneSelect.selectedIndex].text : 'Warm Synth'}`;
      }
      showToast(`Key transposed to ${key}`);
    });
  }

  // Quick Tone Selector Handler
  if (quickToneSelect) {
    quickToneSelect.addEventListener('change', (e) => {
      audio.setTonePreset(e.target.value);
      if (cleanChordSub) {
        cleanChordSub.textContent = `Root: ${quickKeySelect ? quickKeySelect.value : 'A'} • ${e.target.options[e.target.selectedIndex].text}`;
      }
      showToast(`Tone Preset: ${e.target.options[e.target.selectedIndex].text}`);
    });
  }

  // Open Guide Button Handler
  if (btnOpenGuide && tutorialModal) {
    btnOpenGuide.addEventListener('click', () => {
      tutorialModal.classList.add('open');
      if (typeof lucide !== 'undefined') lucide.createIcons();
    });
  }

  // Studio Drawer Toggle Handlers
  if (btnToggleStudioDrawer && studioDrawer) {
    btnToggleStudioDrawer.addEventListener('click', () => {
      studioDrawer.classList.toggle('open');
    });
  }

  if (btnCloseDrawer && studioDrawer) {
    btnCloseDrawer.addEventListener('click', () => {
      studioDrawer.classList.remove('open');
    });
  }

  // =========================================================================
  // Theme Switching System
  // =========================================================================

  if (themeSelect) {
    themeSelect.addEventListener('change', (e) => {
      const theme = e.target.value;
      state.currentTheme = theme;
      document.body.setAttribute('data-theme', theme);
      localStorage.setItem('airguitar_theme', theme);
      visualizer.setTheme(theme);
      showToast(`Visual theme switched to ${e.target.options[e.target.selectedIndex].text}`);
    });
  }

  // =========================================================================
  // Visualizer Mode Selector
  // =========================================================================

  document.querySelectorAll('.viz-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.viz-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.dataset.mode;
      visualizer.setVisualizerMode(mode);
      showToast(`Visualizer mode: ${btn.textContent}`);
    });
  });

  // Direct Canvas Strumming & Plucking Connection
  visualizer.onInteractivePluck = (stringIdx, fret) => {
    audio.pluckString(stringIdx, fret, 0.95);
  };

  // =========================================================================
  // Initialize UI & Gesture Mapping List with Instant Audition
  // =========================================================================

  function renderGestureList() {
    gestureTuneList.innerHTML = '';
    const allTunes = window.AirGuitarTunes.GUITAR_TUNES;
    const metadata = window.AirGuitarTunes.GESTURE_METADATA;

    metadata.forEach(g => {
      const row = document.createElement('div');
      row.className = `gesture-tune-row ${state.activeGesture === g.id ? 'active' : ''}`;
      row.dataset.gestureId = g.id;

      // Dropdown options
      let optionsHtml = '';
      for (const [tuneKey, tune] of Object.entries(allTunes)) {
        const isSelected = state.gestureMapping[g.id] === tuneKey;
        optionsHtml += `<option value="${tuneKey}" ${isSelected ? 'selected' : ''}>${tune.title}</option>`;
      }

      row.innerHTML = `
        <div class="gesture-row-top">
          <div class="gesture-icon-badge">
            <i data-lucide="${g.icon || 'music'}"></i>
          </div>
          <div class="gesture-row-info">
            <span class="gesture-name">${g.name}</span>
            <span class="gesture-tag-pill">${g.tag || 'SYNTH'}</span>
          </div>
          <div class="gesture-row-actions">
            <button class="btn-audition-play" data-gesture-id="${g.id}" title="Preview / Play Riff">
              <i data-lucide="play"></i>
            </button>
          </div>
        </div>
        <div class="gesture-row-bottom">
          <select class="gesture-tune-select" data-gesture-id="${g.id}">
            ${optionsHtml}
          </select>
        </div>
      `;

      // Select change handler
      const select = row.querySelector('.gesture-tune-select');
      select.addEventListener('change', (e) => {
        state.gestureMapping[g.id] = e.target.value;
        if (state.activeGesture === g.id) {
          playGestureTune(g.id);
        }
      });

      // Audition preview button click
      const auditionBtn = row.querySelector('.btn-audition-play');
      auditionBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playGestureTune(g.id);
      });

      // Row click handler (manual trigger)
      row.addEventListener('click', (e) => {
        if (e.target.tagName !== 'SELECT' && !e.target.closest('.btn-audition-play')) {
          playGestureTune(g.id);
        }
      });

      gestureTuneList.appendChild(row);
    });

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  renderGestureList();

  // =========================================================================
  // Camera & Tracking Integration
  // =========================================================================

  async function startAirGuitar() {
    audio.init();
    audio.resume();

    showToast("Starting Vision Camera Tracking...");
    await tracker.init(video);
    const success = await tracker.startCamera();

    if (success) {
      state.cameraActive = true;
      cameraBtnText.textContent = "Stop Vision";
      btnStartCamera.classList.add('active');
      cameraHeroCard.style.opacity = '0';
      setTimeout(() => cameraHeroCard.style.display = 'none', 400);
      cameraStatus.classList.add('active');
      cameraStatusText.textContent = "Vision: Active";
      showToast("Ready! Show any hand gesture or pluck the canvas strings.");
    } else {
      showToast("Could not access camera. You can still play with keyboard and mouse!");
      cameraHeroCard.style.display = 'none';
    }
  }

  function stopAirGuitar() {
    tracker.stopCamera();
    audio.stopTune();
    state.cameraActive = false;
    cameraBtnText.textContent = "Start Vision";
    btnStartCamera.classList.remove('active');
    cameraHeroCard.style.display = 'flex';
    setTimeout(() => cameraHeroCard.style.opacity = '1', 50);
    cameraStatus.classList.remove('active');
    cameraStatusText.textContent = "Vision: Standby";
    resetActiveTuneUI();
  }

  btnStartCamera.addEventListener('click', () => {
    if (state.cameraActive) stopAirGuitar();
    else startAirGuitar();
  });

  btnLaunchGuitar.addEventListener('click', () => {
    startAirGuitar();
  });

  btnLaunchKeyboard.addEventListener('click', () => {
    audio.init();
    audio.resume();
    if (cameraHeroCard) {
      cameraHeroCard.style.opacity = '0';
      setTimeout(() => cameraHeroCard.style.display = 'none', 400);
    }
    showToast("Keyboard Mode Active! Use 1-6 keys to pluck, Q-R for chords, A-K for riffs.");
  });

  // Attempt auto-start camera immediately for instant experience
  setTimeout(() => {
    startAirGuitar();
  }, 200);

  // =========================================================================
  // Gesture Handling & Tune Playback
  // =========================================================================

  function playGestureTune(gestureId) {
    if (!audio.isInitialized) audio.init();
    audio.resume();

    const tuneId = state.gestureMapping[gestureId];
    if (!tuneId) return;

    const tune = window.AirGuitarTunes.GUITAR_TUNES[tuneId];
    if (!tune) return;

    state.activeGesture = gestureId;
    state.activeTuneId = tuneId;

    // Start playing and continuously looping the guitar tune
    audio.playTune(tuneId);

    // Update UI Elements
    updateActiveTuneUI(gestureId, tune);
  }

  // Chord Names mapped to gestures for clean HUD
  const gestureChordNames = {
    'rock_horns': 'E7',
    'peace_sign': 'Gmaj7',
    'open_palm': 'Am9',
    'index_point': 'A7',
    'closed_fist': 'E5',
    'thumbs_up': 'D9',
    'pinch_grip': 'Cmaj7',
    'shaka_sign': 'Em'
  };

  const gestureSubtitles = {
    'rock_horns': 'V7 • Heavy Lead',
    'peace_sign': 'I • Acoustic Ballad',
    'open_palm': 'iv • Flamenco Run',
    'index_point': 'IV7 • Soulful Blues',
    'closed_fist': 'I5 • Metal Power Chug',
    'thumbs_up': 'VII9 • Funky Groove',
    'pinch_grip': 'VI • Ambient Swell',
    'shaka_sign': 'i • Surf Tremolo'
  };

  function updateActiveTuneUI(gestureId, tune) {
    const meta = window.AirGuitarTunes.GESTURE_METADATA.find(m => m.id === gestureId);
    const gestureName = meta ? meta.name : 'Custom Gesture';
    const iconName = meta ? meta.icon : 'music';

    // Update Clean Center-Bottom Chord Display (Screenshot Style)
    if (cleanChordTitle) {
      cleanChordTitle.textContent = gestureChordNames[gestureId] || 'E7';
      cleanChordTitle.classList.add('pulse');
      setTimeout(() => cleanChordTitle.classList.remove('pulse'), 140);
    }
    if (cleanChordSub) {
      cleanChordSub.textContent = gestureSubtitles[gestureId] || tune.title;
    }

    if (detectedGestureName) detectedGestureName.textContent = gestureName;
    if (statusGestureIcon) statusGestureIcon.setAttribute('data-lucide', iconName);
    if (activeTuneName) activeTuneName.textContent = tune.title;
    if (activeGestureIcon) activeGestureIcon.innerHTML = `<i data-lucide="${iconName}"></i>`;
    if (currentTuneTitle) currentTuneTitle.textContent = tune.title;
    if (currentTuneStyle) currentTuneStyle.textContent = `${tune.genre} • ${tune.bpm} BPM`;

    // Highlight HUD Banner
    if (hudGestureIcon) hudGestureIcon.innerHTML = `<i data-lucide="${iconName}"></i>`;
    if (hudGestureTitle) hudGestureTitle.textContent = gestureName;
    if (hudTuneSubtitle) hudTuneSubtitle.textContent = `Playing: ${tune.title}`;
    if (hudGestureBanner) hudGestureBanner.classList.add('visible');

    // Sync Tone preset selector
    if (tune.preferredTone && quickToneSelect) {
      quickToneSelect.value = tune.preferredTone;
    }

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  function resetActiveTuneUI() {
    if (cleanChordTitle) cleanChordTitle.textContent = "E7";
    if (cleanChordSub) cleanChordSub.textContent = "V7";
    if (detectedGestureName) detectedGestureName.textContent = "Show Hand";
    if (statusGestureIcon) statusGestureIcon.setAttribute('data-lucide', 'hand');
    if (activeTuneName) activeTuneName.textContent = "Idle";
    if (activeGestureIcon) activeGestureIcon.innerHTML = `<i data-lucide="music"></i>`;
    if (currentTuneTitle) currentTuneTitle.textContent = "Ready to Play";
    if (currentTuneStyle) currentTuneStyle.textContent = "Show a hand gesture or press hotkeys to play";
    if (hudGestureBanner) hudGestureBanner.classList.remove('visible');

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  // Tracker Callbacks
  let lastPitchText = '';
  let lastWahText = '';

  tracker.onGestureDetected = (gesture) => {
    if (gesture !== 'none') {
      playGestureTune(gesture);
    }
  };

  tracker.onHandMove = (point) => {
    // Real-time Hand Point Modulations
    const semitones = audio.setPitchModulation(point.x);
    const cutoff = audio.setWahModulation(point.y);

    // Update Modulation Bars in UI without redundant DOM repaints
    const pitchStr = `${semitones > 0 ? '+' : ''}${semitones} st`;
    if (pitchStr !== lastPitchText) {
      lastPitchText = pitchStr;
      if (pitchModBar) {
        const pitchPct = Math.round(((semitones + 6) / 13) * 100);
        pitchModBar.style.width = `${pitchPct}%`;
      }
      if (pitchModVal) pitchModVal.textContent = pitchStr;

      const keyLabels = ['B Standard', 'C Standard', 'C# Standard', 'D Standard', 'D# Standard', 'E Standard', 'F Standard', 'F# Standard', 'G Standard', 'G# Standard', 'A Standard', 'A# Standard', 'B High', 'C High'];
      if (tuneKeyDisplay) tuneKeyDisplay.textContent = `Key: ${keyLabels[semitones + 5] || 'E Standard'}`;
    }

    const wahStr = `${(cutoff / 1000).toFixed(1)} kHz`;
    if (wahStr !== lastWahText) {
      lastWahText = wahStr;
      if (wahModBar) {
        const wahPct = Math.round(((cutoff - 250) / 7250) * 100);
        wahModBar.style.width = `${wahPct}%`;
      }
      if (wahModVal) wahModVal.textContent = wahStr;
    }
  };

  // Note Trigger visualizer callback (string vibration + fret highlight)
  audio.onNoteTrigger = (noteEvent) => {
    visualizer.triggerNoteVisual(noteEvent.string - 1, noteEvent.fret);
    if (cleanChordTitle) {
      cleanChordTitle.classList.add('pulse');
      setTimeout(() => cleanChordTitle.classList.remove('pulse'), 100);
    }
  };

  // Main Visualizer Animation Frame Loop & FPS calculation
  let currentLandmarks = null;
  let currentPoint = null;
  let frameCount = 0;
  let fpsTimer = performance.now();

  tracker.onFrameLandmarks = (results, landmarks, smoothedPoint) => {
    currentLandmarks = landmarks;
    currentPoint = smoothedPoint;
  };

  function renderLoop() {
    const now = performance.now();
    frameCount++;
    if (now - fpsTimer >= 1000) {
      const fps = Math.round((frameCount * 1000) / (now - fpsTimer));
      if (fpsCounter) fpsCounter.textContent = `${fps} FPS`;
      frameCount = 0;
      fpsTimer = now;
    }

    // Dynamic Top-Right VU Meter update (Screenshot Style)
    if (audio && audio.analyser && vuBars.length > 0) {
      const buffer = new Uint8Array(audio.analyser.frequencyBinCount);
      audio.analyser.getByteFrequencyData(buffer);
      let sum = 0;
      for (let i = 0; i < buffer.length; i++) sum += buffer[i];
      const avg = sum / buffer.length;
      const level = Math.min(1, (avg / 100) * (audio.isPlayingTune ? 1.3 : 1.0));
      const activeCount = Math.round(level * vuBars.length);
      for (let i = 0; i < vuBars.length; i++) {
        vuBars[i].classList.toggle('active', i < activeCount);
        vuBars[i].classList.toggle('peak', i >= vuBars.length - 2 && i < activeCount);
      }
    }

    visualizer.render(video, currentLandmarks, currentPoint, audio.isPlayingTune);
    requestAnimationFrame(renderLoop);
  }
  requestAnimationFrame(renderLoop);


  // =========================================================================
  // Studio Lossless WAV Recorder Controls
  // =========================================================================

  function formatTime(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    const ms = Math.floor((sec % 1) * 10);
    return `${m}:${s}.${ms}`;
  }

  audio.onRecordTimeUpdate = (elapsedSec) => {
    if (recordTimer) {
      recordTimer.textContent = formatTime(elapsedSec);
    }
  };

  btnRecord.addEventListener('click', () => {
    if (!audio.isRecording) {
      audio.startRecording();
      btnRecord.classList.add('recording');
      recordBtnText.textContent = "REC";
      btnPauseRecord.style.display = 'flex';
      btnStopRecord.style.display = 'flex';
      showToast("Live recording session started. Play your guitar riffs!");
    }
  });

  btnPauseRecord.addEventListener('click', () => {
    const isPaused = audio.pauseRecording();
    if (isPaused) {
      recordPauseIcon.setAttribute('data-lucide', 'play');
      btnRecord.classList.remove('recording');
      showToast("Recording paused.");
    } else {
      recordPauseIcon.setAttribute('data-lucide', 'pause');
      btnRecord.classList.add('recording');
      showToast("Recording resumed.");
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  });

  btnStopRecord.addEventListener('click', () => {
    const wavResult = audio.stopRecording();
    btnRecord.classList.remove('recording');
    btnPauseRecord.style.display = 'none';
    btnStopRecord.style.display = 'none';
    recordTimer.textContent = "00:00.0";

    if (wavResult && wavResult.url) {
      recordedAudioPlayer.src = wavResult.url;
      btnDownloadWav.href = wavResult.url;
      exportDurationText.textContent = `Duration: ${formatTime(wavResult.duration)}`;
      recordingExportModal.classList.add('open');
      showToast("Performance recorded! Lossless WAV audio ready for download.");
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  });

  closeRecordModalBtn.addEventListener('click', () => {
    recordingExportModal.classList.remove('open');
    recordedAudioPlayer.pause();
  });

  // =========================================================================
  // 3-Band Studio EQ Controls
  // =========================================================================

  const eqLowSlider = document.getElementById('eqLowSlider');
  const eqMidSlider = document.getElementById('eqMidSlider');
  const eqHighSlider = document.getElementById('eqHighSlider');
  const eqLowVal = document.getElementById('eqLowVal');
  const eqMidVal = document.getElementById('eqMidVal');
  const eqHighVal = document.getElementById('eqHighVal');
  const eqPresetSelect = document.getElementById('eqPresetSelect');

  if (eqLowSlider) {
    eqLowSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      audio.setEqLow(val);
      eqLowVal.textContent = `${val > 0 ? '+' : ''}${val.toFixed(1)} dB`;
    });
  }

  if (eqMidSlider) {
    eqMidSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      audio.setEqMid(val);
      eqMidVal.textContent = `${val > 0 ? '+' : ''}${val.toFixed(1)} dB`;
    });
  }

  if (eqHighSlider) {
    eqHighSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      audio.setEqHigh(val);
      eqHighVal.textContent = `${val > 0 ? '+' : ''}${val.toFixed(1)} dB`;
    });
  }

  if (eqPresetSelect) {
    eqPresetSelect.addEventListener('change', (e) => {
      const p = audio.setEqPreset(e.target.value);
      eqLowSlider.value = p.low;
      eqMidSlider.value = p.mid;
      eqHighSlider.value = p.high;
      eqLowVal.textContent = `${p.low > 0 ? '+' : ''}${p.low.toFixed(1)} dB`;
      eqMidVal.textContent = `${p.mid > 0 ? '+' : ''}${p.mid.toFixed(1)} dB`;
      eqHighVal.textContent = `${p.high > 0 ? '+' : ''}${p.high.toFixed(1)} dB`;
    });
  }

  // =========================================================================
  // Sound Controls, Pedalboard & Drum Machine
  // =========================================================================

  // Guitar Tone Presets
  document.querySelectorAll('.tone-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tone-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      audio.setTonePreset(btn.dataset.preset);
    });
  });

  // Stop button
  document.getElementById('btnStopTune').addEventListener('click', () => {
    audio.stopTune();
    resetActiveTuneUI();
  });

  // Master Volume & Mute
  const masterVolSlider = document.getElementById('masterVolSlider');
  const volValText = document.getElementById('volValText');
  const btnMuteToggle = document.getElementById('btnMuteToggle');
  const muteIcon = document.getElementById('muteIcon');

  masterVolSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    audio.setMasterVolume(val);
    volValText.textContent = `${Math.round(val * 100)}%`;
  });

  btnMuteToggle.addEventListener('click', () => {
    const isMuted = audio.toggleMute();
    state.isMuted = isMuted;
    muteIcon.setAttribute('data-lucide', isMuted ? 'volume-x' : 'volume-2');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  });

  // FX Pedals
  const fxDistortionEnable = document.getElementById('fxDistortionEnable');
  const fxDriveAmount = document.getElementById('fxDriveAmount');
  const fxDriveTone = document.getElementById('fxDriveTone');
  const fxReverbEnable = document.getElementById('fxReverbEnable');
  const fxReverbMix = document.getElementById('fxReverbMix');
  const fxDelayMix = document.getElementById('fxDelayMix');
  const fxChorusEnable = document.getElementById('fxChorusEnable');
  const fxChorusDepth = document.getElementById('fxChorusDepth');
  const fxChorusRate = document.getElementById('fxChorusRate');

  fxDistortionEnable.addEventListener('change', (e) => {
    if (audio.distortionGain) {
      audio.distortionGain.gain.setValueAtTime(e.target.checked ? 1.0 : 0.0, audio.ctx?.currentTime || 0);
    }
  });

  fxDriveAmount.addEventListener('input', (e) => {
    if (audio.distortionNode) {
      audio.distortionNode.curve = audio.makeDistortionCurve(parseFloat(e.target.value));
    }
  });

  fxDriveTone.addEventListener('input', (e) => {
    if (audio.toneHigh) {
      audio.toneHigh.frequency.setValueAtTime(parseFloat(e.target.value), audio.ctx?.currentTime || 0);
    }
  });

  fxReverbEnable.addEventListener('change', (e) => {
    if (audio.reverbGain) {
      audio.reverbGain.gain.setValueAtTime(e.target.checked ? parseFloat(fxReverbMix.value) : 0, audio.ctx?.currentTime || 0);
    }
  });

  fxReverbMix.addEventListener('input', (e) => {
    if (audio.reverbGain && fxReverbEnable.checked) {
      audio.reverbGain.gain.setValueAtTime(parseFloat(e.target.value), audio.ctx?.currentTime || 0);
    }
  });

  fxDelayMix.addEventListener('input', (e) => {
    if (audio.delayGain) {
      audio.delayGain.gain.setValueAtTime(parseFloat(e.target.value), audio.ctx?.currentTime || 0);
    }
  });

  fxChorusEnable.addEventListener('change', (e) => {
    if (audio.chorusGain) {
      audio.chorusGain.gain.setValueAtTime(e.target.checked ? 0.35 : 0, audio.ctx?.currentTime || 0);
    }
  });

  // Drum Backing Machine & Tap Tempo
  const btnToggleDrums = document.getElementById('btnToggleDrums');
  const drumIcon = document.getElementById('drumIcon');
  const drumText = document.getElementById('drumText');
  const bpmSlider = document.getElementById('bpmSlider');
  const bpmText = document.getElementById('bpmText');
  const btnTapTempo = document.getElementById('btnTapTempo');
  const beatPulseDot = document.getElementById('beatPulseDot');

  document.querySelectorAll('.drum-chip').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.drum-chip').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      audio.drumGenre = pill.dataset.genre;
    });
  });

  btnToggleDrums.addEventListener('click', () => {
    const isPlaying = audio.toggleDrums();
    drumText.textContent = isPlaying ? "Stop Drums" : "Play Drums";
    drumIcon.setAttribute('data-lucide', isPlaying ? 'square' : 'play');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  });

  bpmSlider.addEventListener('input', (e) => {
    const bpm = parseInt(e.target.value, 10);
    bpmText.textContent = bpm;
    audio.setBpm(bpm);
  });

  // Tap Tempo Logic
  let tapTimes = [];
  if (btnTapTempo) {
    btnTapTempo.addEventListener('click', () => {
      const now = performance.now();
      tapTimes.push(now);
      if (tapTimes.length > 4) tapTimes.shift();

      if (tapTimes.length >= 2) {
        let intervals = [];
        for (let i = 1; i < tapTimes.length; i++) {
          const delta = tapTimes[i] - tapTimes[i - 1];
          if (delta < 2000) intervals.push(delta);
        }
        if (intervals.length > 0) {
          const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
          const calculatedBpm = Math.max(70, Math.min(180, Math.round(60000 / avgInterval)));
          bpmSlider.value = calculatedBpm;
          bpmText.textContent = calculatedBpm;
          audio.setBpm(calculatedBpm);
          showToast(`Tap Tempo: ${calculatedBpm} BPM`);
        }
      }
    });
  }

  // Beat Beacon Pulse Loop
  setInterval(() => {
    if (beatPulseDot && audio.isDrumsPlaying) {
      beatPulseDot.classList.add('pulse');
      setTimeout(() => beatPulseDot.classList.remove('pulse'), 120);
    }
  }, (60 / (audio.drumBpm || 115)) * 1000);

  // Hand Modulation Options
  document.getElementById('enablePitchMod').addEventListener('change', (e) => {
    audio.enablePitchMod = e.target.checked;
    if (!e.target.checked) audio.pitchSemitones = 0;
  });

  document.getElementById('enableWahMod').addEventListener('change', (e) => {
    audio.enableWahMod = e.target.checked;
  });

  document.getElementById('enableContinuousLoop').addEventListener('change', (e) => {
    audio.continuousLoop = e.target.checked;
  });

  // Reset Mapping
  document.getElementById('btnResetMapping').addEventListener('click', () => {
    state.gestureMapping = { ...window.AirGuitarTunes.DEFAULT_GESTURE_MAPPING };
    renderGestureList();
    showToast("Gesture mappings reset to default.");
  });

  // =========================================================================
  // Keyboard Studio Controls & Shortcuts
  // =========================================================================

  window.addEventListener('keydown', (e) => {
    // Ignore if typing inside input / select
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

    const key = e.key.toLowerCase();

    // 1-6 Keys: Direct String Plucking
    if (['1', '2', '3', '4', '5', '6'].includes(key)) {
      const strIndex = parseInt(key, 10) - 1;
      audio.pluckString(strIndex, 0, 0.95);
      e.preventDefault();
      return;
    }

    // Q, W, E, R: Chords Strumming
    if (key === 'q') { audio.strumChord('Em'); e.preventDefault(); return; }
    if (key === 'w') { audio.strumChord('G'); e.preventDefault(); return; }
    if (key === 'e') { audio.strumChord('C'); e.preventDefault(); return; }
    if (key === 'r' && !e.ctrlKey) { audio.strumChord('D'); e.preventDefault(); return; }

    // A-K Keys: Gesture Riffs
    const gestureKeyMap = {
      'a': 'rock_horns',
      's': 'peace_sign',
      'd': 'open_palm',
      'f': 'index_point',
      'g': 'closed_fist',
      'h': 'thumbs_up',
      'j': 'pinch_grip',
      'k': 'shaka_sign'
    };

    if (gestureKeyMap[key]) {
      playGestureTune(gestureKeyMap[key]);
      e.preventDefault();
      return;
    }

    // Spacebar: Heavy Metal Power Chord Chug
    if (e.code === 'Space') {
      audio.strumChord('E5', 1.0);
      e.preventDefault();
      return;
    }

    // Mute toggle
    if (key === 'm') {
      btnMuteToggle.click();
      e.preventDefault();
      return;
    }
  });

  // =========================================================================
  // Modals & Settings
  // =========================================================================

  btnTutorial.addEventListener('click', () => {
    tutorialModal.classList.add('open');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  });
  closeTutorialBtn.addEventListener('click', () => tutorialModal.classList.remove('open'));
  btnGotIt.addEventListener('click', () => tutorialModal.classList.remove('open'));

  btnSettings.addEventListener('click', () => {
    settingsModal.classList.add('open');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  });
  closeSettingsBtn.addEventListener('click', () => settingsModal.classList.remove('open'));
  btnSaveSettings.addEventListener('click', () => settingsModal.classList.remove('open'));

  btnKeyboardGuide.addEventListener('click', () => {
    keyboardModal.classList.add('open');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  });
  closeKeyboardBtn.addEventListener('click', () => keyboardModal.classList.remove('open'));
  btnCloseKeyboardModal.addEventListener('click', () => keyboardModal.classList.remove('open'));

  // Settings inputs
  document.getElementById('setGestureDebounce').addEventListener('input', (e) => {
    tracker.debounceMs = parseInt(e.target.value, 10);
  });
  document.getElementById('setSmoothing').addEventListener('input', (e) => {
    tracker.smoothingFactor = parseFloat(e.target.value);
  });
  document.getElementById('toggleParticles').addEventListener('change', (e) => {
    visualizer.showParticles = e.target.checked;
  });
  document.getElementById('toggleHandSkeleton').addEventListener('change', (e) => {
    visualizer.showSkeleton = e.target.checked;
  });

  // Toast Helper
  function showToast(msg) {
    hudToastMsg.textContent = msg;
    hudToast.style.opacity = '1';
    setTimeout(() => {
      hudToast.style.opacity = '0.7';
    }, 4000);
  }
});
