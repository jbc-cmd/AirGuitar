/**
 * AirGuitar AI — Web Audio Synthesizer Engine
 * High-performance string physical synthesis, effects pedalboard & precise lookahead scheduler.
 */

class AirGuitarAudioEngine {
  constructor() {
    this.ctx = null;
    this.isInitialized = false;

    // Master nodes
    this.masterGain = null;
    this.masterLimiter = null;
    this.analyser = null;

    // FX Nodes
    this.wahFilter = null;
    this.distortionNode = null;
    this.distortionGain = null;
    this.toneLow = null;
    this.toneMid = null;
    this.toneHigh = null;
    this.reverbNode = null;
    this.reverbGain = null;
    this.delayNode = null;
    this.delayFeedback = null;
    this.delayGain = null;
    this.chorusDelay = null;
    this.chorusLFO = null;
    this.chorusGain = null;

    // Drum Machine Nodes
    this.drumGain = null;
    this.isDrumsPlaying = false;
    this.drumGenre = 'rock';
    this.drumBpm = 115;
    this.drumStep = 0;
    this.drumTimer = null;

    // Tune Playback State
    this.currentTune = null;
    this.isPlayingTune = false;
    this.activeTuneId = null;
    this.activePreset = 'rock-overdrive';
    this.masterVolume = 0.85;
    this.isMuted = false;

    // Modulation parameters
    this.pitchSemitones = 0; // Transposition from Hand X (-6 to +6 semitones)
    this.wahCutoff = 3500; // From Hand Y (400Hz to 6000Hz)
    this.enablePitchMod = true;
    this.enableWahMod = true;
    this.continuousLoop = true;

    // Lookahead Scheduler
    this.stepIndex = 0;
    this.nextNoteTime = 0;
    this.scheduleAheadTime = 0.1; // 100ms
    this.schedulerTimer = null;

    // Direct Plucking Tuning Table (Standard Guitar Tuning 1-6)
    this.openStringFreqs = [329.63, 246.94, 196.00, 146.83, 110.00, 82.41]; // High E to Low E

    // Studio Audio Recording Engine
    this.isRecording = false;
    this.recordingPaused = false;
    this.recordingStartTime = 0;
    this.recordedChunks = [];
    this.recordStreamDest = null;
    this.mediaRecorder = null;
    this.recordNode = null;
    this.recordedLeftBuffers = [];
    this.recordedRightBuffers = [];
    this.recordingSampleCount = 0;

    // Callback when a note is triggered (for UI / fret visualizer)
    this.onNoteTrigger = null;
    this.onRecordTimeUpdate = null;
  }

  init() {
    if (this.isInitialized) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();

    // Master Compressor / Limiter to prevent clipping
    this.masterLimiter = this.ctx.createDynamicsCompressor();
    this.masterLimiter.threshold.setValueAtTime(-2, this.ctx.currentTime);
    this.masterLimiter.knee.setValueAtTime(4, this.ctx.currentTime);
    this.masterLimiter.ratio.setValueAtTime(12, this.ctx.currentTime);
    this.masterLimiter.attack.setValueAtTime(0.003, this.ctx.currentTime);
    this.masterLimiter.release.setValueAtTime(0.15, this.ctx.currentTime);

    // Master Analyser Node
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;

    // Master Volume Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);

    // Build Effects Chain
    this.setupEffectsChain();

    // Drum Sub-mix
    this.drumGain = this.ctx.createGain();
    this.drumGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
    this.drumGain.connect(this.masterLimiter);

    // Connect Limiter -> Master Gain -> Analyser -> Destination
    this.masterLimiter.connect(this.masterGain);
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // Setup Recording Tap from Analyser
    this.setupRecorder();

    this.isInitialized = true;
    console.log("AirGuitar Audio Engine initialized successfully.");
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setupEffectsChain() {
    // 1. Wah-Wah Filter
    this.wahFilter = this.ctx.createBiquadFilter();
    this.wahFilter.type = 'lowpass';
    this.wahFilter.frequency.setValueAtTime(3500, this.ctx.currentTime);
    this.wahFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);

    // 2. Distortion / Overdrive Waveshaper
    this.distortionNode = this.ctx.createWaveShaper();
    this.distortionNode.curve = this.makeDistortionCurve(18);
    this.distortionNode.oversample = '4x';
    this.distortionGain = this.ctx.createGain();
    this.distortionGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

    // 3. 3-Band Tone Equalizer
    this.toneLow = this.ctx.createBiquadFilter();
    this.toneLow.type = 'lowshelf';
    this.toneLow.frequency.setValueAtTime(250, this.ctx.currentTime);
    this.toneLow.gain.setValueAtTime(2, this.ctx.currentTime);

    this.toneMid = this.ctx.createBiquadFilter();
    this.toneMid.type = 'peaking';
    this.toneMid.frequency.setValueAtTime(1500, this.ctx.currentTime);
    this.toneMid.gain.setValueAtTime(1.5, this.ctx.currentTime);

    this.toneHigh = this.ctx.createBiquadFilter();
    this.toneHigh.type = 'highshelf';
    this.toneHigh.frequency.setValueAtTime(4500, this.ctx.currentTime);
    this.toneHigh.gain.setValueAtTime(-1, this.ctx.currentTime);

    // 4. Delay / Echo
    this.delayNode = this.ctx.createDelay(1.0);
    this.delayNode.delayTime.setValueAtTime(0.28, this.ctx.currentTime);
    this.delayFeedback = this.ctx.createGain();
    this.delayFeedback.gain.setValueAtTime(0.35, this.ctx.currentTime);
    this.delayGain = this.ctx.createGain();
    this.delayGain.gain.setValueAtTime(0.2, this.ctx.currentTime);

    this.delayNode.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);

    // 5. Algorithmic Reverb Impulse
    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = this.buildReverbImpulse(2.2, 2.0);
    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

    // 6. Chorus / Flange LFO
    this.chorusDelay = this.ctx.createDelay();
    this.chorusDelay.delayTime.setValueAtTime(0.0035, this.ctx.currentTime);
    const chorusOsc = this.ctx.createOscillator();
    const chorusOscGain = this.ctx.createGain();
    chorusOsc.frequency.setValueAtTime(1.5, this.ctx.currentTime);
    chorusOscGain.gain.setValueAtTime(0.0015, this.ctx.currentTime);
    chorusOsc.connect(chorusOscGain);
    chorusOscGain.connect(this.chorusDelay.delayTime);
    chorusOsc.start();
    this.chorusGain = this.ctx.createGain();
    this.chorusGain.gain.setValueAtTime(0.3, this.ctx.currentTime);

    // Wire up dry & wet routing:
    // Input -> Wah -> Distortion -> Tone EQ -> [Dry + Chorus + Delay + Reverb] -> Limiter
    this.wahFilter.connect(this.distortionNode);
    this.distortionNode.connect(this.toneLow);
    this.toneLow.connect(this.toneMid);
    this.toneMid.connect(this.toneHigh);

    // Direct Dry Path
    this.toneHigh.connect(this.masterLimiter);

    // Reverb Send
    this.toneHigh.connect(this.reverbNode);
    this.reverbNode.connect(this.reverbGain);
    this.reverbGain.connect(this.masterLimiter);

    // Delay Send
    this.toneHigh.connect(this.delayNode);
    this.delayNode.connect(this.delayGain);
    this.delayGain.connect(this.masterLimiter);

    // Chorus Send
    this.toneHigh.connect(this.chorusDelay);
    this.chorusDelay.connect(this.chorusGain);
    this.chorusGain.connect(this.masterLimiter);
  }

  // Soft-clipping distortion curve
  makeDistortionCurve(amount = 20) {
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }

  // Generate synthetic stereo impulse response for rich reverb
  buildReverbImpulse(duration = 2.0, decay = 2.0) {
    const rate = this.ctx.sampleRate;
    const length = rate * duration;
    const impulse = this.ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i;
      const decayCoeff = Math.pow(1 - n / length, decay);
      left[i] = (Math.random() * 2 - 1) * decayCoeff;
      right[i] = (Math.random() * 2 - 1) * decayCoeff;
    }
    return impulse;
  }

  // =========================================================================
  // Guitar String Physical Synthesis (Pluck / Note)
  // =========================================================================

  playGuitarString(freq, time, duration = 1.0, velocity = 0.8, options = {}) {
    if (!this.ctx) return;
    time = Math.max(time, this.ctx.currentTime);

    // Apply live pitch transposition
    const transposedFreq = freq * Math.pow(2, this.pitchSemitones / 12);

    // Guitar Oscillator 1 (Main fundamental)
    const osc1 = this.ctx.createOscillator();
    // Guitar Oscillator 2 (Harmonic overtone)
    const osc2 = this.ctx.createOscillator();
    // Sub/Body resonance oscillator
    const oscSub = this.ctx.createOscillator();

    // Set waveform based on active preset
    switch (this.activePreset) {
      case 'rock-overdrive':
        osc1.type = 'sawtooth';
        osc2.type = 'square';
        oscSub.type = 'triangle';
        break;
      case 'heavy-distortion':
        osc1.type = 'sawtooth';
        osc2.type = 'sawtooth';
        oscSub.type = 'square';
        break;
      case 'acoustic-steel':
        osc1.type = 'triangle';
        osc2.type = 'sawtooth';
        oscSub.type = 'sine';
        break;
      case 'nylon-classical':
        osc1.type = 'triangle';
        osc2.type = 'sine';
        oscSub.type = 'triangle';
        break;
      case 'synth-guitar':
        osc1.type = 'sawtooth';
        osc2.type = 'sine';
        oscSub.type = 'sawtooth';
        break;
      case 'clean-chorus':
      default:
        osc1.type = 'triangle';
        osc2.type = 'sawtooth';
        oscSub.type = 'sine';
        break;
    }

    osc1.frequency.setValueAtTime(transposedFreq, time);
    osc2.frequency.setValueAtTime(transposedFreq * 2.01, time); // slight detune
    oscSub.frequency.setValueAtTime(transposedFreq * 0.5, time);

    // String Pitch Bend / Vibrato if requested
    if (options.bend) {
      osc1.frequency.exponentialRampToValueAtTime(transposedFreq * 1.122, time + duration * 0.5); // +2 semitone bend
      osc2.frequency.exponentialRampToValueAtTime(transposedFreq * 2.01 * 1.122, time + duration * 0.5);
    }
    if (options.vibrato) {
      const vibratoLfo = this.ctx.createOscillator();
      const vibratoGain = this.ctx.createGain();
      vibratoLfo.frequency.setValueAtTime(5.5, time);
      vibratoGain.gain.setValueAtTime(transposedFreq * 0.03, time);
      vibratoLfo.connect(vibratoGain);
      vibratoGain.connect(osc1.frequency);
      vibratoLfo.start(time);
      vibratoLfo.stop(time + duration);
    }

    // String Pluck Noise Transient (Burst to simulate guitar pick hitting steel/nylon)
    const noiseBuffer = this.createPluckTransient();
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(velocity * 0.6, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
    noiseSource.connect(noiseGain);
    noiseGain.connect(this.wahFilter);
    noiseSource.start(time);
    noiseSource.stop(time + 0.05);

    // String Envelope Gain (Fast attack, natural exponential guitar decay)
    const noteGain = this.ctx.createGain();
    const peakGain = Math.max(0.05, velocity * 0.7);

    noteGain.gain.setValueAtTime(0.001, time);
    noteGain.gain.linearRampToValueAtTime(peakGain, time + 0.008); // 8ms snap attack
    noteGain.gain.exponentialRampToValueAtTime(peakGain * 0.4, time + 0.15); // initial decay
    noteGain.gain.exponentialRampToValueAtTime(0.0001, time + duration); // tail decay

    // Filter per string for brightness decay
    const stringFilter = this.ctx.createBiquadFilter();
    stringFilter.type = 'lowpass';
    stringFilter.frequency.setValueAtTime(Math.min(8000, transposedFreq * 6), time);
    stringFilter.frequency.exponentialRampToValueAtTime(transposedFreq * 1.8, time + duration);

    // Connect oscillators -> stringFilter -> noteGain -> wahFilter
    osc1.connect(stringFilter);
    osc2.connect(stringFilter);
    oscSub.connect(stringFilter);

    stringFilter.connect(noteGain);
    noteGain.connect(this.wahFilter);

    // Start oscillators
    osc1.start(time);
    osc2.start(time);
    oscSub.start(time);

    osc1.stop(time + duration + 0.05);
    osc2.stop(time + duration + 0.05);
    oscSub.stop(time + duration + 0.05);
  }

  // Create short pick attack noise buffer
  createPluckTransient() {
    const bufferSize = this.ctx.sampleRate * 0.03; // 30ms
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.008));
    }
    return buffer;
  }

  // =========================================================================
  // Continuous Tune Scheduler
  // =========================================================================

  playTune(tuneId) {
    if (!this.isInitialized) this.init();
    this.resume();

    const tune = window.AirGuitarTunes?.GUITAR_TUNES[tuneId];
    if (!tune) return;

    // If already playing this tune, do not interrupt
    if (this.isPlayingTune && this.activeTuneId === tuneId) return;

    this.currentTune = tune;
    this.activeTuneId = tuneId;
    this.isPlayingTune = true;
    this.stepIndex = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.05;

    // Automatically select preferred tone preset for this tune
    if (tune.preferredTone) {
      this.setTonePreset(tune.preferredTone);
    }

    if (this.schedulerTimer) clearInterval(this.schedulerTimer);
    this.schedulerTimer = setInterval(() => this.scheduleNextNotes(), 25);
  }

  stopTune() {
    this.isPlayingTune = false;
    this.activeTuneId = null;
    this.currentTune = null;
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }

  scheduleNextNotes() {
    if (!this.isPlayingTune || !this.currentTune) return;

    const secondsPer16th = (60.0 / this.currentTune.bpm) / 4.0;

    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
      // Find all note events on this current step
      const currentStep = this.stepIndex;
      const notes = this.currentTune.pattern.filter(ev => ev.step === currentStep);

      for (const ev of notes) {
        const freq = window.AirGuitarTunes.NOTE_FREQS[ev.note] || 220;
        const durSeconds = ev.dur * secondsPer16th * 1.8;
        this.playGuitarString(freq, this.nextNoteTime, durSeconds, ev.vel, {
          bend: ev.bend,
          vibrato: ev.vibrato
        });

        // Trigger visual fret/string callback
        if (this.onNoteTrigger) {
          const delayMs = Math.max(0, (this.nextNoteTime - this.ctx.currentTime) * 1000);
          setTimeout(() => {
            if (this.onNoteTrigger) this.onNoteTrigger(ev);
          }, delayMs);
        }
      }

      this.stepIndex++;
      if (this.stepIndex >= this.currentTune.totalSteps) {
        if (this.continuousLoop) {
          this.stepIndex = 0; // Loop continuously!
        } else {
          this.stopTune();
          break;
        }
      }

      this.nextNoteTime += secondsPer16th;
    }
  }

  // =========================================================================
  // Real-time Hand Point Modulation
  // =========================================================================

  // Hand X: -6 to +6 Semitones Transposition
  setPitchModulation(normalizedX) {
    if (!this.enablePitchMod) {
      this.pitchSemitones = 0;
      return 0;
    }
    // normalizedX is 0.0 (left) to 1.0 (right)
    // Map 0.0 -> -5 semitones, 0.5 -> 0 semitones, 1.0 -> +7 semitones
    const semitones = Math.round((normalizedX - 0.5) * 12);
    this.pitchSemitones = Math.max(-6, Math.min(7, semitones));
    return this.pitchSemitones;
  }

  // Hand Y: Wah-Wah Filter Sweep (350Hz to 6500Hz)
  setWahModulation(normalizedY) {
    if (!this.enableWahMod || !this.wahFilter || !this.ctx) return 3500;
    // normalizedY is 0.0 (top) to 1.0 (bottom)
    // Top = Open/Bright (6500Hz), Bottom = Deep/Muffled (350Hz)
    const cutoff = 350 + (1.0 - normalizedY) * 6000;
    this.wahCutoff = Math.max(250, Math.min(7500, cutoff));
    this.wahFilter.frequency.setTargetAtTime(this.wahCutoff, this.ctx.currentTime, 0.04);
    return Math.round(this.wahCutoff);
  }

  // =========================================================================
  // Tone Presets & FX Controls
  // =========================================================================

  setTonePreset(preset) {
    this.activePreset = preset;
    if (!this.ctx) return;

    const time = this.ctx.currentTime;
    switch (preset) {
      case 'rock-overdrive':
        this.distortionNode.curve = this.makeDistortionCurve(20);
        this.distortionGain.gain.setTargetAtTime(1.0, time, 0.05);
        this.toneLow.gain.setTargetAtTime(3, time, 0.05);
        this.toneMid.gain.setTargetAtTime(2, time, 0.05);
        this.toneHigh.gain.setTargetAtTime(0, time, 0.05);
        this.reverbGain.gain.setTargetAtTime(0.3, time, 0.05);
        this.delayGain.gain.setTargetAtTime(0.15, time, 0.05);
        this.chorusGain.gain.setTargetAtTime(0.2, time, 0.05);
        break;

      case 'heavy-distortion':
        this.distortionNode.curve = this.makeDistortionCurve(38);
        this.distortionGain.gain.setTargetAtTime(1.2, time, 0.05);
        this.toneLow.gain.setTargetAtTime(5, time, 0.05);
        this.toneMid.gain.setTargetAtTime(-3, time, 0.05); // Scooped mids
        this.toneHigh.gain.setTargetAtTime(4, time, 0.05);
        this.reverbGain.gain.setTargetAtTime(0.25, time, 0.05);
        this.delayGain.gain.setTargetAtTime(0.1, time, 0.05);
        this.chorusGain.gain.setTargetAtTime(0.1, time, 0.05);
        break;

      case 'acoustic-steel':
        this.distortionNode.curve = this.makeDistortionCurve(1);
        this.distortionGain.gain.setTargetAtTime(0.1, time, 0.05);
        this.toneLow.gain.setTargetAtTime(1, time, 0.05);
        this.toneMid.gain.setTargetAtTime(3, time, 0.05);
        this.toneHigh.gain.setTargetAtTime(4, time, 0.05);
        this.reverbGain.gain.setTargetAtTime(0.4, time, 0.05);
        this.delayGain.gain.setTargetAtTime(0.1, time, 0.05);
        this.chorusGain.gain.setTargetAtTime(0.15, time, 0.05);
        break;

      case 'nylon-classical':
        this.distortionNode.curve = this.makeDistortionCurve(1);
        this.distortionGain.gain.setTargetAtTime(0, time, 0.05);
        this.toneLow.gain.setTargetAtTime(2, time, 0.05);
        this.toneMid.gain.setTargetAtTime(2, time, 0.05);
        this.toneHigh.gain.setTargetAtTime(-2, time, 0.05);
        this.reverbGain.gain.setTargetAtTime(0.45, time, 0.05);
        this.delayGain.gain.setTargetAtTime(0.05, time, 0.05);
        this.chorusGain.gain.setTargetAtTime(0.05, time, 0.05);
        break;

      case 'synth-guitar':
        this.distortionNode.curve = this.makeDistortionCurve(14);
        this.distortionGain.gain.setTargetAtTime(0.8, time, 0.05);
        this.toneLow.gain.setTargetAtTime(2, time, 0.05);
        this.toneMid.gain.setTargetAtTime(4, time, 0.05);
        this.toneHigh.gain.setTargetAtTime(3, time, 0.05);
        this.reverbGain.gain.setTargetAtTime(0.5, time, 0.05);
        this.delayGain.gain.setTargetAtTime(0.35, time, 0.05);
        this.chorusGain.gain.setTargetAtTime(0.5, time, 0.05);
        break;

      case 'clean-chorus':
        this.distortionNode.curve = this.makeDistortionCurve(2);
        this.distortionGain.gain.setTargetAtTime(0.2, time, 0.05);
        this.toneLow.gain.setTargetAtTime(1, time, 0.05);
        this.toneMid.gain.setTargetAtTime(2, time, 0.05);
        this.toneHigh.gain.setTargetAtTime(3, time, 0.05);
        this.reverbGain.gain.setTargetAtTime(0.35, time, 0.05);
        this.delayGain.gain.setTargetAtTime(0.2, time, 0.05);
        this.chorusGain.gain.setTargetAtTime(0.45, time, 0.05);
        break;
    }
  }

  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.02);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const target = this.isMuted ? 0 : this.masterVolume;
      this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.02);
    }
    return this.isMuted;
  }

  // =========================================================================
  // Drum Backing Machine
  // =========================================================================

  toggleDrums() {
    if (!this.isInitialized) this.init();
    this.resume();

    this.isDrumsPlaying = !this.isDrumsPlaying;
    if (this.isDrumsPlaying) {
      this.drumStep = 0;
      const intervalMs = ((60 / this.drumBpm) / 4) * 1000;
      this.drumTimer = setInterval(() => this.stepDrumBeat(), intervalMs);
    } else {
      if (this.drumTimer) {
        clearInterval(this.drumTimer);
        this.drumTimer = null;
      }
    }
    return this.isDrumsPlaying;
  }

  stepDrumBeat() {
    if (!this.isDrumsPlaying || !this.ctx) return;
    const time = this.ctx.currentTime + 0.01;
    const s = this.drumStep % 16;

    // Rock 4/4 Beat: Kick on 0, 8; Snare on 4, 12; Hi-hat on every 2
    if (this.drumGenre === 'rock' || this.drumGenre === 'acoustic') {
      if (s === 0 || s === 8 || s === 14) this.playKick(time);
      if (s === 4 || s === 12) this.playSnare(time);
      if (s % 2 === 0) this.playHiHat(time, s % 4 === 0 ? 0.4 : 0.2);
    } else if (this.drumGenre === 'metal') {
      if (s % 2 === 0) this.playKick(time); // Double bass drum
      if (s === 4 || s === 12) this.playSnare(time);
      this.playHiHat(time, 0.3);
    } else if (this.drumGenre === 'blues') {
      // Shuffle swing feel
      if (s === 0 || s === 8) this.playKick(time);
      if (s === 4 || s === 12) this.playSnare(time);
      if (s % 3 === 0) this.playHiHat(time, 0.35);
    } else if (this.drumGenre === 'funk') {
      if (s === 0 || s === 6 || s === 10) this.playKick(time);
      if (s === 4 || s === 12) this.playSnare(time);
      this.playHiHat(time, s % 2 === 0 ? 0.35 : 0.15);
    }

    this.drumStep++;
  }

  playKick(time) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(130, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.08);
    gain.gain.setValueAtTime(0.9, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
    osc.connect(gain);
    gain.connect(this.drumGain);
    osc.start(time);
    osc.stop(time + 0.23);
  }

  playSnare(time) {
    // Noise snap
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createPluckTransient();
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(1200, time);
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.8, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.drumGain);
    noise.start(time);
    noise.stop(time + 0.19);

    // Body tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.frequency.setValueAtTime(220, time);
    osc.frequency.exponentialRampToValueAtTime(90, time + 0.1);
    oscGain.gain.setValueAtTime(0.5, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
    osc.connect(oscGain);
    oscGain.connect(this.drumGain);
    osc.start(time);
    osc.stop(time + 0.13);
  }

  playHiHat(time, vol = 0.3) {
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createPluckTransient();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, time);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.drumGain);
    noise.start(time);
    noise.stop(time + 0.06);
  }

  setBpm(bpm) {
    this.drumBpm = Math.max(60, Math.min(220, bpm));
    if (this.isDrumsPlaying) {
      clearInterval(this.drumTimer);
      const intervalMs = ((60 / this.drumBpm) / 4) * 1000;
      this.drumTimer = setInterval(() => this.stepDrumBeat(), intervalMs);
    }
  }

  // =========================================================================
  // Interactive Direct Plucking & Strumming API
  // =========================================================================

  pluckString(stringIndex = 0, fret = 0, velocity = 0.9) {
    if (!this.isInitialized) this.init();
    this.resume();

    const sIdx = Math.max(0, Math.min(5, stringIndex));
    const baseFreq = this.openStringFreqs[sIdx];
    // Frequency calculation with fret and current transpose
    const fretRatio = Math.pow(2, fret / 12);
    const freq = baseFreq * fretRatio;

    const time = this.ctx.currentTime;
    const duration = 2.0;
    this.triggerGuitarNote(freq, duration, velocity, { string: sIdx + 1, fret: fret });

    if (this.onNoteTrigger) {
      this.onNoteTrigger({ string: sIdx + 1, fret: fret, velocity: velocity });
    }
  }

  strumChord(chordType = 'Em', velocity = 0.85) {
    if (!this.isInitialized) this.init();
    this.resume();

    const chords = {
      'Em': [ { s: 5, f: 0 }, { s: 4, f: 2 }, { s: 3, f: 2 }, { s: 2, f: 0 }, { s: 1, f: 0 }, { s: 0, f: 0 } ],
      'G':  [ { s: 5, f: 3 }, { s: 4, f: 2 }, { s: 3, f: 0 }, { s: 2, f: 0 }, { s: 1, f: 3 }, { s: 0, f: 3 } ],
      'C':  [ { s: 4, f: 3 }, { s: 3, f: 2 }, { s: 2, f: 0 }, { s: 1, f: 1 }, { s: 0, f: 0 } ],
      'D':  [ { s: 3, f: 0 }, { s: 2, f: 2 }, { s: 1, f: 3 }, { s: 0, f: 2 } ],
      'Am': [ { s: 4, f: 0 }, { s: 3, f: 2 }, { s: 2, f: 2 }, { s: 1, f: 1 }, { s: 0, f: 0 } ],
      'E5': [ { s: 5, f: 0 }, { s: 4, f: 2 }, { s: 3, f: 2 } ]
    };

    const notes = chords[chordType] || chords['Em'];
    notes.forEach((item, idx) => {
      setTimeout(() => {
        this.pluckString(item.s, item.f, velocity * (0.85 + Math.random() * 0.2));
      }, idx * 25); // 25ms pick sweep delay
    });
  }

  // =========================================================================
  // 3-Band Equalizer Controls
  // =========================================================================

  setEqLow(gainDb) {
    if (this.toneLow && this.ctx) {
      this.toneLow.gain.setTargetAtTime(gainDb, this.ctx.currentTime, 0.03);
    }
  }

  setEqMid(gainDb) {
    if (this.toneMid && this.ctx) {
      this.toneMid.gain.setTargetAtTime(gainDb, this.ctx.currentTime, 0.03);
    }
  }

  setEqHigh(gainDb) {
    if (this.toneHigh && this.ctx) {
      this.toneHigh.gain.setTargetAtTime(gainDb, this.ctx.currentTime, 0.03);
    }
  }

  setEqPreset(name) {
    const presets = {
      'flat': { low: 0, mid: 0, high: 0 },
      'rock-scoop': { low: 4.5, mid: -3.5, high: 3.5 },
      'warm-acoustic': { low: 2.0, mid: 1.0, high: -2.0 },
      'bright-lead': { low: -1.0, mid: 3.0, high: 5.0 },
      'heavy-punch': { low: 6.0, mid: 1.0, high: 2.0 }
    };
    const p = presets[name] || presets['flat'];
    this.setEqLow(p.low);
    this.setEqMid(p.mid);
    this.setEqHigh(p.high);
    return p;
  }

  // =========================================================================
  // Studio Lossless WAV Audio Recorder
  // =========================================================================

  setupRecorder() {
    if (!this.ctx) return;

    // Use ScriptProcessor / AudioNode tap for sample-accurate 16-bit WAV capture
    const bufferSize = 4096;
    if (this.ctx.createScriptProcessor) {
      this.recordNode = this.ctx.createScriptProcessor(bufferSize, 2, 2);
    } else {
      return;
    }

    this.recordNode.onaudioprocess = (e) => {
      if (!this.isRecording || this.recordingPaused) return;

      const left = e.inputBuffer.getChannelData(0);
      const right = e.inputBuffer.getChannelData(1);

      this.recordedLeftBuffers.push(new Float32Array(left));
      this.recordedRightBuffers.push(new Float32Array(right));
      this.recordingSampleCount += left.length;

      if (this.onRecordTimeUpdate) {
        const elapsedSec = this.recordingSampleCount / this.ctx.sampleRate;
        this.onRecordTimeUpdate(elapsedSec);
      }
    };

    // Tap master output into record node
    this.analyser.connect(this.recordNode);
    this.recordNode.connect(this.ctx.destination);
  }

  startRecording() {
    if (!this.isInitialized) this.init();
    this.resume();

    this.recordedLeftBuffers = [];
    this.recordedRightBuffers = [];
    this.recordingSampleCount = 0;
    this.isRecording = true;
    this.recordingPaused = false;
    this.recordingStartTime = performance.now();
    return true;
  }

  pauseRecording() {
    if (!this.isRecording) return false;
    this.recordingPaused = !this.recordingPaused;
    return this.recordingPaused;
  }

  stopRecording() {
    if (!this.isRecording) return null;
    this.isRecording = false;
    this.recordingPaused = false;

    return this.exportWavBlob();
  }

  exportWavBlob() {
    if (this.recordingSampleCount === 0) return null;

    const sampleRate = this.ctx.sampleRate;
    const numChannels = 2;
    const totalLength = this.recordingSampleCount;

    // Merge Float32 arrays
    const leftFlat = new Float32Array(totalLength);
    const rightFlat = new Float32Array(totalLength);
    let offset = 0;

    for (let i = 0; i < this.recordedLeftBuffers.length; i++) {
      leftFlat.set(this.recordedLeftBuffers[i], offset);
      rightFlat.set(this.recordedRightBuffers[i], offset);
      offset += this.recordedLeftBuffers[i].length;
    }

    // Interleave channels & encode 16-bit PCM WAV
    const wavBuffer = this.encodeWav([leftFlat, rightFlat], sampleRate);
    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);

    return {
      blob,
      url,
      duration: totalLength / sampleRate,
      sampleRate
    };
  }

  encodeWav(channelBuffers, sampleRate) {
    const numChannels = channelBuffers.length;
    const length = channelBuffers[0].length;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = length * blockAlign;
    const headerSize = 44;
    const totalSize = headerSize + dataSize;

    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);

    // RIFF chunk descriptor
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    this.writeString(view, 8, 'WAVE');

    // fmt sub-chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // data sub-chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Write PCM 16-bit samples
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        let sample = Math.max(-1, Math.min(1, channelBuffers[ch][i]));
        // Convert to 16-bit integer (-32768 to 32767)
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, sample, true);
        offset += 2;
      }
    }

    return buffer;
  }

  writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}

window.AirGuitarAudioEngine = AirGuitarAudioEngine;
