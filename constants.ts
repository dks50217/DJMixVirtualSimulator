export const COLORS = {
  deckA: '#06b6d4', // Cyan-500
  deckB: '#d946ef', // Fuchsia-500
  master: '#eab308', // Yellow-500
  bg: '#1e293b', // Slate-800
  knob: '#94a3b8', // Slate-400
  knobActive: '#f8fafc', // Slate-50
  signalOff: '#334155', // Slate-700 (dim wire)
};

export const DEFAULTS = {
  deckA: {
    isPlaying: false,
    volume: 0.8,
    eq: { high: 0.5, mid: 0.5, low: 0.5 }, // Set to 0.5 (flat) for better audio starting point
    speed: 1.0,
    rotation: 0,
    trackName: "No Track Loaded",
    isLoaded: false,
  },
  deckB: {
    isPlaying: false,
    volume: 0.0,
    eq: { high: 0.5, mid: 0.5, low: 0.5 },
    speed: 1.0,
    rotation: 0,
    trackName: "No Track Loaded",
    isLoaded: false,
  },
  mixer: {
    crossfader: -0.5,
    masterVolume: 0.8,
  },
};

// Positions for SVG elements
export const LAYOUT = {
  width: 1100, // Increased to fit Deck B (ends at 1050px) + margins
  height: 600,
  deckWidth: 300,
  mixerWidth: 300,
  padding: 20,
};