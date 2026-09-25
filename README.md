# 🎸 AirGuitar AI — Vision-Powered Gesture Virtual Instrument

An interactive, browser-based virtual air guitar powered by real-time computer vision AI (MediaPipe Hands) and Web Audio API physical string synthesis. Make hand gestures in the air to trigger and continuously loop studio-grade guitar riffs, solos, arpeggios, and grooves while modulating pitch and wah-wah filter in 3D/2D space!

---

## 🌟 Key Features

- **Real-Time AI Hand Tracking:** 21-landmark 3D hand tracking powered by Google MediaPipe Hands with smooth exponential moving average (EMA) jitter filtering.
- **Continuous Gesture-to-Tune Engine:** Holding up specific hand gestures triggers and seamlessly loops authentic guitar riffs, fingerstyle ballads, flamenco runs, blues solos, and heavy metal chugs.
- **Spatial Point Modulation:**
  - **Hand X-Axis (Left ↔ Right):** Transposes pitch across the virtual neck (-6 to +7 semitones).
  - **Hand Y-Axis (Up ↕ Down):** Sweeps the resonant Wah-Wah / Brightness filter (350 Hz to 7.5 kHz).
- **Physical String Synthesis & FX Pedalboard:**
  - Pluck transient generator with multiple oscillator waveforms.
  - Multi-guitar tones: *Rock Overdrive*, *Acoustic Steel*, *Heavy Distortion*, *Spanish Nylon*, *80s Neon Synth Guitar*, and *Clean Chorus*.
  - Full FX rack: Overdrive/Distortion waveshaper, 3-Band Tone EQ, Stereo Convolver Reverb, Feedback Delay/Echo, and Analog Chorus.
- **Synthesized Backing Drum Machine:** Built-in rhythm section supporting *Rock 4/4*, *Blues Shuffle*, *Metal 150*, *Acoustic Pop*, and *Funk Beat* with adjustable BPM.
- **High-Definition Visualizer:** Real-time mirrored camera stage, glowing hand skeleton & target reticle, vibrating holographic strings, particle spark explosions, interactive fret markers, and 24-bit oscilloscope.

---

## 🖐️ Gesture-to-Tune Mapping Guide

| Gesture | Mapped Tune | Style / Tone | Description |
| :--- | :--- | :--- | :--- |
| 🤘 **Rock Horns** | **Heavy Rock Solo Riff** | Electric Overdrive | Punchy lead solo with bends and high-voltage power notes |
| ✌️ **Peace (2 Fingers)** | **Acoustic Fingerstyle Ballad** | Acoustic Steel String | Intricate 16th-note arpeggio chord progression (Em - G - C - D) |
| 🖐️ **Open Palm** | **Spanish Flamenco Run** | Spanish Classical Nylon | Passionate Phrygian flourishes with rapid Andalusian runs |
| ☝️ **Pointing (1 Finger)** | **Soulful Blues Lead Lick** | Bending Blues Solo | Expressive pentatonic lead licks with soulful vibrato |
| ✊ **Fist** | **Metal Power Chug** | Crushing Heavy Distortion | Tight palm-muted galloping rhythm with crushing power chords |
| 👍 **Thumbs Up** | **Funky Clean Groove** | Snappy Clean Chorus | Chic-style syncopated 16th-note clean chord stabs |
| 👌 **Pinch (OK Sign)** | **Ambient Dream Swell** | Reverb-Drenched Synth Guitar | Shimmering modal chords with ethereal space echoes |
| 🤙 **Shaka** | **Surf Rock Tremolo** | Wet Spring Reverb Surf Guitar | Rapid tremolo-picked double-stop melody |

*Note: All gesture mappings are fully customizable in the left Gesture Deck via dropdown selectors.*

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/jbc-cmd/AirGuitar.git
cd AirGuitar
```

### 2. Run Locally
You can serve the static files with any local HTTP server:

**Using Python:**
```bash
python -m http.server 3000
```

**Using Node.js (npx serve / live-server):**
```bash
npx serve .
```

### 3. Open in Browser
Visit **[http://localhost:3000](http://localhost:3000)** in Chrome, Edge, Firefox, or Brave. Click **"Start Camera"**, allow webcam permissions, and start rocking!

---

## 🛠️ Technology Stack

- **Computer Vision / AI:** MediaPipe Hands (@mediapipe/camera_utils, @mediapipe/hands)
- **Audio Engine:** Web Audio API (Physical string synthesis, Convolver, BiquadFilters, WaveShaper, DynamicsCompressor)
- **Visuals & Rendering:** HTML5 Canvas, Vanilla CSS Glassmorphism, Lucide Icons, Plus Jakarta Sans & JetBrains Mono typography

---

## 📄 License

MIT License — Feel free to use, modify, and build upon this project!
