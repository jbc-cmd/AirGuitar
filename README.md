# 🎸 AirGuitar AI — Vision-Powered Gesture Virtual Instrument & Studio

An interactive, ultra-modern virtual air guitar and digital audio workstation powered by real-time computer vision AI (MediaPipe Hands) and Web Audio API physical string synthesis. Make hand gestures in the air to trigger and continuously loop studio-grade guitar riffs, solos, arpeggios, and grooves while modulating pitch and wah-wah filter in 3D/2D space, or interact directly via canvas strumming and studio keyboard hotkeys!

---

## 🌟 Key Features

- **Real-Time AI Hand Tracking:** 21-landmark 3D hand tracking powered by Google MediaPipe Hands with smooth exponential moving average (EMA) jitter filtering.
- **Continuous Gesture-to-Tune Engine:** Holding up specific hand gestures triggers and seamlessly loops authentic guitar riffs, fingerstyle ballads, flamenco runs, blues solos, and heavy metal chugs.
- **Studio Lossless WAV Audio Recorder:**
  - 1-Click live recording with pulsing LED indicator, live timecode duration, pause/resume, instant audio player preview, and uncompressed 16-bit PCM `.wav` download.
- **4 Luxury Visual Aesthetic Themes:**
  - ⚡ **Cyber Synthwave** (Electric Cyan, Neon Pink, Holographic purple grids)
  - 👑 **Obsidian Gold** (Deep Charcoal, Luxury Champagne Gold, Amber sparks)
  - 🧪 **Matrix Emerald** (Futuristic Terminal Green, Lime neon sparks)
  - 🌅 **Solar Sunset** (Sunburst Violet, Peach Coral, Retro gradient)
- **4 Switchable Visualizer FX Modes:**
  - **Laser Strings:** Dynamic laser strings with harmonic sine waves, fret indicators, and spark bursts.
  - **Cyber Orbit:** Radial circular audio spectrum rotating and pulsating around the hand target reticle.
  - **3D Grid:** Perspective holographic wireframe horizon reacting to guitar pitch.
  - **Nebula Particles:** Fluid cosmic particle ribbon trailing finger landmarks.
- **Direct Interactive String Plucking & Keyboard Studio Mode:**
  - Click or drag across canvas strings for direct plucking with physical transient synthesis.
  - Full keyboard shortcuts (`1-6` strings, `Q-W-E-R` chords, `A-K` gesture riffs, `Space` power chug).
- **Studio 3-Band Equalizer & FX Pedalboard:**
  - Low (250Hz), Mid (1.5kHz), High (4.5kHz) EQ sliders with presets (*Rock Scoop*, *Warm Acoustic*, *Bright Lead*, *Heavy Punch*, *Flat*).
  - Multi-guitar tones: *Rock Overdrive*, *Acoustic Steel*, *Heavy Distortion*, *Spanish Nylon*, *80s Neon Synth Guitar*, and *Clean Chorus*.
  - Full FX rack: Overdrive waveshaper, Convolver Reverb, Feedback Delay/Echo, and Analog Chorus.
- **Synthesized Backing Drum Machine & Tap Tempo:**
  - Built-in rhythm section (*Rock 4/4*, *Blues Shuffle*, *Metal 150*, *Acoustic Pop*, *Funk Beat*) with interactive **TAP Tempo** button and visual beat pulse beacon.
- **Instant Audition Riff Previews:** Click the play icon on any gesture row to audition tunes on demand.

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

## ⌨️ Studio Keyboard Shortcuts

| Key(s) | Action |
| :--- | :--- |
| `1` - `6` | Pluck individual strings (High E to Low E) |
| `Q`, `W`, `E`, `R` | Strum Chords (Em, G, C, D) |
| `A`, `S`, `D`, `F` | Trigger Rock Horns, Peace Sign, Open Palm, Blues Lick |
| `G`, `H`, `J`, `K` | Trigger Metal Chug, Funk Groove, Ambient Swell, Surf Tremolo |
| `Space` | Heavy Metal Power Chord Chug |
| `M` / `D` | Toggle Mute / Toggle Backing Drums |

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

**Using Node.js (npx serve):**
```bash
npx serve .
```

### 3. Open in Browser
Visit **[http://localhost:3000](http://localhost:3000)** in Chrome, Edge, Firefox, or Brave. Click **"Start Vision"** or **"Play with Keyboard / Mouse"** and start rocking!

---

## 🛠️ Technology Stack

- **Computer Vision / AI:** MediaPipe Hands (@mediapipe/camera_utils, @mediapipe/hands)
- **Audio Engine:** Web Audio API (Physical string synthesis, Convolver, BiquadFilters, WaveShaper, DynamicsCompressor, Lossless 16-bit PCM WAV encoder)
- **Visuals & Rendering:** HTML5 Canvas, Vanilla CSS Glassmorphism, Lucide Icons, Plus Jakarta Sans & JetBrains Mono typography

---

## 📄 License

MIT License — Feel free to use, modify, and build upon this project!
