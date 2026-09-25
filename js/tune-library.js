/**
 * AirGuitar AI — Tune Library
 * Contains rhythmic guitar riffs, solos, arpeggios, and grooves mapped to hand gestures.
 */

// Note to Frequency Helper
const NOTE_FREQS = {
  'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
  'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'G5': 783.99, 'A5': 880.00
};

const GUITAR_TUNES = {
  // 1. Rock Horns -> Heavy Rock Solo Riff
  'rock_solo': {
    id: 'rock_solo',
    title: 'Heavy Rock Solo Riff',
    emoji: '🤘',
    genre: 'Rock / Metal',
    bpm: 120,
    preferredTone: 'rock-overdrive',
    description: 'High-voltage electric guitar riff with punchy power notes & bending lead runs.',
    // 16-step or 32-step rhythmic loop
    pattern: [
      { step: 0, note: 'E3', dur: 2, vel: 0.9, fret: 0, string: 5 },
      { step: 2, note: 'E3', dur: 2, vel: 0.85, fret: 0, string: 5 },
      { step: 4, note: 'G3', dur: 2, vel: 0.95, fret: 3, string: 5 },
      { step: 6, note: 'A3', dur: 2, vel: 0.9, fret: 5, string: 5 },
      { step: 8, note: 'A#3', dur: 1, vel: 0.85, fret: 6, string: 5 },
      { step: 9, note: 'B3', dur: 3, vel: 1.0, fret: 7, string: 5, bend: true },
      { step: 12, note: 'D4', dur: 2, vel: 0.9, fret: 5, string: 4 },
      { step: 14, note: 'E4', dur: 2, vel: 1.0, fret: 7, string: 4, vibrato: true },
      { step: 16, note: 'E3', dur: 2, vel: 0.9, fret: 0, string: 5 },
      { step: 18, note: 'D4', dur: 2, vel: 0.85, fret: 5, string: 4 },
      { step: 20, note: 'B3', dur: 2, vel: 0.85, fret: 7, string: 5 },
      { step: 22, note: 'A3', dur: 2, vel: 0.9, fret: 5, string: 5 },
      { step: 24, note: 'G3', dur: 4, vel: 0.95, fret: 3, string: 5, vibrato: true },
      { step: 28, note: 'E2', dur: 4, vel: 1.0, fret: 0, string: 6 }
    ],
    totalSteps: 32
  },

  // 2. Peace Sign -> Acoustic Fingerpicking Ballad
  'acoustic_ballad': {
    id: 'acoustic_ballad',
    title: 'Acoustic Fingerstyle Ballad',
    emoji: '✌️',
    genre: 'Acoustic / Folk',
    bpm: 104,
    preferredTone: 'acoustic-steel',
    description: 'Smooth, intricate acoustic fingerpicking arpeggios flowing through Em - G - C - D.',
    pattern: [
      // Bar 1: Em
      { step: 0, note: 'E2', dur: 4, vel: 0.9, fret: 0, string: 6 },
      { step: 2, note: 'B3', dur: 2, vel: 0.7, fret: 0, string: 2 },
      { step: 4, note: 'G3', dur: 2, vel: 0.75, fret: 0, string: 3 },
      { step: 6, note: 'E4', dur: 2, vel: 0.85, fret: 0, string: 1 },
      { step: 8, note: 'B3', dur: 2, vel: 0.7, fret: 0, string: 2 },
      { step: 10, note: 'G3', dur: 2, vel: 0.7, fret: 0, string: 3 },
      { step: 12, note: 'E3', dur: 2, vel: 0.8, fret: 2, string: 4 },
      { step: 14, note: 'B3', dur: 2, vel: 0.7, fret: 0, string: 2 },
      // Bar 2: G
      { step: 16, note: 'G2', dur: 4, vel: 0.9, fret: 3, string: 6 },
      { step: 18, note: 'B3', dur: 2, vel: 0.7, fret: 0, string: 2 },
      { step: 20, note: 'D4', dur: 2, vel: 0.75, fret: 0, string: 4 },
      { step: 22, note: 'G4', dur: 2, vel: 0.85, fret: 3, string: 1 },
      { step: 24, note: 'D4', dur: 2, vel: 0.7, fret: 0, string: 4 },
      { step: 26, note: 'B3', dur: 2, vel: 0.7, fret: 0, string: 2 },
      { step: 28, note: 'G3', dur: 2, vel: 0.8, fret: 0, string: 3 },
      { step: 30, note: 'D4', dur: 2, vel: 0.7, fret: 0, string: 4 }
    ],
    totalSteps: 32
  },

  // 3. Open Palm -> Spanish Classical Flamenco
  'spanish_flamenco': {
    id: 'spanish_flamenco',
    title: 'Spanish Flamenco Run',
    emoji: '🖐️',
    genre: 'Flamenco / Classical',
    bpm: 128,
    preferredTone: 'nylon-classical',
    description: 'Passionate Andalusian Phrygian flourishes with rapid rasgueado chords.',
    pattern: [
      { step: 0, note: 'E3', dur: 2, vel: 0.95, fret: 0, string: 4 },
      { step: 2, note: 'G#3', dur: 2, vel: 0.85, fret: 1, string: 3 },
      { step: 4, note: 'B3', dur: 2, vel: 0.9, fret: 0, string: 2 },
      { step: 6, note: 'E4', dur: 2, vel: 1.0, fret: 0, string: 1 },
      { step: 8, note: 'F4', dur: 2, vel: 0.95, fret: 1, string: 1 },
      { step: 10, note: 'E4', dur: 2, vel: 0.85, fret: 0, string: 1 },
      { step: 12, note: 'D4', dur: 2, vel: 0.85, fret: 3, string: 2 },
      { step: 14, note: 'C4', dur: 2, vel: 0.9, fret: 1, string: 2 },
      { step: 16, note: 'B3', dur: 4, vel: 0.95, fret: 0, string: 2 },
      { step: 20, note: 'A3', dur: 2, vel: 0.85, fret: 2, string: 3 },
      { step: 22, note: 'G3', dur: 2, vel: 0.85, fret: 0, string: 3 },
      { step: 24, note: 'F3', dur: 2, vel: 0.9, fret: 3, string: 4 },
      { step: 26, note: 'E3', dur: 6, vel: 1.0, fret: 2, string: 4, vibrato: true }
    ],
    totalSteps: 32
  },

  // 4. Pointing Finger -> Blues Lead Solo Lick
  'blues_solo': {
    id: 'blues_solo',
    title: 'Soulful Blues Lead Lick',
    emoji: '☝️',
    genre: 'Blues',
    bpm: 96,
    preferredTone: 'rock-overdrive',
    description: 'Bending electric blues licks in A Minor Pentatonic with expressive vibrato.',
    pattern: [
      { step: 0, note: 'A3', dur: 3, vel: 0.9, fret: 2, string: 3 },
      { step: 3, note: 'C4', dur: 3, vel: 0.85, fret: 1, string: 2 },
      { step: 6, note: 'D4', dur: 4, vel: 1.0, fret: 3, string: 2, bend: true },
      { step: 10, note: 'E4', dur: 2, vel: 0.9, fret: 0, string: 1 },
      { step: 12, note: 'G4', dur: 4, vel: 1.0, fret: 3, string: 1, vibrato: true },
      { step: 16, note: 'E4', dur: 2, vel: 0.8, fret: 0, string: 1 },
      { step: 18, note: 'D4', dur: 2, vel: 0.85, fret: 3, string: 2 },
      { step: 20, note: 'C4', dur: 2, vel: 0.9, fret: 1, string: 2 },
      { step: 22, note: 'A3', dur: 6, vel: 1.0, fret: 2, string: 3, vibrato: true },
      { step: 28, note: 'G3', dur: 2, vel: 0.7, fret: 0, string: 3 },
      { step: 30, note: 'A3', dur: 2, vel: 0.9, fret: 2, string: 3 }
    ],
    totalSteps: 32
  },

  // 5. Fist -> Metal Power Chug
  'metal_chug': {
    id: 'metal_chug',
    title: 'Metal Power Chug',
    emoji: '✊',
    genre: 'Heavy Metal',
    bpm: 140,
    preferredTone: 'heavy-distortion',
    description: 'Chunky palm-muted galloping rhythm with crushing power chords.',
    pattern: [
      { step: 0, note: 'E2', dur: 1, vel: 1.0, fret: 0, string: 6 },
      { step: 1, note: 'E2', dur: 1, vel: 0.8, fret: 0, string: 6 },
      { step: 2, note: 'E2', dur: 1, vel: 0.8, fret: 0, string: 6 },
      { step: 3, note: 'E2', dur: 1, vel: 1.0, fret: 0, string: 6 },
      { step: 4, note: 'G2', dur: 2, vel: 0.95, fret: 3, string: 6 },
      { step: 6, note: 'E2', dur: 1, vel: 0.8, fret: 0, string: 6 },
      { step: 7, note: 'E2', dur: 1, vel: 0.8, fret: 0, string: 6 },
      { step: 8, note: 'A#2', dur: 2, vel: 1.0, fret: 6, string: 6 },
      { step: 10, note: 'A2', dur: 2, vel: 0.95, fret: 5, string: 6 },
      { step: 12, note: 'G2', dur: 2, vel: 0.9, fret: 3, string: 6 },
      { step: 14, note: 'E2', dur: 2, vel: 1.0, fret: 0, string: 6 },
      { step: 16, note: 'E2', dur: 1, vel: 0.8, fret: 0, string: 6 },
      { step: 17, note: 'E2', dur: 1, vel: 0.8, fret: 0, string: 6 },
      { step: 18, note: 'F2', dur: 2, vel: 0.9, fret: 1, string: 6 },
      { step: 20, note: 'E2', dur: 4, vel: 1.0, fret: 0, string: 6 }
    ],
    totalSteps: 24
  },

  // 6. Thumbs Up -> Funky Clean 16ths
  'funk_groove': {
    id: 'funk_groove',
    title: 'Funky Clean Groove',
    emoji: '👍',
    genre: 'Funk / R&B',
    bpm: 112,
    preferredTone: 'clean-chorus',
    description: 'Chic-style clean 16th-note syncopated guitar groove with snappy chord stabs.',
    pattern: [
      { step: 0, note: 'E4', dur: 1, vel: 0.9, fret: 7, string: 5 },
      { step: 2, note: 'G4', dur: 1, vel: 0.85, fret: 8, string: 2 },
      { step: 3, note: 'B4', dur: 1, vel: 0.9, fret: 7, string: 1 },
      { step: 4, note: 'D4', dur: 2, vel: 0.95, fret: 7, string: 3 },
      { step: 7, note: 'E4', dur: 1, vel: 0.8, fret: 7, string: 5 },
      { step: 8, note: 'G4', dur: 2, vel: 0.95, fret: 8, string: 2 },
      { step: 11, note: 'A4', dur: 1, vel: 0.85, fret: 5, string: 1 },
      { step: 12, note: 'G4', dur: 2, vel: 0.9, fret: 8, string: 2 },
      { step: 14, note: 'E4', dur: 2, vel: 0.9, fret: 7, string: 5 }
    ],
    totalSteps: 16
  },

  // 7. Pinch -> Ambient Chillwave Swell
  'ambient_swell': {
    id: 'ambient_swell',
    title: 'Ambient Dream Swell',
    emoji: '👌',
    genre: 'Ambient / Lo-Fi',
    bpm: 80,
    preferredTone: 'synth-guitar',
    description: 'Lush shimmering chords with ethereal delays and dreamy modulations.',
    pattern: [
      { step: 0, note: 'C3', dur: 8, vel: 0.85, fret: 3, string: 5 },
      { step: 2, note: 'G3', dur: 8, vel: 0.8, fret: 0, string: 3 },
      { step: 4, note: 'B3', dur: 8, vel: 0.85, fret: 0, string: 2 },
      { step: 6, note: 'E4', dur: 8, vel: 0.9, fret: 0, string: 1 },
      { step: 12, note: 'D4', dur: 8, vel: 0.85, fret: 3, string: 2 },
      { step: 16, note: 'A2', dur: 8, vel: 0.85, fret: 0, string: 5 },
      { step: 18, note: 'E3', dur: 8, vel: 0.8, fret: 2, string: 4 },
      { step: 20, note: 'A3', dur: 8, vel: 0.85, fret: 2, string: 3 },
      { step: 22, note: 'C4', dur: 8, vel: 0.9, fret: 1, string: 2 },
      { step: 28, note: 'B3', dur: 6, vel: 0.8, fret: 0, string: 2 }
    ],
    totalSteps: 32
  },

  // 8. Shaka -> Surf Rock Tremolo
  'surf_tremolo': {
    id: 'surf_tremolo',
    title: 'Surf Rock Tremolo',
    emoji: '🤙',
    genre: 'Surf Rock',
    bpm: 135,
    preferredTone: 'rock-overdrive',
    description: 'Dripping spring reverb tremolo-picked Dick Dale style California surf guitar.',
    pattern: [
      { step: 0, note: 'E3', dur: 1, vel: 0.95, fret: 2, string: 4 },
      { step: 1, note: 'E3', dur: 1, vel: 0.85, fret: 2, string: 4 },
      { step: 2, note: 'F3', dur: 1, vel: 0.9, fret: 3, string: 4 },
      { step: 3, note: 'F3', dur: 1, vel: 0.85, fret: 3, string: 4 },
      { step: 4, note: 'G#3', dur: 1, vel: 0.95, fret: 1, string: 3 },
      { step: 5, note: 'G#3', dur: 1, vel: 0.85, fret: 1, string: 3 },
      { step: 6, note: 'A3', dur: 1, vel: 0.9, fret: 2, string: 3 },
      { step: 7, note: 'A3', dur: 1, vel: 0.85, fret: 2, string: 3 },
      { step: 8, note: 'B3', dur: 2, vel: 1.0, fret: 0, string: 2 },
      { step: 10, note: 'C4', dur: 2, vel: 0.95, fret: 1, string: 2 },
      { step: 12, note: 'B3', dur: 2, vel: 0.9, fret: 0, string: 2 },
      { step: 14, note: 'A3', dur: 2, vel: 0.9, fret: 2, string: 3 }
    ],
    totalSteps: 16
  }
};

// Default Gesture-to-Tune Mapping
const DEFAULT_GESTURE_MAPPING = {
  'rock': 'rock_solo',
  'peace': 'acoustic_ballad',
  'palm': 'spanish_flamenco',
  'point': 'blues_solo',
  'fist': 'metal_chug',
  'thumbs_up': 'funk_groove',
  'pinch': 'ambient_swell',
  'shaka': 'surf_tremolo'
};

const GESTURE_METADATA = [
  { id: 'rock', name: 'Rock Horns', emoji: '🤘', defaultTune: 'rock_solo' },
  { id: 'peace', name: 'Peace Sign (2 Fingers)', emoji: '✌️', defaultTune: 'acoustic_ballad' },
  { id: 'palm', name: 'Open Palm', emoji: '🖐️', defaultTune: 'spanish_flamenco' },
  { id: 'point', name: 'Pointing (1 Finger)', emoji: '☝️', defaultTune: 'blues_solo' },
  { id: 'fist', name: 'Fist', emoji: '✊', defaultTune: 'metal_chug' },
  { id: 'thumbs_up', name: 'Thumbs Up', emoji: '👍', defaultTune: 'funk_groove' },
  { id: 'pinch', name: 'Pinch (OK Sign)', emoji: '👌', defaultTune: 'ambient_swell' },
  { id: 'shaka', name: 'Shaka Sign', emoji: '🤙', defaultTune: 'surf_tremolo' }
];

window.AirGuitarTunes = {
  NOTE_FREQS,
  GUITAR_TUNES,
  DEFAULT_GESTURE_MAPPING,
  GESTURE_METADATA
};
