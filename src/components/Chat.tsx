import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './FirebaseProvider';
import { GoogleGenAI } from "@google/genai";
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Send, Bot, User, Sparkles, Loader2, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

// Constants
const MODEL_NAME = "gemini-3-flash-preview";

export const Chat: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<{ role: 'ai' | 'user', text: string }[]>([
    { role: 'ai', text: "Systems online. I am ETHOS-1, your cognitive assistant. How shall we optimize your learning today?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [userContext, setUserContext] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages, isTyping]);

  useEffect(() => {
    if (!user) return;
    
    const fetchContext = async () => {
      const q = query(collection(db, 'users', user.uid, 'tasks'), where('status', '!=', 'completed'));
      const snap = await getDocs(q);
      const tasks = snap.docs.map(d => `- ${d.data().title} (${d.data().priority} priority)`).join('\n');
      setUserContext(`Current Pending Tasks:\n${tasks}`);
    };
    
    fetchContext();
  }, [user]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      
      const systemPrompt = `
        You are ETHOS-1, a highly intelligent, slightly minimalist, and professional AI Study Tutor.
        Aesthetics: Precise, technical, respectful, encouraging but firm on productivity.
        Goal: Help the student manage their schedule, provide motivation, and answer academic questions.
        
        Context about the student:
        User Name: ${user?.displayName}
        ${userContext}
        
        When suggesting schedules, prioritize high-priority tasks.
        Keep responses concise and formatted clearly.
      `;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: [
            { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        }
      });

      const aiResponse = response.text || "Apologies, there was a glitch in the cognitive stream.";
      setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'ai', text: "Connection failure. Please check your system status or API configuration." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-120px)] border-2 border-[var(--color-ink)] bg-white shadow-[12px_12px_0px_0px_rgba(10,10,10,1)] relative overflow-hidden">
      {/* Header bar */}
      <div className="bg-[var(--color-ink)] text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[var(--color-accent)] flex items-center justify-center">
            <BrainCircuit className="w-5 h-5 text-[var(--color-ink)]" />
          </div>
          <span className="font-mono text-[10px] uppercase tracking-widest font-bold">ETHOS-1 COGNITIVE LINK</span>
        </div>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-green-400 opacity-20" />
          <div className="w-2 h-2 rounded-full bg-green-400 opacity-20" />
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-[#fafafa]"
      >
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "flex gap-4 max-w-[85%]",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-10 h-10 flex-shrink-0 border border-[var(--color-ink)] flex items-center justify-center",
                msg.role === 'ai' ? "bg-[var(--color-accent)]" : "bg-white"
              )}>
                {msg.role === 'ai' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
              <div className={cn(
                "p-4 border border-[var(--color-ink)] font-mono text-sm leading-relaxed",
                msg.role === 'ai' ? "bg-white" : "bg-[var(--color-ink)] text-white shadow-[4px_4px_0px_0px_rgba(0,245,255,1)]"
              )}>
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isTyping && (
          <div className="flex gap-4 max-w-[80%]">
             <div className="w-10 h-10 bg-[var(--color-accent)] border border-[var(--color-ink)] flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
              <div className="p-4 border border-[var(--color-ink)] font-mono text-xs text-gray-400 flex items-center gap-2 italic">
                ETHOS-1 is processing...
              </div>
          </div>
        )}
      </div>

      <form 
        onSubmit={handleSend}
        className="p-6 border-t border-[var(--color-ink)] bg-white flex gap-4"
      >
        <input 
          disabled={isTyping}
          className="flex-1 bg-gray-50 border border-[var(--color-ink)] p-4 font-mono text-sm outline-none focus:bg-white focus:shadow-[inset_2px_2px_0px_rgba(0,0,0,0.1)] transition-all"
          placeholder="ENTER QUERY / COMMAND..."
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button 
          disabled={isTyping}
          type="submit" 
          className="bg-[var(--color-ink)] text-white p-4 hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          <Send className="w-6 h-6 px-0.5" />
        </button>
      </form>

      {/* Suggestion Chips */}
      <div className="px-6 pb-6 flex gap-2 overflow-x-auto no-scrollbar">
        {["Suggest study plan", "Explain task priority", "Give me a motivation boost", "Summarize my day"].map(chip => (
          <button 
            key={chip}
            onClick={() => setInput(chip)}
            className="text-[9px] font-bold uppercase tracking-tighter border border-gray-200 px-3 py-1.5 hover:border-[var(--color-ink)] transition-colors whitespace-nowrap"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
};
