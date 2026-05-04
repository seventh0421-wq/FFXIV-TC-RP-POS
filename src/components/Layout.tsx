import React, { useState } from 'react';
import { usePos } from '../context/PosContext';
import { LogOut, Coffee, ChefHat, Settings, Moon, Sun, Sparkles, Coins, ShieldCheck, BookOpen, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DisclaimerContent } from '../views/LoginView';
import { TutorialView } from '../views/TutorialView';
import { AnnouncementModal } from './AnnouncementModal';

export const ThemeWrapper: React.FC<{ children: React.ReactNode, isTutorialOpen: boolean, setIsTutorialOpen: (open: boolean) => void }> = ({ children, isTutorialOpen, setIsTutorialOpen }) => {
  const { state } = usePos();
  const [showDisclaimer, setShowDisclaimer] = React.useState(false);

  // Dynamically update document font size to scale rem units
  React.useEffect(() => {
    const root = document.documentElement;
    if (state.fontSize === 'small') root.style.fontSize = '14px';
    else if (state.fontSize === 'medium') root.style.fontSize = '16px';
    else if (state.fontSize === 'large') root.style.fontSize = '18px';
    
    return () => { root.style.fontSize = ''; };
  }, [state.fontSize]);

  return (
    <div className={`min-h-screen theme-${state.theme} fontSize-${state.fontSize} flex flex-col`}>
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
      <footer className="py-4 border-t pos-border flex flex-col items-center gap-2 opacity-30 hover:opacity-100 transition-opacity">
        <p className="text-[10px] font-black pos-text-secondary uppercase tracking-[0.3em]">
          作者：閻羅@奧汀
        </p>
        <button 
          onClick={() => setShowDisclaimer(true)}
          className="text-[10px] font-black pos-text-secondary hover:text-slate-900 underline decoration-slate-300 underline-offset-4 uppercase tracking-widest"
        >
          檢視系統服務條款與免責聲明
        </button>
      </footer>

      {/* Tutorial Modal */}
      <AnimatePresence>
        {isTutorialOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-10">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTutorialOpen(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-lg"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-5xl h-full max-h-[90vh] bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-center px-10 py-6 border-b border-slate-100 sticky top-0 bg-white z-10">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-800">系統使用教學</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aetheris POS Tutorial</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsTutorialOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                <TutorialView />
              </div>

              <div className="px-10 py-6 bg-slate-50 border-t border-slate-100 text-center">
                <button 
                  onClick={() => setIsTutorialOpen(false)}
                  className="bg-slate-900 text-white hover:bg-black px-10 py-3 rounded-2xl font-black text-sm shadow-xl shadow-slate-200 transition-all active:scale-95"
                >
                  我知道了，開始營運
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Disclaimer Modal */}
      <AnimatePresence>
        {showDisclaimer && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDisclaimer(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[3rem] p-10 shadow-2xl overflow-hidden"
            >
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <ShieldCheck className="text-accent" size={24} /> 系統服務條款與免責聲明
              </h3>
              <DisclaimerContent />
              <button 
                onClick={() => setShowDisclaimer(false)}
                className="w-full mt-8 bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-black transition-all"
              >
                我已知悉
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const Navigation: React.FC<{onOpenTutorial: () => void}> = ({onOpenTutorial}) => {
  const { state, setView, setTheme, setFontSize, logout } = usePos();
  const [currentTime, setCurrentTime] = useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
    const day = dayNames[date.getDay()];
    return `${y}/${m}/${d} ${hh}:${min} (週${day})`;
  };

  return (
    <header className="pos-card h-16 border-b pos-border px-6 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-black/20 border border-white/5">
            <Coins size={22} className="text-amber-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-tight whitespace-nowrap">
              {state.shopName || '乙太連線'}
            </span>
            <div className="flex items-center gap-2 opacity-60">
              <span className="pos-text-secondary font-bold text-[8px] uppercase tracking-[0.1em]">
                {state.role === 'manager' ? '店長管理模式' : `店員 / ${state.staffName}`}
              </span>
            </div>
          </div>
        </div>
        
        <div className="h-6 w-px border-r pos-border flex-shrink-0"></div>

        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          <button 
            onClick={() => setView('order')}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all whitespace-nowrap ${state.currentView === 'order' ? 'bg-[var(--accent)] text-white shadow-md shadow-indigo-100' : 'pos-text-secondary hover:bg-black/5'}`}
          >
            點單系統
          </button>
          <button 
            onClick={() => setView('kitchen')}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all whitespace-nowrap ${state.currentView === 'kitchen' ? 'bg-[var(--accent)] text-white shadow-md shadow-indigo-100' : 'pos-text-secondary hover:bg-black/5'}`}
          >
            出餐管理
          </button>
          <button 
            onClick={() => setView('history')}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all whitespace-nowrap ${state.currentView === 'history' ? 'bg-[var(--accent)] text-white shadow-md shadow-indigo-100' : 'pos-text-secondary hover:bg-black/5'}`}
          >
            訂單紀錄
          </button>
          
          {state.role === 'manager' && (
            <>
              <button 
                onClick={() => setView('analytics')}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all whitespace-nowrap ${state.currentView === 'analytics' ? 'bg-[var(--accent)] text-white shadow-md shadow-indigo-100' : 'pos-text-secondary hover:bg-black/5'}`}
              >
                營收報表
              </button>
              <button 
                onClick={() => setView('settings')}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all whitespace-nowrap ${state.currentView === 'settings' ? 'bg-[var(--accent)] text-white shadow-md shadow-indigo-100' : 'pos-text-secondary hover:bg-black/5'}`}
              >
                系統設定
              </button>
            </>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
        <div className="hidden xl:flex flex-col items-end mr-2">
          <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Real-time Clock</div>
          <div className="text-xs font-black font-mono text-slate-700 whitespace-nowrap">
            {formatTime(currentTime)}
          </div>
        </div>

        <button 
          onClick={onOpenTutorial}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-black bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all border border-indigo-100 shadow-sm whitespace-nowrap"
        >
          <BookOpen size={14} />
          使用教學
        </button>

        <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-black/5 rounded-full border pos-border">
          <div className="w-6 h-6 rounded-full bg-accent/20 border border-white flex items-center justify-center text-[10px] font-bold text-accent">
            {state.staffName.substring(0, 2).toUpperCase()}
          </div>
          <span className="text-xs font-medium pos-text-secondary">{state.staffName}</span>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-black/5 p-1 rounded-xl border pos-border">
            <select 
              value={state.fontSize}
              onChange={(e) => setFontSize(e.target.value as any)}
              className="bg-transparent text-[10px] font-black rounded-md px-2 py-1 outline-none appearance-none cursor-pointer hover:bg-black/5 transition-colors"
              title="調整字體大小"
            >
              <option value="small">小字</option>
              <option value="medium">中字</option>
              <option value="large">大字</option>
            </select>
            <div className="h-4 w-px bg-slate-200"></div>
            <select 
              value={state.theme}
              onChange={(e) => setTheme(e.target.value as any)}
              className="bg-transparent text-[10px] font-black rounded-md px-2 py-1 outline-none appearance-none cursor-pointer hover:bg-black/5 transition-colors"
              title="切換配色主題"
            >
              <option value="warm-retro">溫甜</option>
              <option value="soft-mint">薄荷</option>
              <option value="earth-neutral">中性</option>
            </select>
          </div>
          <button 
            onClick={logout}
            className="p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded-md transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};
