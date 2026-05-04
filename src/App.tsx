import React from 'react';
import { PosProvider, usePos } from './context/PosContext';
import { ThemeWrapper, Navigation } from './components/Layout';
import { AnnouncementModal } from './components/AnnouncementModal';
import { LoginView } from './views/LoginView';
import { OrderView } from './views/OrderView';
import { KitchenView } from './views/KitchenView';
import { HistoryView } from './views/HistoryView';
import { AnalyticsView } from './views/AnalyticsView';
import { SettingsView } from './views/SettingsView';
import { AdminView } from './views/AdminView';

const POSContent: React.FC = () => {
  const { state, setView } = usePos();
  const [initError, setInitError] = React.useState<string | null>(null);
  const [isTutorialOpen, setIsTutorialOpen] = React.useState(false);

  React.useEffect(() => {
    // Catch global unhandled rejections which our handleFirestoreError throws
    const handleError = (event: PromiseRejectionEvent) => {
      try {
        const errorData = JSON.parse(event.reason.message);
        if (errorData.error.includes('offline')) {
          setInitError("無法連線至資料庫，請檢查您的網路狀態。");
        }
      } catch (e) {
        // Not one of our handled errors
      }
    };

    window.addEventListener('unhandledrejection', handleError);
    return () => window.removeEventListener('unhandledrejection', handleError);
  }, []);

  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6 text-center">
        <div className="bg-white/10 backdrop-blur-xl p-10 rounded-[3rem] border border-white/10 max-w-sm">
          <div className="w-20 h-20 bg-red-500/20 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">!</span>
          </div>
          <h2 className="text-xl font-black text-white mb-4">系統限制 / 連線錯誤</h2>
          <p className="text-white/60 text-sm leading-relaxed mb-8">
            {initError}
            <br /><br />
            如果問題持續發生，請確認您的 Firebase 服務已正確啟用。
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-white text-slate-900 font-black py-4 rounded-2xl hover:bg-slate-100 transition-all font-sans"
          >
            重新整理
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pos-app">
      <AnnouncementModal key={state.isLoggedIn ? `in-${state.announcement}` : 'out'} />
      {state.currentView === 'admin' ? (
        <AdminView onBack={() => setView('order')} />
      ) : !state.isLoggedIn || state.systemStatus !== 'dashboard' ? (
        <LoginView />
      ) : (
        <ThemeWrapper isTutorialOpen={isTutorialOpen} setIsTutorialOpen={setIsTutorialOpen}>
          <div className="flex flex-col min-h-screen">
            <Navigation onOpenTutorial={() => setIsTutorialOpen(true)} />
            <main className="flex-1 overflow-hidden">
              {state.currentView === 'order' && <OrderView />}
              {state.currentView === 'kitchen' && <KitchenView />}
              {state.currentView === 'history' && <HistoryView />}
              {state.currentView === 'analytics' && <AnalyticsView />}
              {state.currentView === 'settings' && <SettingsView />}
            </main>
          </div>
        </ThemeWrapper>
      )}
    </div>
  );
};

export default function App() {
  return (
    <PosProvider>
      <POSContent />
    </PosProvider>
  );
}
