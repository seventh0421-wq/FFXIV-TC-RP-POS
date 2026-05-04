import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, CheckCircle } from 'lucide-react';
import { usePos } from '../context/PosContext';

export const AnnouncementModal: React.FC = () => {
  const { state } = usePos();
  const [isDismissed, setIsDismissed] = useState(false);
  const lastKnownLoginTime = useRef(state.lastLoginTime);

  // Reset dismissed state whenever a NEW login occurs
  useEffect(() => {
    if (state.lastLoginTime !== lastKnownLoginTime.current) {
      if (state.isLoggedIn && state.lastLoginTime > 0) {
        setIsDismissed(false);
      }
      lastKnownLoginTime.current = state.lastLoginTime;
    }
  }, [state.isLoggedIn, state.lastLoginTime]);

  const handleClose = () => {
    setIsDismissed(true);
  };

  // Condition for showing the modal: logged in, has message, and not yet dismissed in THIS session
  const showModal = state.isLoggedIn && state.announcement && state.announcement.trim() !== '' && !isDismissed;

  return (
    <AnimatePresence>
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="pos-card w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden bg-white border-8 border-indigo-600"
          >
            <div className="bg-indigo-600 p-8 text-white">
               <div className="flex items-center gap-3 mb-2">
                <Bell size={24} className="animate-bounce" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-70">Important Notice</span>
              </div>
              <h2 className="text-3xl font-black tracking-tight">店長上班公告</h2>
            </div>

            <div className="p-8 space-y-6">
              <div className="bg-indigo-50/50 rounded-3xl p-8 border-2 border-indigo-100 text-indigo-950 leading-relaxed font-black text-xl text-center">
                <p className="whitespace-pre-wrap">{state.announcement}</p>
              </div>

              <button
                onClick={handleClose}
                className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-[2rem] font-black text-lg uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-slate-200 flex items-center justify-center gap-3"
              >
                <CheckCircle size={24} />
                <span>知悉並關閉</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
