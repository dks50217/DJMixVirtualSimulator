export interface DeckState {
  isPlaying: boolean;
  volume: number; // 0 to 1 (Channel Fader)
  eq: {
    high: number; // 0 to 1
    mid: number; // 0 to 1
    low: number; // 0 to 1
  };
  speed: number; // 0.92 to 1.08 (+/- 8%)
  rotation: number; // For animation
  trackName: string; // Name of loaded file
  isLoaded: boolean; // If a file is ready to play
}

export interface MixerState {
  crossfader: number; // -1 (Left) to 1 (Right)
  masterVolume: number; // 0 to 1
}

export interface AppState {
  deckA: DeckState;
  deckB: DeckState;
  mixer: MixerState;
}