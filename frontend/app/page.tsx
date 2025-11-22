"use client";

import { useState, useEffect, useRef } from "react";
import { Play, RotateCcw, Mic } from "lucide-react";

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
  duration: number; // roughly how long to show this text in ms
}

// --- Dummy Data ---
const DUCKS: Duck[] = [
  { id: 1, name: "Gordon", personality: "angry", color: "bg-red-400", secondaryColor: "border-red-600" },
  { id: 2, name: "Joy", personality: "happy", color: "bg-yellow-300", secondaryColor: "border-yellow-500" },
  { id: 3, name: "Blues", personality: "sad", color: "bg-blue-400", secondaryColor: "border-blue-600" },
  { id: 4, name: "Dexter", personality: "smart", color: "bg-green-400", secondaryColor: "border-green-600" },
  { id: 5, name: "Goose", personality: "silly", color: "bg-orange-400", secondaryColor: "border-orange-600" },
];

const CONVERSATION: Speech[] = [
  { duckId: 2, text: "Guys! Guys! Look at this beautiful day! Isn't it just AMAZING to be a duck?", duration: 3000 },
  { duckId: 3, text: "It's okay... I guess. But the water is kinda cold today...", duration: 3000 },
  { duckId: 1, text: "COLD?! YOU CALL THIS COLD? IT'S RAW! THE WATER IS RAW!!", duration: 3000 },
  { duckId: 4, text: "Actually, technically speaking, water cannot be 'raw'. It is a compound of hydrogen and oxygen.", duration: 4000 },
  { duckId: 5, text: "HONK! I found a spoon!", duration: 2000 },
  { duckId: 1, text: "PUT THAT SPOON DOWN! YOU DON'T KNOW WHERE IT'S BEEN!", duration: 2500 },
  { duckId: 2, text: "Aww, maybe he wants to make a soup! Let's all make soup together!", duration: 3000 },
  { duckId: 3, text: "Soup makes me sad. It reminds me of vegetables that passed away...", duration: 3500 },
  { duckId: 4, text: "Vegetables don't have consciousness, Blues. They are merely cellulose and nutrients.", duration: 3500 },
  { duckId: 5, text: "I AM THE SOUP KING! BOW BEFORE THE SPOON!", duration: 2500 },
  { duckId: 1, text: "THIS CONVERSATION IS A DISASTER! ABSOLUTE DISASTER!", duration: 3000 },
];

export default function Home() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1); // -1 means not started
  const [displayedText, setDisplayedText] = useState("");
  
  // Timer ref to handle conversation pacing
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startConversation = () => {
    setIsPlaying(true);
    setCurrentIndex(0);
    setDisplayedText("");
  };

  const resetConversation = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsPlaying(false);
    setCurrentIndex(-1);
    setDisplayedText("");
  };

  useEffect(() => {
    if (!isPlaying || currentIndex < 0) return;

    if (currentIndex >= CONVERSATION.length) {
      setIsPlaying(false);
      return;
    }

    const currentSpeech = CONVERSATION[currentIndex];
    setDisplayedText(currentSpeech.text);

    // Advance to next speech after duration
    timerRef.current = setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
    }, currentSpeech.duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, isPlaying]);

  // Helper to get current active duck
  const activeDuckId = currentIndex >= 0 && currentIndex < CONVERSATION.length 
    ? CONVERSATION[currentIndex].duckId 
    : null;

  const activeDuck = DUCKS.find(d => d.id === activeDuckId);

  return (
    <div className="min-h-screen bg-[#e0f7fa] text-slate-800 font-sans selection:bg-teal-200">
      {/* Background Decoration: Bushes */}
      <div className="fixed bottom-0 left-0 w-32 h-32 bg-green-400 rounded-tr-full z-0 opacity-80" />
      <div className="fixed bottom-0 left-20 w-40 h-24 bg-green-500 rounded-t-full z-0 opacity-80" />
      <div className="fixed bottom-0 right-0 w-48 h-40 bg-green-400 rounded-tl-full z-0 opacity-80" />
      <div className="fixed bottom-0 right-32 w-24 h-24 bg-green-500 rounded-t-full z-0 opacity-80" />
      
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 gap-12">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-teal-900">The Quack Council</h1>
          <p className="text-teal-700 opacity-80">Listen to them debate the important things in life.</p>
        </div>

        {/* Ducks Container */}
        <div className="flex flex-wrap justify-center gap-8 md:gap-12 items-end h-40">
          {DUCKS.map((duck) => {
            const isActive = duck.id === activeDuckId;
            return (
              <div 
                key={duck.id}
                className={`
                  relative transition-all duration-500 ease-in-out flex flex-col items-center
                  ${isActive ? "scale-125 -translate-y-4" : "scale-100 opacity-70 grayscale-[0.3] hover:grayscale-0 hover:opacity-100"}
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
              {currentIndex === -1 ? "Press start to eavesdrop on the ducks..." : "Conversation ended."}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-4">
          {!isPlaying && (
            <button 
              onClick={startConversation}
              className="flex items-center gap-2 px-8 py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              <Play size={24} fill="currentColor" />
              {currentIndex === -1 ? "Start Conversation" : "Replay"}
            </button>
          )}
          
          {isPlaying && (
             <button 
             onClick={resetConversation}
             className="flex items-center gap-2 px-8 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all active:scale-95"
           >
             <RotateCcw size={24} />
             Stop
           </button>
          )}
        </div>
      </main>
    </div>
  );
}
