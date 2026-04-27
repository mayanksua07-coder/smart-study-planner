import React from 'react';
import { auth, db } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';

export const Auth: React.FC = () => {
  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Create profile if doesn't exist
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          userId: user.uid,
          displayName: user.displayName,
          email: user.email,
          dailyGoalMinutes: 120, // default
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-paper)] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40vw] h-[40vw] border border-[var(--color-ink)] rounded-full opacity-10 pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[30vw] h-[30vw] border border-[var(--color-ink)] rounded-full opacity-10 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white border-2 border-[var(--color-ink)] p-12 shadow-[12px_12px_0px_0px_rgba(10,10,10,1)] flex flex-col items-center text-center relative z-10"
      >
        <div className="w-20 h-20 bg-[var(--color-ink)] flex items-center justify-center mb-8 rotate-3">
          <GraduationCap className="w-12 h-12 text-white" />
        </div>

        <h1 className="font-display text-5xl italic font-black mb-4">ETHOS</h1>
        <p className="text-gray-600 mb-10 font-mono text-sm leading-relaxed">
          PRECISION STUDYING FOR THE <br /> MODERN INTELLECT.
        </p>

        <button
          onClick={handleLogin}
          className="w-full bg-[var(--color-accent)] text-[var(--color-ink)] border-2 border-[var(--color-ink)] py-4 font-bold flex items-center justify-center gap-3 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(10,10,10,1)] transition-all active:translate-x-[0px] active:translate-y-[0px] active:shadow-none"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          ENTER WITH GOOGLE
        </button>

        <div className="mt-8 pt-8 border-t border-gray-100 w-full text-[10px] uppercase tracking-widest text-gray-400 font-mono">
          © 2026 ETHOS SYSTEMS — SECURE ACCESS
        </div>
      </motion.div>
    </div>
  );
};
