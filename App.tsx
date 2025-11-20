import React, { useState, useEffect } from 'react';
import { DJController } from './components/DJController';
import { DEFAULTS } from './constants';
import { AppState } from './types';
import { explainMixState } from './services/geminiService';
import { audioEngine } from './services/audioEngine';
import { Music, Info, Cpu } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(DEFAULTS);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync React State to Audio Engine
  useEffect(() => {
    audioEngine.syncState(state);
  }, [state]);

  const handleExplain = async () => {
    setLoading(true);
    setExplanation(null);
    const text = await explainMixState(state);
    setExplanation(text);
    setLoading(false);
  };

  const handleLoadTrack = async (deck: 'deckA' | 'deckB', file: File) => {
    // Reset playing state if replacing a track while playing
    if (state[deck].isPlaying) {
      setState(prev => ({ ...prev, [deck]: { ...prev[deck], isPlaying: false } }));
    }

    try {
      await audioEngine.loadTrack(deck, file);
      setState(prev => ({
        ...prev,
        [deck]: {
          ...prev[deck],
          trackName: file.name,
          isLoaded: true
        }
      }));
    } catch (error) {
      console.error("Failed to load audio", error);
      alert("Could not load audio file. Please try a standard format (MP3, WAV).");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center p-4 md:p-8">
      {/* Header */}
      <header className="w-full max-w-5xl flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600 rounded-full shadow-lg shadow-indigo-500/20">
            <Music className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-fuchsia-500 bg-clip-text text-transparent">
              MixLogic Viz
            </h1>
            <p className="text-slate-400 text-sm">Interactive DJ Signal Flow Simulator</p>
          </div>
        </div>
        
        <button 
          onClick={handleExplain}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${loading ? 'bg-slate-700 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600'}`}
        >
          {loading ? (
            <span className="animate-spin">⏳</span>
          ) : (
            <Cpu className="w-4 h-4 text-emerald-400" />
          )}
          <span>{loading ? "Analyzing..." : "AI Explain Status"}</span>
        </button>
      </header>

      {/* Main Viz Area */}
      <main className="w-full max-w-5xl mb-8">
        <div className="relative w-full aspect-[5/3] shadow-2xl rounded-xl overflow-hidden border border-slate-800 bg-slate-900/50 backdrop-blur">
           {/* The Interactive SVG */}
           <DJController state={state} setState={setState} onLoadTrack={handleLoadTrack} />
           
           {/* Instructions Overlay (Absolute) */}
           <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm p-3 rounded-lg border border-white/10 text-xs text-slate-300 max-w-[200px]">
              <p className="flex items-center gap-1 mb-1 text-white font-semibold"><Info className="w-3 h-3"/> Controls</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Click <strong>LOAD TRACK</strong> to add MP3s.</li>
                <li>Drag <strong>Knobs</strong> up/down to EQ.</li>
                <li>Drag <strong>Faders</strong> to adjust volume.</li>
                <li>Slide <strong>Crossfader</strong> to mix.</li>
                <li>Adjust <strong>TEMPO</strong> to change pitch/speed.</li>
              </ul>
           </div>
        </div>
      </main>

      {/* AI Explanation Panel */}
      {explanation && (
        <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg animate-fade-in">
          <h3 className="text-emerald-400 font-bold mb-2 flex items-center gap-2">
            <Cpu className="w-5 h-5" />
            AI Instructor Analysis
          </h3>
          <p className="text-slate-300 leading-relaxed">{explanation}</p>
        </div>
      )}
      
      {/* Technical Info Footer */}
      <footer className="w-full max-w-5xl mt-8 border-t border-slate-800 pt-4 text-center text-slate-500 text-sm">
        <p>Built with React, Tailwind, Web Audio API & SVG • Powered by Gemini 2.5 Flash</p>
        <p className="mt-1 text-xs">Upload MP3/WAV files to mix real audio.</p>
      </footer>
    </div>
  );
};

export default App;