import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './FirebaseProvider';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Play, Pause, RotateCcw, Coffee, Brain, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export const Focus: React.FC = () => {
  const { user } = useAuth();
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [isMuted, setIsMuted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleComplete();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const handleComplete = async () => {
    setIsActive(false);
    if (timerRef.current) clearInterval(timerRef.current);

    if (mode === 'work' && user) {
      // Log session
      try {
        await addDoc(collection(db, 'users', user.uid, 'sessions'), {
          userId: user.uid,
          startTime: new Date(Date.now() - 25 * 60 * 1000),
          endTime: serverTimestamp(),
          durationMinutes: 25,
          subject: 'Focus Session',
          type: 'pomodoro'
        });
      } catch (e) {
        console.error("Failed to log session:", e);
      }
      
      alert("Great work! Time for a break.");
      setMode('break');
      setTimeLeft(5 * 60);
    } else {
      alert("Break's over! Let's get back to work.");
      setMode('work');
      setTimeLeft(25 * 60);
    }
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[600px] gap-8">
      <div className="flex bg-white border border-[var(--color-ink)] p-2 shadow-[4px_4px_0px_0px_rgba(10,10,10,1)]">
        <button 
          onClick={() => { setMode('work'); setTimeLeft(25 * 60); setIsActive(false); }}
          className={cn(
            "px-6 py-2 font-mono text-[10px] uppercase font-bold tracking-widest transition-all",
            mode === 'work' ? "bg-[var(--color-ink)] text-white" : "text-gray-400 hover:text-[var(--color-ink)]"
          )}
        >
          Deep Work
        </button>
        <button 
          onClick={() => { setMode('break'); setTimeLeft(5 * 60); setIsActive(false); }}
          className={cn(
            "px-6 py-2 font-mono text-[10px] uppercase font-bold tracking-widest transition-all",
            mode === 'break' ? "bg-[var(--color-ink)] text-white" : "text-gray-400 hover:text-[var(--color-ink)]"
          )}
        >
          Quick Break
        </button>
      </div>

      <div className="relative">
        <motion.div 
          animate={{ scale: isActive ? [1, 1.02, 1] : 1 }}
          transition={{ repeat: Infinity, duration: 4 }}
          className="w-80 h-80 md:w-96 md:h-96 rounded-full border-8 border-[var(--color-ink)] flex items-center justify-center bg-white shadow-[20px_20px_0px_0px_rgba(0,245,255,1)] relative overflow-hidden"
        >
          <div className="text-center relative z-10">
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-gray-400 mb-2 block">{mode} phase</span>
            <div className="text-7xl md:text-8xl font-black font-mono tracking-tighter tabular-nums text-[var(--color-ink)]">
              {formatTime(timeLeft)}
            </div>
          </div>
          
          {/* Progress Wave */}
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: `${100 - (timeLeft / (mode === 'work' ? 25 * 60 : 5 * 60)) * 100}%` }}
            className="absolute bottom-0 left-0 right-0 bg-[var(--color-accent)] opacity-20 transition-all duration-1000"
          />
        </motion.div>

        <div className="absolute top-1/2 -right-12 translate-y-[-50%] flex flex-col gap-4">
          <button onClick={() => setIsMuted(!isMuted)} className="p-3 bg-white border border-[var(--color-ink)] hover:bg-gray-100 transition-colors">
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <div className="p-3 bg-white border border-[var(--color-ink)] flex items-center justify-center">
            {mode === 'work' ? <Brain className="w-5 h-5" /> : <Coffee className="w-5 h-5" />}
          </div>
        </div>
      </div>

      <div className="flex gap-6 mt-8">
        <button 
          onClick={resetTimer}
          className="w-16 h-16 flex items-center justify-center border-2 border-[var(--color-ink)] bg-white hover:bg-gray-50 transition-colors"
        >
          <RotateCcw className="w-6 h-6" />
        </button>
        <button 
          onClick={toggleTimer}
          className={cn(
            "w-24 h-24 flex items-center justify-center border-2 border-[var(--color-ink)] transition-all",
            isActive ? "bg-white text-[var(--color-ink)]" : "bg-[var(--color-ink)] text-white shadow-[8px_8px_0px_0px_rgba(0,245,255,1)]"
          )}
        >
          {isActive ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10 ml-1" />}
        </button>
      </div>

      <div className="mt-12 text-center max-w-sm">
        <p className="font-mono text-[10px] uppercase text-gray-500 mb-2">Focus Logic</p>
        <p className="text-sm font-medium italic text-gray-600">
          "The intellect is not a vessel to be filled, but a fire to be kindled by focused attention."
        </p>
      </div>
    </div>
  );
};
