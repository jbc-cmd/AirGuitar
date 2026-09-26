/**
 * AirGuitar AI — Main Application Orchestrator
 * Integrates Audio Engine, Hand Tracking, Visualizer, Gesture Mapping & User Interface.
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
    isMuted: false
  };

  // DOM Elements
  const video = document.getElementById('webcamVideo');
  const canvas = document.getElementById('guitarCanvas');
  const scopeCanvas = document.getElementById('audioVisualizerCanvas');
  const btnStartCamera = document.getElementById('btnStartCamera');
  const btnLaunchGuitar = document.getElementById('btnLaunchGuitar');
  const cameraBtnText = document.getElementById('cameraBtnText');
  const cameraBtnIcon = document.getElementById('cameraBtnIcon');
  const cameraStatus = document.getElementById('cameraStatus');
  const cameraStatusText = document.getElementById('cameraStatusText');
  const detectedGestureName = document.getElementById('detectedGestureName');
  const statusGestureIcon = document.getElementById('statusGestureIcon');
  const activeTuneName = document.getElementById('activeTuneName');
  const cameraHeroCard = document.getElementById('cameraHeroCard');

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

  // Tune Card Elements
  const activeGestureIcon = document.getElementById('activeGestureIcon');
  const currentTuneTitle = document.getElementById('currentTuneTitle');
  const currentTuneStyle = document.getElementById('currentTuneStyle');
  const tuneKeyDisplay = document.getElementById('tuneKeyDisplay');
  const gestureTuneList = document.getElementById('gestureTuneList');

  // Panels & Navigation
  const panelLeft = document.getElementById('panelLeft');
  const panelRight = document.getElementById('panelRight');
  const toggleLeftPanel = document.getElementById('toggleLeftPanel');
  const toggleRightPanel = document.getElementById('toggleRightPanel');
  const workstationGrid = document.getElementById('workstationGrid');

  // Modals
  const tutorialModal = document.getElementById('tutorialModal');
  const settingsModal = document.getElementById('settingsModal');
  const btnTutorial = document.getElementById('btnTutorial');
  const btnSettings = document.getElementById('btnSettings');
  const closeTutorialBtn = document.getElementById('closeTutorialBtn');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const btnGotIt = document.getElementById('btnGotIt');
  const btnSaveSettings = document.getElementById('btnSaveSettings');

  // Audio & Systems
  const audio = new window.AirGuitarAudioEngine();
  window.airGuitarAudio = audio;

  const visualizer = new window.AirGuitarVisualizer(canvas, scopeCanvas);
  const tracker = new window.AirGuitarHandTracker();

  // Resize canvas to match display
  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width || 1280;
    canvas.height = rect.height || 720;
  }
  window.addEventListener('resize', resizeCanvas);
  setTimeout(resizeCanvas, 100);

  // Panel Toggle Navigation Handlers
  if (toggleLeftPanel && panelLeft) {
    toggleLeftPanel.addEventListener('click', () => {
      panelLeft.classList.toggle('panel-collapsed');
      toggleLeftPanel.classList.toggle('active');
      workstationGrid.classList.toggle('left-collapsed', panelLeft.classList.contains('panel-collapsed'));
      setTimeout(resizeCanvas, 220);
    });
  }

  if (toggleRightPanel && panelRight) {
    toggleRightPanel.addEventListener('click', () => {
      panelRight.classList.toggle('panel-collapsed');
      toggleRightPanel.classList.toggle('active');
      workstationGrid.classList.toggle('right-collapsed', panelRight.classList.contains('panel-collapsed'));
      setTimeout(resizeCanvas, 220);
    });
  }

  // =========================================================================
  // Initialize UI & Gesture Mapping List
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

      // Row click handler (manual trigger)
      row.addEventListener('click', (e) => {
        if (e.target.tagName !== 'SELECT') {
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
      showToast("Ready! Show any hand gesture to synthesize tunes.");
    } else {
      showToast("Could not access camera. Please allow webcam permissions.");
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

  function updateActiveTuneUI(gestureId, tune) {
    const meta = window.AirGuitarTunes.GESTURE_METADATA.find(m => m.id === gestureId);
    const gestureName = meta ? meta.name : 'Custom Gesture';
    const iconName = meta ? meta.icon : 'music';

    detectedGestureName.textContent = gestureName;
    if (statusGestureIcon) {
      statusGestureIcon.setAttribute('data-lucide', iconName);
    }
    activeTuneName.textContent = tune.title;

    activeGestureIcon.innerHTML = `<i data-lucide="${iconName}"></i>`;
    currentTuneTitle.textContent = tune.title;
    currentTuneStyle.textContent = `${tune.genre} • ${tune.bpm} BPM`;

    // Highlight HUD Banner
    hudGestureIcon.innerHTML = `<i data-lucide="${iconName}"></i>`;
    hudGestureTitle.textContent = gestureName;
    hudTuneSubtitle.textContent = `Playing: ${tune.title}`;
    hudGestureBanner.classList.add('visible');

    // Sync Tone preset pill
    if (tune.preferredTone) {
      document.querySelectorAll('.tone-chip, .pill-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.preset === tune.preferredTone);
      });
    }

    // Highlight active row in sidebar
    document.querySelectorAll('.gesture-tune-row').forEach(row => {
      row.classList.toggle('active', row.dataset.gestureId === gestureId);
    });

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  function resetActiveTuneUI() {
    detectedGestureName.textContent = "Show Hand";
    if (statusGestureIcon) {
      statusGestureIcon.setAttribute('data-lucide', 'hand');
    }
    activeTuneName.textContent = "Idle";
    activeGestureIcon.innerHTML = `<i data-lucide="music"></i>`;
    currentTuneTitle.textContent = "Ready to Play";
    currentTuneStyle.textContent = "Show a hand gesture to start a tune";
    hudGestureBanner.classList.remove('visible');
    document.querySelectorAll('.gesture-tune-row').forEach(row => row.classList.remove('active'));

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  // Tracker Callbacks
  tracker.onGestureDetected = (gesture) => {
    if (gesture !== 'none') {
      playGestureTune(gesture);
    }
  };

  tracker.onHandMove = (point) => {
    // Real-time Hand Point Modulations
    const semitones = audio.setPitchModulation(point.x);
    const cutoff = audio.setWahModulation(point.y);

    // Update Modulation Bars in UI
    const pitchPct = Math.round(((semitones + 6) / 13) * 100);
    pitchModBar.style.width = `${pitchPct}%`;
    pitchModVal.textContent = `${semitones > 0 ? '+' : ''}${semitones} st`;

    const wahPct = Math.round(((cutoff - 250) / 7250) * 100);
    wahModBar.style.width = `${wahPct}%`;
    wahModVal.textContent = `${(cutoff / 1000).toFixed(1)} kHz`;

    // Update key badge
    const keyLabels = ['B Standard', 'C Standard', 'C# Standard', 'D Standard', 'D# Standard', 'E Standard', 'F Standard', 'F# Standard', 'G Standard', 'G# Standard', 'A Standard', 'A# Standard', 'B High', 'C High'];
    tuneKeyDisplay.textContent = `Key: ${keyLabels[semitones + 5] || 'E Standard'}`;
  };

  // Note Trigger visualizer callback (string vibration + fret highlight)
  audio.onNoteTrigger = (noteEvent) => {
    visualizer.triggerNoteVisual(noteEvent.string - 1, noteEvent.fret);

    // Light up matching fret node in HUD
    const fretNode = document.querySelector(`.fret-node[data-fret="${noteEvent.fret}"]`);
    if (fretNode) {
      fretNode.classList.add('active');
      setTimeout(() => fretNode.classList.remove('active'), 140);
    }
  };

  // Main Visualizer Animation Frame Loop
  let currentLandmarks = null;
  let currentPoint = null;

  tracker.onFrameLandmarks = (results, landmarks, smoothedPoint) => {
    currentLandmarks = landmarks;
    currentPoint = smoothedPoint;
  };

  function renderLoop() {
    visualizer.render(video, currentLandmarks, currentPoint, audio.isPlayingTune);
    requestAnimationFrame(renderLoop);
  }
  requestAnimationFrame(renderLoop);

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

  // Drum Backing Machine
  const btnToggleDrums = document.getElementById('btnToggleDrums');
  const drumIcon = document.getElementById('drumIcon');
  const drumText = document.getElementById('drumText');
  const bpmSlider = document.getElementById('bpmSlider');
  const bpmText = document.getElementById('bpmText');

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
