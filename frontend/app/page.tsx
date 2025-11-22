"use client";

import { useState, useEffect, useRef } from "react";
import { Play, RotateCcw, Mic, Send } from "lucide-react";

// --- Types ---
type Personality = "angry" | "happy" | "sad" | "smart" | "silly";

interface Duck {
  id: number;
  name: string;
  personality: Personality;
  color: string;
  secondaryColor: string;
}

interface Speech {
  duckId: number;
  text: string;
  duration: number;
  audioUrl: string;
}

// --- Data ---
const DUCKS: Duck[] = [
  { id: 1, name: "Gordon", personality: "angry", color: "bg-red-400", secondaryColor: "border-red-600" },
  { id: 2, name: "Joy", personality: "happy", color: "bg-yellow-300", secondaryColor: "border-yellow-500" },
  { id: 3, name: "Blues", personality: "sad", color: "bg-blue-400", secondaryColor: "border-blue-600" },
  { id: 4, name: "Dexter", personality: "smart", color: "bg-green-400", secondaryColor: "border-green-600" },
  { id: 5, name: "Goose", personality: "silly", color: "bg-orange-400", secondaryColor: "border-orange-600" },
];

const BACKEND_URL = "http://localhost:8000";

export default function Home() {
  const [conversation, setConversation] = useState<Speech[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [displayedText, setDisplayedText] = useState("");
  const [topic, setTopic] = useState("Why is the pond water so cold?");
  
  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startConversation = async () => {
    if (!topic.trim()) return;
    
    setIsLoading(true);
    setConversation([]); // clear old
    setDisplayedText("");
    
    try {
      const res = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: topic }),
      });
      
      if (!res.ok) throw new Error("Failed to fetch debate");
      
      const data = await res.json();
      // Fix audio URLs to be absolute
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
      setDisplayedText("Error: Could not summon the ducks. Is the backend running?");
    }
  };

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
    
    // Fallback timeout if audio fails or takes too long? 
    // Ideally we rely on 'ended' event
    const handleEnded = () => {
      setCurrentIndex((prev) => prev + 1);
    };
    
    audio.addEventListener('ended', handleEnded);
    
    audio.play().catch(err => {
      console.error("Audio play failed", err);
      // If audio fails, fallback to timer
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

  return (
    <div className="min-h-screen bg-[#e0f7fa] text-slate-800 font-sans selection:bg-teal-200">
      {/* Background Decoration: Bushes */}
      <div className="fixed bottom-0 left-0 w-32 h-32 bg-green-400 rounded-tr-full z-0 opacity-80" />
      <div className="fixed bottom-0 left-20 w-40 h-24 bg-green-500 rounded-t-full z-0 opacity-80" />
      <div className="fixed bottom-0 right-0 w-48 h-40 bg-green-400 rounded-tl-full z-0 opacity-80" />
      <div className="fixed bottom-0 right-32 w-24 h-24 bg-green-500 rounded-t-full z-0 opacity-80" />
      
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 gap-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-teal-900">The Quack Council</h1>
          <p className="text-teal-700 opacity-80">Listen to them debate the important things in life.</p>
        </div>

        {/* Ducks Container */}
        <div className="flex flex-wrap justify-center gap-8 md:gap-12 items-end h-40 mb-8">
          {DUCKS.map((duck) => {
            const isActive = duck.id === activeDuckId;
            return (
              <div 
                key={duck.id}
                className={`
                  relative transition-all duration-500 ease-in-out flex flex-col items-center
                  ${isActive ? "scale-125 -translate-y-4 z-20" : "scale-100 opacity-70 grayscale-[0.3] hover:grayscale-0 hover:opacity-100"}
                `}
              >
                {/* Speech Bubble Arrow if active */}
                {isActive && (
                  <div className="absolute -top-8 animate-bounce text-4xl">
                    ⬇️
                  </div>
                )}

                {/* Duck Body */}
                <div 
                  className={`
                    w-20 h-20 rounded-full flex items-center justify-center shadow-lg border-4
                    ${duck.color} ${duck.secondaryColor}
                    transition-colors duration-300
                  `}
                >
                  <span className="text-3xl font-bold text-white drop-shadow-md">
                    {duck.id}
                  </span>
                </div>
                
                {/* Name Tag */}
                <div className={`mt-2 px-3 py-1 rounded-full text-sm font-bold bg-white/80 shadow-sm backdrop-blur-sm
                  ${isActive ? "text-black scale-110" : "text-gray-500"}
                `}>
                  {duck.name}
                </div>
              </div>
            );
          })}
        </div>

        {/* Topic Input - Only show if not playing */}
        {!isPlaying && (
          <div className="w-full max-w-md flex gap-2">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What should they discuss?"
              className="flex-1 px-4 py-3 rounded-full border-2 border-teal-200 focus:border-teal-500 focus:outline-none shadow-sm"
            />
            <button 
              onClick={startConversation}
              disabled={isLoading}
              className="p-3 bg-teal-600 text-white rounded-full hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
        )}

        {/* Conversation Area */}
        <div className="w-full max-w-2xl min-h-[200px] flex flex-col items-center justify-center text-center p-8 bg-white/60 backdrop-blur-md rounded-3xl shadow-xl border-2 border-white">
          {isPlaying && activeDuck ? (
            <div className="space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="uppercase tracking-widest text-xs font-bold text-gray-400">
                Current Speaker
              </div>
              <h2 className="text-2xl md:text-3xl font-medium text-slate-800 leading-relaxed">
                "{displayedText}"
              </h2>
            </div>
          ) : (
            <div className="text-gray-400 italic">
              {isLoading 
                ? "The ducks are gathering their thoughts... (Generating Audio)" 
                : (currentIndex === -1 ? "Enter a topic above to start." : "Conversation ended.")}
            </div>
          )}
        </div>

        {/* Controls */}
        {isPlaying && (
          <button 
            onClick={stopConversation}
            className="flex items-center gap-2 px-8 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            <RotateCcw size={24} />
            Stop
          </button>
        )}
      </main>
    </div>
  );
}
