"use client";

import { useState, useEffect, useRef } from "react";
import { Play, RotateCcw, Mic, Send, Settings, MessageCircle, Terminal, Bug, Code, Trash2, ChevronLeft, HelpCircle, Heart } from "lucide-react";
import { useAudioRecorder } from "./hooks/useAudioRecorder";

// --- Types ---
type Personality = "angry" | "happy" | "sad" | "smart" | "silly";
type AppMode = "landing" | "chat" | "debug";

interface Duck {
  id: number;
  name: string;
  personality: Personality;
  color: string;
  secondaryColor: string;
  icon: string;
}

interface Speech {
  duckId: number;
  text: string;
  duration: number;
  audioUrl: string;
  mood?: string; // Dynamic emoji mood
}

interface Vitals {
  timestamp_s: number;
  breathing_rate_rpm: number;
  heart_rate_bpm: number;
}

// --- Data ---
const DUCKS: Duck[] = [
  { id: 1, name: "Gordon", personality: "angry", color: "bg-red-400", secondaryColor: "border-red-600", icon: "🤬" },
  { id: 2, name: "Joy", personality: "happy", color: "bg-yellow-300", secondaryColor: "border-yellow-500", icon: "✨" },
  { id: 3, name: "Blues", personality: "sad", color: "bg-blue-400", secondaryColor: "border-blue-600", icon: "🌧️" },
  { id: 4, name: "Dexter", personality: "smart", color: "bg-green-400", secondaryColor: "border-green-600", icon: "🤓" },
  { id: 5, name: "Goose", personality: "silly", color: "bg-orange-400", secondaryColor: "border-orange-600", icon: "🤪" },
];

const BACKEND_URL = "http://localhost:8000";

export default function Home() {
  const [mode, setMode] = useState<AppMode>("landing");
  const [conversation, setConversation] = useState<Speech[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [displayedText, setDisplayedText] = useState("");
  const [message, setMessage] = useState("");
  const [userName, setUserName] = useState("");
  const [turnCount, setTurnCount] = useState(4); 
  const [healthMode, setHealthMode] = useState(false);
  const [vitals, setVitals] = useState<Vitals | null>(null);
  
  const { isRecording, startRecording, stopRecording } = useAudioRecorder({
    onAudioRecorded: (audioBlob: Blob) => {
      startAudioConversation(audioBlob);
    },
  });
  
  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const vitalsTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Polling for vitals
  useEffect(() => {
    if (healthMode) {
      const fetchVitals = async () => {
        try {
          const res = await fetch(`${BACKEND_URL}/vitals`);
          if (res.ok) {
            const data = await res.json();
            setVitals(data);
          }
        } catch (e) {
          console.error("Failed to fetch vitals", e);
        }
      };
      
      fetchVitals(); // Initial call
      vitalsTimerRef.current = setInterval(fetchVitals, 2000); // Poll every 2s
    } else {
      if (vitalsTimerRef.current) clearInterval(vitalsTimerRef.current);
      setVitals(null);
    }

    return () => {
      if (vitalsTimerRef.current) clearInterval(vitalsTimerRef.current);
    };
  }, [healthMode]);

  const startConversation = async (overrideMsg?: string) => {
    const msgToSend = overrideMsg || message;
    if (!msgToSend.trim()) return;
    
    setIsLoading(true);
    setConversation([]); // clear old
    setDisplayedText("");
    
    try {
      const res = await fetch(`${BACKEND_URL}/chat-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: msgToSend,
          user_name: userName,
          mode: mode === "landing" ? "chat" : mode,
          turns: turnCount
        }),
      });
      
      if (!res.ok) throw new Error("Failed to fetch debate");
      
      const data = await res.json();
      const speeches = data.speeches.map((s: any) => ({
        ...s,
        audioUrl: s.audioUrl.startsWith("http") ? s.audioUrl : `${BACKEND_URL}${s.audioUrl}`
      }));
      
      setConversation(speeches);
      setIsLoading(false);
      setIsPlaying(true);
      setCurrentIndex(0);
      setMessage(""); // Clear input after sending
    } catch (e) {
      console.error(e);
      setIsLoading(false);
      setDisplayedText("Error: Could not summon the ducks. Is the backend running?");
    }
  };

  const startAudioConversation = async (audioBlob: Blob) => {
    if (!audioBlob) return;
    
    setIsLoading(true);
    setConversation([]); // clear old
    setDisplayedText("");
    
    try {
      console.log(audioBlob)

      const formData = new FormData();
      formData.append("audio", audioBlob, "audio.webm");
      formData.append("user_name", userName);
      formData.append("mode", mode === "landing" ? "chat" : mode);
      formData.append("turns", turnCount.toString());


      const res = await fetch(`${BACKEND_URL}/chat-audio`, {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) throw new Error("Failed to fetch debate");
      
      const data = await res.json();
      const { speeches, transcription } = data;
      
      console.log("allSpeeches:", speeches);
      console.log("Transcription:", transcription);
    

      // Fix audio URLs to be absolute
      const convo = speeches.map((s: any) => ({
        ...s,
        audioUrl: s.audioUrl.startsWith("http") ? s.audioUrl : `${BACKEND_URL}${s.audioUrl}`
      }));
      
      setMessage("");
      setConversation(convo);
      setIsLoading(false);
      setIsPlaying(true);
      setCurrentIndex(0);
    } catch (e) {
      console.error(e);
      setIsLoading(false);
      setDisplayedText("Error: Could not summon the ducks. Is the backend running?");
    }
  };

  // Triggers a single duck to speak
  const pokeDuck = async (duckId: number) => {
    if (isPlaying || isLoading) return;

    setIsLoading(true);
    setConversation([]); 
    setDisplayedText("");
    
    try {
      const res = await fetch(`${BACKEND_URL}/chat/duck`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          duck_id: duckId,
          user_name: userName
        }),
      });
      
      if (!res.ok) throw new Error("Failed to poke duck");
      
      const data = await res.json();
      const speeches = data.speeches.map((s: any) => ({
        ...s,
        audioUrl: s.audioUrl.startsWith("http") ? s.audioUrl : `${BACKEND_URL}${s.audioUrl}`
      }));
      
      setConversation(speeches);
      setIsLoading(false);
      setIsPlaying(true);
      setCurrentIndex(0);
    } catch (e) {
      console.error(e);
      setIsLoading(false);
      setDisplayedText("Error: Duck is shy (backend error).");
    }
  };

  const resetBackendMemory = async () => {
    try {
      await fetch(`${BACKEND_URL}/reset`, { method: "POST" });
      setConversation([]);
      setIsPlaying(false);
      setDisplayedText("");
      alert("The ducks have forgotten everything.");
    } catch (e) {
      console.error(e);
    }
  }

  const stopConversation = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setCurrentIndex(-1);
    setDisplayedText("");
  };

  useEffect(() => {
    if (!isPlaying || currentIndex < 0) return;

    if (currentIndex >= conversation.length) {
      setIsPlaying(false);
      setCurrentIndex(-1); // Reset
      return;
    }

    const currentSpeech = conversation[currentIndex];
    setDisplayedText(currentSpeech.text);

    // Play Audio
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    const audio = new Audio(currentSpeech.audioUrl);
    audioRef.current = audio;
    
    const handleEnded = () => {
      setCurrentIndex((prev) => prev + 1);
    };
    
    audio.addEventListener('ended', handleEnded);
    
    audio.play().catch(err => {
      console.error("Audio play failed", err);
      setTimeout(handleEnded, currentSpeech.duration);
    });

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, [currentIndex, isPlaying, conversation]);

  // Helper to get current active duck
  const activeDuckId = currentIndex >= 0 && currentIndex < conversation.length 
    ? conversation[currentIndex].duckId 
    : null;

  const activeDuck = DUCKS.find(d => d.id === activeDuckId);
  
  // Get dynamic icon for active duck if available in speech data
  const currentMood = currentIndex >= 0 && conversation[currentIndex]?.mood;

  // --- Landing Screen ---
  if (mode === "landing") {
    return (
      <div className="min-h-screen bg-[#e0f7fa] text-slate-800 font-sans flex items-center justify-center p-4">
        <div className="max-w-6xl w-full bg-white/90 backdrop-blur-xl rounded-4xl shadow-2xl p-8 md:p-12 border-4 border-teal-100 grid grid-cols-1 md:grid-cols-12 gap-12">
          
          {/* Brand Column */}
          <div className="md:col-span-5 flex flex-col justify-center space-y-6 text-center md:text-left">
             <div className="inline-block mx-auto md:mx-0 p-4 bg-teal-100 rounded-3xl w-fit mb-2 shadow-inner">
                <div className="text-7xl animate-bounce">🦆</div>
             </div>
             <h1 className="text-5xl font-black text-teal-900 tracking-tight leading-[1.1]">
               The Quack<br/><span className="text-teal-600">Council</span>
             </h1>
             <p className="text-lg text-teal-700/80 font-medium leading-relaxed">
               Whether you need emotional support or a code review, our expert panel of rubber ducks is here to listen (and judge).
             </p>
          </div>

          {/* Config Column */}
          <div className="md:col-span-7 space-y-8 bg-teal-50/50 rounded-3xl p-6 md:p-8 border border-teal-100">
             
             <div className="space-y-3">
               <label className="text-xs font-bold text-teal-800 uppercase tracking-widest pl-2">Identify Yourself</label>
               <input
                 type="text"
                 value={userName}
                 onChange={(e) => setUserName(e.target.value)}
                 placeholder="Your Name"
                 className="w-full px-6 py-4 rounded-2xl border-2 border-white focus:border-teal-400 focus:outline-none text-lg bg-white shadow-sm transition-all"
               />
             </div>

             <div className="space-y-3">
               <label className="text-xs font-bold text-teal-800 uppercase tracking-widest pl-2">Select Mode</label>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={() => setMode("chat")}
                    className="group relative overflow-hidden rounded-2xl bg-white hover:bg-teal-600 p-6 transition-all shadow-sm hover:shadow-xl border-2 border-white hover:border-teal-600 text-left"
                  >
                    <div className="relative z-10 flex flex-col gap-2">
                      <div className="p-2 bg-teal-100 w-fit rounded-lg text-teal-600 group-hover:bg-white/20 group-hover:text-white">
                        <MessageCircle size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 group-hover:text-white">Therapy Chat</h3>
                        <p className="text-xs text-slate-500 group-hover:text-teal-100 mt-1">Venting & Emotional Support</p>
                      </div>
                    </div>
                  </button>

                  <button 
                    onClick={() => setMode("debug")}
                    className="group relative overflow-hidden rounded-2xl bg-white hover:bg-indigo-600 p-6 transition-all shadow-sm hover:shadow-xl border-2 border-white hover:border-indigo-600 text-left"
                  >
                    <div className="relative z-10 flex flex-col gap-2">
                      <div className="p-2 bg-indigo-100 w-fit rounded-lg text-indigo-600 group-hover:bg-white/20 group-hover:text-white">
                        <Bug size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 group-hover:text-white">Debug Mode</h3>
                        <p className="text-xs text-slate-500 group-hover:text-indigo-100 mt-1">Technical Rubberducking</p>
                      </div>
                    </div>
                  </button>
               </div>
             </div>

             <div className="pt-4 flex items-center justify-between text-xs text-teal-600/60 font-medium px-2">
                <span>v1.0.0 • Hack Western</span>
                <a 
                  href="https://en.wikipedia.org/wiki/Rubber_duck_debugging" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-teal-800 transition-colors"
                >
                  <span>Inspired by Rubber Ducking</span>
                  <HelpCircle size={12} />
                </a>
              </div>

          </div>
        </div>
      </div>
    );
  }

  // --- Vitals Overlay Component ---
  const VitalsOverlay = () => {
    if (!healthMode || !vitals) return null;
    return (
      <div className="fixed top-24 right-6 z-40 bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-amber-500/30 animate-in slide-in-from-right duration-500 w-48 ring-1 ring-black/50">
         <div className="flex items-center gap-2 mb-3 border-b border-slate-700 pb-2">
            <div className="p-1.5 bg-rose-900/50 text-rose-400 rounded-lg">
              <Heart size={16} className="animate-pulse" fill="currentColor" />
            </div>
            <span className="text-xs font-bold text-amber-100/90 uppercase tracking-wider">Live Vitals</span>
         </div>
         <div className="space-y-2">
            <div className="flex justify-between items-end">
               <span className="text-xs text-slate-400">Heart Rate</span>
               <span className="text-lg font-black text-slate-200">{vitals.heart_rate_bpm.toFixed(0)} <span className="text-xs font-normal text-slate-500">bpm</span></span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
               <div className="h-full bg-rose-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(244,63,94,0.5)]" style={{ width: `${Math.min(100, (vitals.heart_rate_bpm / 120) * 100)}%` }} />
            </div>
            
            <div className="flex justify-between items-end mt-2">
               <span className="text-xs text-slate-400">Breathing</span>
               <span className="text-lg font-black text-slate-200">{vitals.breathing_rate_rpm.toFixed(0)} <span className="text-xs font-normal text-slate-500">rpm</span></span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
               <div className="h-full bg-teal-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(20,184,166,0.5)]" style={{ width: `${Math.min(100, (vitals.breathing_rate_rpm / 30) * 100)}%` }} />
            </div>
         </div>
      </div>
    )
  }

  // --- Debug Mode UI (Technical Theme) ---
  if (mode === "debug") {
     return (
      <div className="min-h-screen bg-[#0f172a] text-slate-200 font-mono selection:bg-indigo-500/30 flex flex-col">
        <VitalsOverlay />
        
        {/* Debug Header */}
        <header className="border-b border-slate-800 bg-slate-900/80 p-4 flex items-center justify-between backdrop-blur-md sticky top-0 z-50">
           <div className="flex items-center gap-4">
             <button onClick={() => setMode("landing")} className="hover:bg-slate-800 p-2 rounded-lg transition-colors text-slate-400 hover:text-white">
               <ChevronLeft size={20} />
             </button>
             <h1 className="font-bold text-indigo-400 flex items-center gap-2 text-sm md:text-base tracking-wider">
               <Code size={18} /> 
               RUBBER_DUCK_DEBUGGER v2.0
               <a href="https://en.wikipedia.org/wiki/Rubber_duck_debugging" target="_blank" rel="noopener noreferrer" title="The concept that started it all" className="opacity-50 hover:opacity-100 transition-opacity">
                 <HelpCircle size={14} />
               </a>
             </h1>
           </div>
           <div className="flex items-center gap-3">
              <button 
                onClick={() => setHealthMode(!healthMode)}
                className={`p-2 rounded transition-colors ${healthMode ? "bg-rose-900/30 text-rose-400 border border-rose-900/50" : "hover:bg-slate-800 text-slate-500"}`}
                title="Toggle Health Vitals"
              >
                <Heart size={16} fill={healthMode ? "currentColor" : "none"} />
              </button>
              <div className={`flex items-center gap-2 px-3 py-1.5 text-xs border rounded-full ${isLoading ? "bg-yellow-900/20 border-yellow-800 text-yellow-500" : "bg-green-900/20 border-green-800 text-green-500"}`}>
                 <div className={`w-2 h-2 rounded-full ${isLoading ? "bg-yellow-500 animate-pulse" : "bg-green-500"}`} />
                 {isLoading ? "PROCESSING" : "READY"}
              </div>
              <button onClick={resetBackendMemory} className="p-2 hover:bg-red-900/30 text-slate-500 hover:text-red-400 rounded transition-colors" title="Clear Memory">
                <Trash2 size={16} />
              </button>
           </div>
        </header>

        <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Panel: Code Input */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-1 flex-1 flex flex-col shadow-xl">
              <div className="bg-slate-950 rounded-t-lg p-2 border-b border-slate-800 flex items-center justify-between">
                 <span className="text-xs text-slate-500 pl-2 font-bold">INPUT_STREAM</span>
                 <span className="text-[10px] text-slate-600 bg-slate-900 px-2 py-1 rounded">Markdown Supported</span>
              </div>
              <textarea
                 value={message}
                 onChange={(e) => setMessage(e.target.value)}
                 placeholder={`// Paste your broken code here or explain the bug...\n\nfunction broken() {\n  return "help";\n}`}
                 className="flex-1 w-full bg-slate-950 text-slate-300 p-4 text-sm font-mono focus:outline-none resize-none"
              />
              <div className="p-3 border-t border-slate-800 bg-slate-900 flex justify-end">
                  <button 
                    onClick={() => startConversation()}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Analyzing..." : <>Run Analysis <Play size={14} fill="currentColor" /></>}
                  </button>
              </div>
            </div>
          </div>

          {/* Center Panel: Visualizer */}
          <div className="lg:col-span-8 bg-slate-900 rounded-xl border border-slate-800 flex flex-col relative overflow-hidden shadow-2xl">
             {/* Grid Background */}
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
             <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px] pointer-events-none" />

             <div className="flex-1 flex flex-col items-center justify-center relative z-10 p-12">
                
                {/* Ducks Display */}
                <div className="flex flex-wrap justify-center gap-8 mb-16">
                   {DUCKS.map((duck) => {
                      const isActive = duck.id === activeDuckId;
                      // Use dynamic mood if active, otherwise static icon
                      const displayIcon = (isActive && currentMood) ? currentMood : duck.icon;
                      
                      return (
                        <button 
                           key={duck.id} 
                           onClick={() => pokeDuck(duck.id)}
                           disabled={isLoading || isPlaying}
                           className={`group relative transition-all duration-500 cursor-pointer ${isActive ? "scale-110 -translate-y-2 opacity-100 grayscale-0" : "opacity-40 grayscale scale-95 hover:opacity-80 hover:grayscale-0 hover:scale-100"}`}
                        >
                           {isActive && <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-indigo-400 text-xs font-bold animate-bounce">SPEAKING</div>}
                           
                           <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-slate-800 border-2 ${duck.secondaryColor.replace('border-', 'border-')} flex items-center justify-center text-3xl shadow-lg relative transition-all duration-300`}>
                              {displayIcon}
                              {/* Audio visualizer simulation */}
                              {isActive && isPlaying && (
                                 <div className="absolute -bottom-2 left-0 right-0 flex justify-center gap-1 h-1">
                                    <div className="w-1 bg-indigo-500 animate-[bounce_0.5s_infinite]" />
                                    <div className="w-1 bg-indigo-500 animate-[bounce_0.6s_infinite]" />
                                    <div className="w-1 bg-indigo-500 animate-[bounce_0.7s_infinite]" />
                                 </div>
                              )}
                           </div>
                           <div className="mt-3 text-center">
                              <div className={`text-xs font-bold uppercase tracking-wider ${isActive ? "text-indigo-300" : "text-slate-600"}`}>{duck.name}</div>
                              <div className="text-[10px] text-slate-600">{duck.personality}</div>
                           </div>
                        </button>
                      )
                   })}
                </div>

                {/* Terminal Output */}
                <div className="w-full max-w-3xl">
                   {activeDuck ? (
                      <div className="bg-slate-950/80 backdrop-blur-sm border-l-4 border-indigo-500 p-6 rounded-r-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                         <div className="flex items-center gap-2 mb-2">
                            <span className="text-indigo-400 font-bold text-sm">@{activeDuck.name}</span>
                            <span className="text-slate-600 text-xs">says:</span>
                         </div>
                         <p className="text-lg md:text-xl text-slate-200 leading-relaxed font-light">
                            "{displayedText}"
                         </p>
                      </div>
                   ) : (
                      <div className="text-center text-slate-700 text-sm font-mono uppercase tracking-widest">
                         System Idle. Waiting for code input... <br/>
                         <span className="text-xs opacity-50">(Click a duck to ping directly)</span>
                      </div>
                   )}
                </div>

             </div>
          </div>

        </div>
      </div>
     )
  }

  // --- Chat Mode (Therapy Theme) ---
  // This section is the "Therapy Chat" mode, which the user requested to look like a stage.
  return (
    <div className="min-h-screen bg-[#2a1b18] text-amber-100 font-serif selection:bg-red-900 selection:text-white relative overflow-hidden">
      <VitalsOverlay />
      
      {/* Stage Curtains (CSS pseudo-elements or divs) */}
      <div className="fixed top-0 left-0 h-full w-32 md:w-48 bg-red-900 shadow-[10px_0_30px_rgba(0,0,0,0.5)] z-10 rounded-br-[100px] transform origin-top-left" />
      <div className="fixed top-0 right-0 h-full w-32 md:w-48 bg-red-900 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-10 rounded-bl-[100px] transform origin-top-right" />
      
      {/* Stage Top Curtain */}
      <div className="fixed top-0 left-0 w-full h-24 bg-red-800 shadow-lg z-20 rounded-b-[50%] transform scale-x-150" />

      {/* Gold Accents */}
      <div className="fixed top-16 left-8 md:left-16 text-yellow-400 z-30 animate-pulse opacity-50">✨</div>
      <div className="fixed top-24 right-8 md:right-16 text-yellow-400 z-30 animate-pulse opacity-50 delay-75">✨</div>

      {/* Spotlight Effect */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full bg-[conic-gradient(from_0deg_at_50%_-20%,rgba(255,255,255,0.1)_0deg,transparent_30deg,transparent_330deg,rgba(255,255,255,0.1)_360deg)] pointer-events-none" />

      <main className="relative z-10 flex flex-col items-center justify-end min-h-screen pb-0 pt-24 px-4 gap-4 md:gap-8">
        
        {/* Header / Nav */}
        <div className="absolute top-6 left-6 z-50">
          <button 
            onClick={() => setMode("landing")}
            className="flex items-center gap-2 bg-black/40 backdrop-blur-sm hover:bg-black/60 text-amber-100 font-bold px-4 py-2 rounded-full transition-all border border-amber-900/50"
          >
            <ChevronLeft size={20} />
            Back
          </button>
        </div>
        
        <div className="absolute top-6 right-6 z-50 flex gap-2">
           <button 
              onClick={() => setHealthMode(!healthMode)}
              className={`p-3 rounded-full transition-colors ${healthMode ? "bg-rose-600 text-white border-2 border-rose-400 shadow-[0_0_15px_rgba(225,29,72,0.5)]" : "bg-amber-900/80 text-amber-100 hover:bg-amber-800 border border-amber-700"}`}
              title="Toggle Vitals"
           >
             <Heart size={20} fill={healthMode ? "currentColor" : "none"} />
           </button>
           <button onClick={resetBackendMemory} title="Clear Session" className="p-3 bg-amber-900/80 hover:bg-red-900 text-amber-100 hover:text-red-200 rounded-full transition-colors border border-amber-700 hover:border-red-700">
             <Trash2 size={20} />
           </button>
        </div>

        {/* Title / Marquee */}
        <div className="text-center space-y-2 mt-4 mb-auto">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-amber-400 drop-shadow-[0_4px_0_rgba(0,0,0,0.5)] uppercase font-sans">
            The Quack Council
          </h1>
          <p className="text-amber-200/60 font-medium tracking-widest uppercase text-sm">
            Theater Actor
          </p>
        </div>

        {/* Ducks Container - On "Stage" Floor */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-12 items-end mb-8 pb-8 border-b-8 border-[#3e2c20] w-full max-w-5xl relative">
          {/* Stage Floor background behind ducks */}
          <div className="absolute bottom-0 w-[120%] left-1/2 -translate-x-1/2 h-32 bg-[#3e2c20] transform perspective-[500px] rotate-x-12 z-[-1] shadow-inner rounded-t-[100px]" />

          {DUCKS.map((duck) => {
            const isActive = duck.id === activeDuckId;
            const displayIcon = (isActive && currentMood) ? currentMood : duck.icon;

            return (
              <button 
                key={duck.id} 
                onClick={() => pokeDuck(duck.id)}
                disabled={isLoading || isPlaying}
                className={`
                  relative transition-all duration-500 ease-out flex flex-col items-center cursor-pointer
                  ${isActive ? "scale-125 -translate-y-8 z-20 drop-shadow-[0_20px_20px_rgba(255,215,0,0.3)]" : "scale-95 opacity-70 hover:opacity-100 hover:scale-100 hover:-translate-y-2"}
                `}
              >
                {/* Spotlight when active */}
                {isActive && (
                   <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-24 h-64 bg-linear-to-b from-yellow-200/20 to-transparent pointer-events-none blur-xl" />
                )}

                <div 
                  className={`
                    w-24 h-24 rounded-full flex items-center justify-center shadow-2xl border-4
                    ${duck.color} ${duck.secondaryColor}
                    transition-colors duration-300
                  `}
                >
                  <span className="text-5xl drop-shadow-md select-none transition-all duration-300">
                    {displayIcon}
                  </span>
                </div>
                
                {/* Name Plate */}
                <div className={`mt-4 px-4 py-1 rounded bg-[#1a1a1a] border border-amber-700/50 text-xs font-bold uppercase tracking-widest text-amber-100 shadow-lg
                  ${isActive ? "ring-2 ring-yellow-500/50 scale-110" : ""}
                `}>
                  {duck.name}
                </div>
              </button>
            );
          })}
        </div>

        {/* Conversation / Dialogue Box */}
        <div className="w-full max-w-3xl min-h-[180px] flex flex-col items-center justify-center text-center p-6 md:p-8 bg-black/60 backdrop-blur-sm rounded-xl border-2 border-amber-700/30 shadow-2xl relative mb-8">
          {isPlaying && activeDuck ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-2xl relative z-10">
              <div className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center justify-center gap-2">
                 <span className="w-8 h-px bg-amber-500/50"></span>
                 {activeDuck.personality}
                 <span className="w-8 h-px bg-amber-500/50"></span>
              </div>
              <h2 className="text-2xl md:text-3xl font-medium text-amber-50 leading-relaxed font-sans">
                "{displayedText}"
              </h2>
            </div>
          ) : (
            <div className="text-amber-100/30 italic font-serif text-lg">
              {isLoading 
                ? <div className="flex flex-col items-center gap-3"><div className="w-6 h-6 border-2 border-amber-700 border-t-amber-400 rounded-full animate-spin" /><span>Rehearsing lines...</span></div>
                : (currentIndex === -1 ? "The stage is set. Break a leg." : "End of scene.")}
            </div>
          )}
        </div>

        {/* Input Area - Text & Controls */}
        <div className="w-full max-w-2xl flex flex-col gap-4 mb-8 sticky bottom-0 pb-4">
          {!isPlaying ? (
            <div className="flex gap-2 bg-black/80 p-2 pr-3 rounded-full shadow-2xl border border-amber-900/50 focus-within:ring-2 focus-within:ring-amber-600 transition-all backdrop-blur-md">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Cue the actors..."
                className="flex-1 px-6 py-3 bg-transparent focus:outline-none text-amber-50 placeholder:text-amber-100/20 font-sans"
                onKeyDown={(e) => e.key === 'Enter' && startConversation()}
              />
              <button 
                onClick={() => startConversation()}
                disabled={isLoading}
                className="p-3 bg-amber-700 hover:bg-amber-600 text-white rounded-full transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 shadow-md"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send size={20} className="ml-0.5" />
                )}
              </button>

              <button 
                onClick={async () => {
                  if (isRecording) {
                    stopRecording();
                  } else {
                    startRecording();
                  }
                }}
                disabled={isLoading}
                className={`p-3 ${
                  isRecording ? "bg-red-600 hover:bg-red-500" : "bg-amber-900 hover:bg-amber-800"
                } text-white rounded-full transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 shadow-md`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Mic size={20} className="ml-0.5" />
                )}
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button 
                onClick={stopConversation}
                className="flex items-center gap-2 px-8 py-3 bg-red-900/80 hover:bg-red-800 text-white rounded-full font-bold text-lg shadow-xl backdrop-blur-md border border-red-700 transition-all active:scale-95"
              >
                <RotateCcw size={20} />
                Cut Scene
              </button>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
