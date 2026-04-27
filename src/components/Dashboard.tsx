import React, { useEffect, useState } from 'react';
import { useAuth } from './FirebaseProvider';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, Target, Calendar, Award } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';

interface SessionData {
  id: string;
  startTime: any;
  durationMinutes: number;
  subject: string;
  date: string;
  taskId?: string;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [stats, setStats] = useState({
    totalMinutes: 0,
    dailyStreak: 0,
    tasksCompleted: 0,
    focusScore: 85,
  });

  useEffect(() => {
    if (!user) return;

    const sessionsRef = collection(db, 'users', user.uid, 'sessions');
    const q = query(sessionsRef, orderBy('startTime', 'desc'), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: format(data.startTime.toDate(), 'MM/dd'),
        } as SessionData;
      });
      setSessions(sessionData);

      // Simple stats calculation
      const totalMin = sessionData.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
      setStats(prev => ({ ...prev, totalMinutes: totalMin }));
    });

    return () => unsubscribe();
  }, [user]);

  // Aggregate sessions by day for chart
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const date = format(subDays(new Date(), 6 - i), 'MM/dd');
    const daySessions = sessions.filter(s => s.date === date);
    const mins = daySessions.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
    return { name: date, mins };
  });

  const StatCard = ({ icon: Icon, label, value, unit, color }: any) => (
    <div className="bg-white border border-[var(--color-ink)] p-6 shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] flex flex-col gap-2">
      <div className={cn("w-10 h-10 flex items-center justify-center border border-[var(--color-ink)]", color)}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-black">{value}</span>
        <span className="text-xs font-mono text-gray-400">{unit}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      <header>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">Welcome Back, {user?.displayName?.split(' ')[0]}</span>
        <h1 className="text-5xl font-black mt-2 font-display italic">Overview</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Clock} label="Total Study Time" value={stats.totalMinutes} unit="MINS" color="bg-cyan-100" />
        <StatCard icon={Target} label="Daily Goal" value="80" unit="%" color="bg-yellow-100" />
        <StatCard icon={Award} label="Focus Score" value={stats.focusScore} unit="PTS" color="bg-purple-100" />
        <StatCard icon={Calendar} label="Active Streak" value="12" unit="DAYS" color="bg-green-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border border-[var(--color-ink)] p-8 shadow-[8px_8px_0px_0px_rgba(10,10,10,1)]">
          <div className="flex justify-between items-center mb-8">
            <h2 className="font-display text-2xl italic font-bold">Study Momentum</h2>
            <div className="flex gap-4 text-[10px] font-mono">
              <span className="flex items-center gap-1"><div className="w-2 h-2 bg-[var(--color-accent)]" /> MINS / DAY</span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorMins" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00F5FF" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#00F5FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#666' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#666' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#000', 
                    border: 'none', 
                    borderRadius: '0px', 
                    color: '#fff',
                    fontFamily: 'monospace',
                    fontSize: '12px'
                  }} 
                />
                <Area type="monotone" dataKey="mins" stroke="#141414" fillOpacity={1} fill="url(#colorMins)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[var(--color-ink)] text-white p-8 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle grid pattern for brutalist feel */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          
          <div className="relative z-10">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#00F5FF] mb-4">AI Insight</h3>
            <p className="font-display text-2xl italic leading-tight">
              "Your focus is strongest between 9 AM and 11 AM. Leverage this period for deep work in Mathematics."
            </p>
          </div>
          
          <div className="mt-8 relative z-10">
            <button className="text-[10px] font-bold uppercase tracking-widest bg-[var(--color-accent)] text-[var(--color-ink)] px-6 py-3 border border-white hover:bg-white transition-colors">
              VIEW SCHEDULE TIPS
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[var(--color-ink)] p-8">
        <h2 className="font-display text-2xl italic font-bold mb-6">Recent Sessions</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-4 font-mono text-[10px] uppercase text-gray-400 pb-4 border-b">
            <span>Date</span>
            <span>Subject</span>
            <span>Duration</span>
            <span>Task Reference</span>
          </div>
          {sessions.slice(0, 5).map((session) => (
            <div key={session.id} className="grid grid-cols-4 font-mono text-sm py-2 group hover:bg-gray-50 transition-colors">
              <span>{session.date}</span>
              <span className="font-bold underline decoration-[var(--color-accent)] underline-offset-4">{session.subject || 'N/A'}</span>
              <span>{session.durationMinutes}m</span>
              <span className="text-gray-400 italic">#{session.taskId?.slice(-4) || 'General'}</span>
            </div>
          ))}
          {sessions.length === 0 && <p className="text-center py-10 text-gray-400 font-mono text-xs">No sessions recorded yet. Start focusing!</p>}
        </div>
      </div>
    </div>
  );
};

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
