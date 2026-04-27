import React, { useState, useEffect } from 'react';
import { useAuth } from './FirebaseProvider';
import { db } from '../lib/firebase';
import { collection, addDoc, onSnapshot, query, where, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Plus, CheckCircle2, Circle, Trash2, AlertCircle, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

export const Planner: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTask, setNewTask] = useState({ title: '', priority: 'medium', subject: '' });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'tasks'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTask.title) return;

    await addDoc(collection(db, 'users', user.uid, 'tasks'), {
      ...newTask,
      userId: user.uid,
      status: 'pending',
      createdAt: serverTimestamp(),
      dueDate: new Date().toISOString(), // Default for now
    });

    setNewTask({ title: '', priority: 'medium', subject: '' });
    setIsAdding(false);
  };

  const toggleTask = async (id: string, currentStatus: string) => {
    if (!user) return;
    const taskRef = doc(db, 'users', user.uid, 'tasks', id);
    await updateDoc(taskRef, {
      status: currentStatus === 'completed' ? 'pending' : 'completed'
    });
  };

  const deleteTask = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'tasks', id));
  };

  const priorities: Record<string, string> = {
    high: 'bg-red-100 text-red-600',
    medium: 'bg-yellow-100 text-yellow-600',
    low: 'bg-blue-100 text-blue-600',
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">Execution Plan</span>
          <h1 className="text-5xl font-black mt-2 font-display italic">Schedules</h1>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-[var(--color-ink)] text-white p-4 font-bold flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,245,255,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,245,255,1)] transition-all"
        >
          <Plus className="w-5 h-5" />
          <span className="text-xs uppercase tracking-widest">Add Objective</span>
        </button>
      </header>

      {isAdding && (
        <form onSubmit={addTask} className="bg-white border-2 border-[var(--color-ink)] p-8 shadow-[8px_8px_0px_0px_rgba(10,10,10,1)] grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="md:col-span-2">
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-2">Subject / Title</label>
            <input 
              autoFocus
              className="w-full border-b-2 border-gray-100 focus:border-[var(--color-ink)] transition-colors py-2 outline-none text-lg font-bold"
              placeholder="E.g. Discrete Mathematics..."
              value={newTask.title}
              onChange={e => setNewTask({...newTask, title: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-2">Priority</label>
            <select 
              className="w-full border-b-2 border-gray-100 focus:border-[var(--color-ink)] py-2 outline-none"
              value={newTask.priority}
              onChange={e => setNewTask({...newTask, priority: e.target.value})}
            >
              <option value="low">LOW</option>
              <option value="medium">MEDIUM</option>
              <option value="high">HIGH</option>
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full bg-[var(--color-accent)] border-2 border-[var(--color-ink)] py-3 font-bold text-xs uppercase tracking-widest">
              DEPLOY TASK
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-6">
        {tasks.length === 0 && !isAdding && (
          <div className="text-center py-20 bg-white border-2 border-dashed border-gray-200">
            <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-mono text-sm uppercase tracking-widest">System Empty — Awaiting Inputs</p>
          </div>
        )}

        {tasks.sort((a,b) => (a.status === 'completed' ? 1 : -1)).map((task) => (
          <div 
            key={task.id} 
            className={cn(
              "group bg-white border border-[var(--color-ink)] p-6 transition-all duration-300 flex items-center justify-between",
              task.status === 'completed' ? "opacity-50 grayscale" : "shadow-[6px_6px_0px_0px_rgba(10,10,10,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(10,10,10,1)]"
            )}
          >
            <div className="flex items-center gap-6">
              <button onClick={() => toggleTask(task.id, task.status)} className="transition-transform active:scale-90">
                {task.status === 'completed' ? (
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                ) : (
                  <Circle className="w-8 h-8 text-gray-300 hover:text-[var(--color-ink)]" />
                )}
              </button>

              <div>
                <div className="flex items-center gap-3 mb-1">
                   <span className={cn("text-[9px] font-bold uppercase py-0.5 px-2", priorities[task.priority])}>
                    {task.priority}
                  </span>
                  <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {task.dueDate ? format(new Date(task.dueDate), 'MMM dd') : 'No Date'}
                  </span>
                </div>
                <h3 className={cn("text-xl font-bold font-mono tracking-tight", task.status === 'completed' && "line-through")}>
                  {task.title}
                </h3>
              </div>
            </div>

            <button 
              onClick={() => deleteTask(task.id)}
              className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
