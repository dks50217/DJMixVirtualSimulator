import React, { useState, useEffect, useRef } from 'react';
import { AppState, DeckState, MixerState } from '../types';
import { COLORS, LAYOUT } from '../constants';
import { Knob, Fader, Crossfader } from './SVGControls';
import { Platter, Waveform } from './DJVisuals';
import { Wire } from './SignalPath';

interface Props {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  onLoadTrack: (deck: 'deckA' | 'deckB', file: File) => void;
}

export const DJController: React.FC<Props> = ({ state, setState, onLoadTrack }) => {
  const { deckA, deckB, mixer } = state;
  const [rotationA, setRotationA] = useState(0);
  const [rotationB, setRotationB] = useState(0);

  const inputRefA = useRef<HTMLInputElement>(null);
  const inputRefB = useRef<HTMLInputElement>(null);

  // Animation Loop for Platters
  useEffect(() => {
    let frameId: number;
    const animate = () => {
      if (deckA.isPlaying) {
        setRotationA(r => (r + 3 * deckA.speed) % 360);
      }
      if (deckB.isPlaying) {
        setRotationB(r => (r + 3 * deckB.speed) % 360);
      }
      frameId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frameId);
  }, [deckA.isPlaying, deckA.speed, deckB.isPlaying, deckB.speed]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, deck: 'deckA' | 'deckB') => {
    if (e.target.files && e.target.files[0]) {
      onLoadTrack(deck, e.target.files[0]);
      // Reset value so same file can be selected again if needed
      e.target.value = ''; 
    }
  };

  // --- Handlers ---
  const updateDeck = (deck: 'deckA' | 'deckB', field: keyof DeckState, value: any) => {
    setState(prev => ({
      ...prev,
      [deck]: { ...prev[deck], [field]: value }
    }));
  };

  const handleSync = (targetDeck: 'deckA' | 'deckB') => {
    const sourceDeck = targetDeck === 'deckA' ? 'deckB' : 'deckA';
    const targetSpeed = state[sourceDeck].speed;
    setState(prev => ({
      ...prev,
      [targetDeck]: { ...prev[targetDeck], speed: targetSpeed }
    }));
  };

  const updateEQ = (deck: 'deckA' | 'deckB', band: 'low' | 'mid' | 'high', value: number) => {
    setState(prev => ({
      ...prev,
      [deck]: { ...prev[deck], eq: { ...prev[deck].eq, [band]: value } }
    }));
  };

  const updateMixer = (field: keyof MixerState, value: number) => {
    setState(prev => ({
      ...prev,
      mixer: { ...prev.mixer, [field]: value }
    }));
  };

  // --- Signal Logic Calculations for Visualization ---
  const sigSourceA = deckA.isPlaying ? 1 : 0;
  const sigSourceB = deckB.isPlaying ? 1 : 0;

  const eqAvgA = (deckA.eq.low + deckA.eq.mid + deckA.eq.high) / 3;
  const eqAvgB = (deckB.eq.low + deckB.eq.mid + deckB.eq.high) / 3;
  // Remap EQ visual (0.5 is flat) to signal strength logic
  const normEQA = (eqAvgA * 0.8) + 0.2; 
  const normEQB = (eqAvgB * 0.8) + 0.2;

  const sigPostEQA = sigSourceA * normEQA;
  const sigPostEQB = sigSourceB * normEQB;

  const sigPostFaderA = sigPostEQA * deckA.volume;
  const sigPostFaderB = sigPostEQB * deckB.volume;

  const cfVal = mixer.crossfader; 
  const cfGainA = cfVal > 0 ? (1 - cfVal) : 1;
  const cfGainB = cfVal < 0 ? (1 + cfVal) : 1;
  
  const sigPostCF_A = sigPostFaderA * cfGainA;
  const sigPostCF_B = sigPostFaderB * cfGainB;

  const sigMaster = Math.min(1, (sigPostCF_A + sigPostCF_B) * mixer.masterVolume);


  // --- SVG Layout Coordinates ---
  const deckAY = 150;
  const deckBY = 150;
  const mixerY = 150;
  const deckAX = 50;
  const mixerX = 400;
  const deckBX = 750;

  // Wire Points
  const wireOutA_to_EQ = `M ${deckAX + 280} ${deckAY + 100} C ${deckAX + 320} ${deckAY + 100}, ${mixerX} ${mixerY + 40}, ${mixerX + 40} ${mixerY + 40}`;
  const wireOutB_to_EQ = `M ${deckBX + 20} ${deckBY + 100} C ${deckBX - 20} ${deckBY + 100}, ${mixerX + 260} ${mixerY + 40}, ${mixerX + 260} ${mixerY + 40}`;
  const wireEQA_to_Fader = `M ${mixerX + 40} ${mixerY + 180} L ${mixerX + 40} ${mixerY + 220}`;
  const wireEQB_to_Fader = `M ${mixerX + 260} ${mixerY + 180} L ${mixerX + 260} ${mixerY + 220}`;
  const wireFaderA_to_CF = `M ${mixerX + 40} ${mixerY + 350} L ${mixerX + 40} ${mixerY + 380} L ${mixerX + 100} ${mixerY + 400}`;
  const wireFaderB_to_CF = `M ${mixerX + 260} ${mixerY + 350} L ${mixerX + 260} ${mixerY + 380} L ${mixerX + 200} ${mixerY + 400}`;
  const wireCF_to_Master = `M ${mixerX + 150} ${mixerY + 450} L ${mixerX + 150} ${mixerY + 480}`;

  // Helper for Sync Button Style
  const isSynced = Math.abs(deckA.speed - deckB.speed) < 0.001;

  return (
    <>
      {/* Hidden Inputs */}
      <input type="file" accept="audio/*" ref={inputRefA} className="hidden" onChange={(e) => handleFileChange(e, 'deckA')} />
      <input type="file" accept="audio/*" ref={inputRefB} className="hidden" onChange={(e) => handleFileChange(e, 'deckB')} />

      <svg viewBox={`0 0 ${LAYOUT.width} ${LAYOUT.height}`} className="w-full h-auto select-none bg-slate-900 rounded-xl shadow-2xl border border-slate-800">
        <defs>
          <filter id="glowA">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* --- WIRES (Background Layer) --- */}
        <Wire d={wireOutA_to_EQ} signalStrength={sigSourceA} color={COLORS.deckA} isFlowing={deckA.isPlaying} />
        <Wire d={wireEQA_to_Fader} signalStrength={sigPostEQA} color={COLORS.deckA} isFlowing={deckA.isPlaying} />
        <Wire d={wireFaderA_to_CF} signalStrength={sigPostFaderA} color={COLORS.deckA} isFlowing={deckA.isPlaying} />
        
        <Wire d={wireOutB_to_EQ} signalStrength={sigSourceB} color={COLORS.deckB} isFlowing={deckB.isPlaying} />
        <Wire d={wireEQB_to_Fader} signalStrength={sigPostEQB} color={COLORS.deckB} isFlowing={deckB.isPlaying} />
        <Wire d={wireFaderB_to_CF} signalStrength={sigPostFaderB} color={COLORS.deckB} isFlowing={deckB.isPlaying} />

        <Wire d={wireCF_to_Master} signalStrength={sigMaster} color={COLORS.master} isFlowing={sigMaster > 0} />


        {/* --- DECK A --- */}
        <g transform={`translate(${deckAX}, ${deckAY})`}>
          <rect width="300" height="300" rx="10" fill="#1e293b" stroke="#334155" />
          <g onClick={() => inputRefA.current?.click()} className="cursor-pointer hover:opacity-80">
             <rect x="15" y="10" width="80" height="24" rx="4" fill="#334155" />
             <text x="55" y="26" textAnchor="middle" fill={COLORS.deckA} fontWeight="bold" fontSize="10">LOAD TRACK A</text>
          </g>
          
          <text x="150" y="25" textAnchor="middle" fill="white" fontSize="12" fontWeight="600" opacity="0.7">
            {deckA.trackName.length > 25 ? deckA.trackName.substring(0, 24) + '...' : deckA.trackName}
          </text>
          
          {/* Waveform */}
          <Waveform x={20} y={50} width={260} height={60} color={COLORS.deckA} isPlaying={deckA.isPlaying} speed={deckA.speed} />
          
          {/* Platter */}
          <Platter cx={150} cy={200} r={80} rotation={rotationA} color={COLORS.deckA} isPlaying={deckA.isPlaying} />
          
          {/* Play/Pause Button */}
          <g transform="translate(20, 250)" className={deckA.isLoaded ? "cursor-pointer" : "opacity-50 cursor-not-allowed"} 
             onClick={() => deckA.isLoaded && updateDeck('deckA', 'isPlaying', !deckA.isPlaying)}>
            <rect width="50" height="30" rx="4" fill={deckA.isPlaying ? COLORS.deckA : '#334155'} />
            <text x="25" y="20" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">{deckA.isPlaying ? "STOP" : "PLAY"}</text>
          </g>

          {/* Tempo Controls */}
           <text x="270" y="240" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="600">TEMPO</text>
           
           {/* Sync Button Deck A */}
           <g onClick={() => handleSync('deckA')} className="cursor-pointer hover:opacity-80">
              <rect x="255" y="125" width="30" height="16" rx="2" 
                    fill={isSynced ? COLORS.deckA : '#334155'} 
                    stroke={isSynced ? '#fff' : 'none'}
                    strokeWidth="1"
                    className="transition-colors"
              />
              <text x="270" y="137" textAnchor="middle" fill={isSynced ? '#000' : '#94a3b8'} fontSize="9" fontWeight="bold">SYNC</text>
           </g>

           <Fader x={255} y={150} width={30} height={100} value={(deckA.speed - 0.92) / 0.16} onChange={(v) => updateDeck('deckA', 'speed', 0.92 + (v * 0.16))} label="" color={COLORS.deckA} />
        </g>

        {/* --- DECK B --- */}
        <g transform={`translate(${deckBX}, ${deckBY})`}>
          <rect width="300" height="300" rx="10" fill="#1e293b" stroke="#334155" />
          
           <g onClick={() => inputRefB.current?.click()} className="cursor-pointer hover:opacity-80">
             <rect x="15" y="10" width="80" height="24" rx="4" fill="#334155" />
             <text x="55" y="26" textAnchor="middle" fill={COLORS.deckB} fontWeight="bold" fontSize="10">LOAD TRACK B</text>
          </g>
          
          <text x="150" y="25" textAnchor="middle" fill="white" fontSize="12" fontWeight="600" opacity="0.7">
            {deckB.trackName.length > 25 ? deckB.trackName.substring(0, 24) + '...' : deckB.trackName}
          </text>
          
          {/* Waveform */}
          <Waveform x={20} y={50} width={260} height={60} color={COLORS.deckB} isPlaying={deckB.isPlaying} speed={deckB.speed} />

          {/* Platter */}
          <Platter cx={150} cy={200} r={80} rotation={rotationB} color={COLORS.deckB} isPlaying={deckB.isPlaying} />

          {/* Play/Pause Button */}
          <g transform="translate(20, 250)" className={deckB.isLoaded ? "cursor-pointer" : "opacity-50 cursor-not-allowed"}
             onClick={() => deckB.isLoaded && updateDeck('deckB', 'isPlaying', !deckB.isPlaying)}>
            <rect width="50" height="30" rx="4" fill={deckB.isPlaying ? COLORS.deckB : '#334155'} />
            <text x="25" y="20" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">{deckB.isPlaying ? "STOP" : "PLAY"}</text>
          </g>

           {/* Tempo Controls */}
           <text x="270" y="240" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="600">TEMPO</text>
           
           {/* Sync Button Deck B */}
           <g onClick={() => handleSync('deckB')} className="cursor-pointer hover:opacity-80">
              <rect x="255" y="125" width="30" height="16" rx="2" 
                    fill={isSynced ? COLORS.deckB : '#334155'} 
                    stroke={isSynced ? '#fff' : 'none'}
                    strokeWidth="1"
                    className="transition-colors"
              />
              <text x="270" y="137" textAnchor="middle" fill={isSynced ? '#000' : '#94a3b8'} fontSize="9" fontWeight="bold">SYNC</text>
           </g>

           <Fader x={255} y={150} width={30} height={100} value={(deckB.speed - 0.92) / 0.16} onChange={(v) => updateDeck('deckB', 'speed', 0.92 + (v * 0.16))} label="" color={COLORS.deckB} />
        </g>

        {/* --- MIXER --- */}
        <g transform={`translate(${mixerX}, ${mixerY})`}>
          <rect width="300" height="500" rx="5" fill="#0f172a" stroke="#475569" strokeWidth="2" />
          
          {/* CHANNEL A STRIP */}
          <g transform="translate(20, 20)">
            <text x="30" y="0" textAnchor="middle" fill={COLORS.deckA} fontSize="12" fontWeight="bold">CH 1</text>
            <Knob x={30} y={40} r={18} value={deckA.eq.high} onChange={(v) => updateEQ('deckA', 'high', v)} label="HI" color={COLORS.deckA} />
            <Knob x={30} y={90} r={18} value={deckA.eq.mid} onChange={(v) => updateEQ('deckA', 'mid', v)} label="MID" color={COLORS.deckA} />
            <Knob x={30} y={140} r={18} value={deckA.eq.low} onChange={(v) => updateEQ('deckA', 'low', v)} label="LOW" color={COLORS.deckA} />
            <Fader x={15} y={180} width={30} height={130} value={deckA.volume} onChange={(v) => updateDeck('deckA', 'volume', v)} label="VOL" color={COLORS.deckA} />
          </g>

          {/* CHANNEL B STRIP */}
          <g transform="translate(220, 20)">
             <text x="30" y="0" textAnchor="middle" fill={COLORS.deckB} fontSize="12" fontWeight="bold">CH 2</text>
            <Knob x={30} y={40} r={18} value={deckB.eq.high} onChange={(v) => updateEQ('deckB', 'high', v)} label="HI" color={COLORS.deckB} />
            <Knob x={30} y={90} r={18} value={deckB.eq.mid} onChange={(v) => updateEQ('deckB', 'mid', v)} label="MID" color={COLORS.deckB} />
            <Knob x={30} y={140} r={18} value={deckB.eq.low} onChange={(v) => updateEQ('deckB', 'low', v)} label="LOW" color={COLORS.deckB} />
            <Fader x={15} y={180} width={30} height={130} value={deckB.volume} onChange={(v) => updateDeck('deckB', 'volume', v)} label="VOL" color={COLORS.deckB} />
          </g>

          {/* MASTER SECTION */}
          <g transform="translate(120, 20)">
            <text x="30" y="0" textAnchor="middle" fill={COLORS.master} fontSize="12" fontWeight="bold">MASTER</text>
            <Knob x={30} y={40} r={20} value={mixer.masterVolume} onChange={(v) => updateMixer('masterVolume', v)} label="MAIN" color={COLORS.master} />
            
            <g transform="translate(20, 80)">
               <rect x="0" y="0" width="10" height="100" fill="#1e293b" />
               <rect x="12" y="0" width="10" height="100" fill="#1e293b" />
               <rect x="0" y={100 - (sigMaster * 100)} width="10" height={sigMaster * 100} fill={COLORS.master} opacity="0.8" />
               <rect x="12" y={100 - (sigMaster * 100)} width="10" height={sigMaster * 100} fill={COLORS.master} opacity="0.8" />
            </g>
          </g>

          {/* CROSSFADER */}
          <g transform="translate(50, 400)">
            <Crossfader x={0} y={0} width={200} height={40} value={mixer.crossfader} onChange={(v) => updateMixer('crossfader', v)} />
          </g>

           <text x="150" y="490" textAnchor="middle" fill="#94a3b8" fontSize="10">MASTER OUTPUT</text>
        </g>
      </svg>
    </>
  );
};