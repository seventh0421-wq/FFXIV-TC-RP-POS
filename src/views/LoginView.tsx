import React, { useState } from 'react';
import { usePos } from '../context/PosContext';
import { Sparkles, Crown, Key, LogIn, Store, Users, User, ShieldCheck, Rocket } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const DisclaimerContent: React.FC = () => (
    <div className="space-y-6 text-base text-slate-800 leading-relaxed max-h-[60vh] overflow-y-auto pr-4 font-black text-left">
      <section>
        <h4 className="font-black text-slate-900 mb-2">1. 非官方聲明與版權歸屬</h4>
        <p>本系統為玩家社群自製的第三方輔助工具，與《Final Fantasy XIV》開發商及發行商（Square Enix）無任何官方合作、贊助或從屬關係。系統內若涉及遊戲專有名詞（如 Gil、道具名稱等），其智慧財產權與版權皆歸屬原公司所有。</p>
      </section>
      <section>
        <h4 className="font-black text-slate-900 mb-2">2. 嚴禁現金交易 (RMT) 與規章遵守</h4>
        <p>本系統之設計初衷純為輔助 RP (Roleplay) 店家進行遊戲內虛擬貨幣（Gil）的記帳與勞務計算。開發者嚴格遵守《Final Fantasy XIV》服務條款，絕不支援、不鼓勵且不涉及任何形式的現金交易（Real Money Trading, RMT）。若使用者私下利用本系統進行違反遊戲規章之行為，所有衍生之遊戲帳號懲處或法律責任皆由使用者自行承擔，開發者概不負責，並保留隨時終止該店鋪使用本系統的權利。</p>
      </section>
      <section>
        <h4 className="font-black text-slate-900 mb-2">3. 資料安全與備份義務</h4>
        <p>本系統目前為無償提供之 Beta 測試版本，開發團隊會盡最大努力維護系統穩定，但無法保證伺服器 100% 無中斷或資料絕對不遺失。強烈建議店長於每日營業結束後，務必使用系統內建的「下載總表 (CSV)」功能備份帳務。若因網路波動、系統異常或不可抗力因素導致訂單或營收數據遺失，開發者無法提供任何遊戲內 Gil 或現實中之補償。</p>
      </section>
      <section>
        <h4 className="font-black text-slate-900 mb-2">4. 隱私保護與輸入規範</h4>
        <p>本系統專為虛擬角色扮演設計，請於設定員工名單、顧客名稱或登入系統時，僅輸入「遊戲內角色名稱」或「社群暱稱」。請絕對避免在本系統內輸入任何真實姓名、聯絡電話、身分證字號或真實財務帳戶等敏感個人資料。若因使用者自行輸入真實個資而導致外洩，開發者不承擔相關責任。</p>
      </section>
      <section>
        <h4 className="font-black text-slate-900 mb-2">5. 服務變更與終止</h4>
        <p>本系統為獨立開發之專案，開發者保留隨時修改功能、暫停或終止本服務之權利。若有重大系統更新、資料庫清理或終止服務之計畫，將盡可能提前於系統首頁或社群平台公告通知。</p>
      </section>
    </div>
  );

export const LoginView: React.FC = () => {
  const { state, setView, activateCode, setupShop, loginManager, loginStaff, resetSystem, linkExistingShop } = usePos();
  
  // Activation state
  const [activationCode, setActivationCode] = useState('');
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showManualLink, setShowManualLink] = useState(false);
  const [manualShopName, setManualShopName] = useState('');
  
  // Setup state
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);
  const [setupData, setSetupData] = useState({
    shopName: '',
    managerPassword: '',
    staffPassword: '',
  });

  const [error, setError] = useState('');
  const [loginTab, setLoginTab] = useState<'staff' | 'manager'>('staff');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginStaffName, setLoginStaffName] = useState('');

  const handleActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = await activateCode(activationCode);
    if (!result.success) setError(result.message);
  };

  const handleManualLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!manualShopName.trim()) {
      setError('請輸入店鋪名稱');
      return;
    }
    const success = await linkExistingShop(manualShopName);
    if (!success) setError('找不到名稱為「' + manualShopName + '」的店鋪，請確認名稱是否正確。');
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = await setupShop(setupData.shopName, setupData.managerPassword, setupData.staffPassword);
    if (!result.success) setError(result.message);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (loginTab === 'manager') {
      const result = await loginManager(loginPassword);
      if (!result.success) setError(result.message);
    } else {
      const result = await loginStaff(loginStaffName, loginPassword);
      if (!result.success) setError(result.message);
    }
  };

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // 1. Activation View
  if (state.systemStatus === 'activation') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600 rounded-full blur-[100px] animate-pulse delay-700" />
        </div>

        <div className="relative z-10 w-full max-w-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/10 shadow-2xl text-center"
          >
            <div className="w-20 h-20 bg-accent rounded-3xl flex items-center justify-center text-white mx-auto mb-8 shadow-xl shadow-accent/40 rotate-6">
              <Key size={40} />
            </div>
            <h1 className="text-4xl font-black text-white mb-2 tracking-tighter">
              {showManualLink ? '連結至店鋪' : '開通您的系統'}
            </h1>
            <p className="text-white/70 font-black mb-10 text-base uppercase tracking-widest text-xs">
              {showManualLink ? 'Link to Existing Shop Name' : 'Aether Connect POS Activation'}
            </p>

            <AnimatePresence mode="wait">
              {!showManualLink ? (
                <motion.form 
                  key="activation"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={handleActivation} 
                  className="space-y-4"
                >
                  <input 
                    type="text" 
                    placeholder="輸入開通碼 (例如: BETA-888)"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold text-center outline-none focus:border-accent transition-all placeholder:opacity-20"
                    value={activationCode}
                    onChange={(e) => setActivationCode(e.target.value)}
                  />
                  {error && <p className="text-red-400 text-xs font-bold">{error}</p>}
                  <button 
                    type="submit"
                    className="w-full bg-white text-slate-900 font-black py-4 rounded-2xl hover:bg-slate-100 transition-all active:scale-95 shadow-lg"
                  >
                    驗證開通
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setShowManualLink(true); setError(''); }}
                    className="text-xs font-black text-white/40 hover:text-white transition-colors"
                  >
                    已經開通過了？點選輸入店鋪名稱登入
                  </button>
                </motion.form>
              ) : (
                <motion.form 
                  key="manual-link"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={handleManualLink} 
                  className="space-y-4"
                >
                  <input 
                    type="text" 
                    placeholder="請輸入店鋪名稱 (例如: 示範用)"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold text-center outline-none focus:border-accent transition-all placeholder:opacity-20"
                    value={manualShopName}
                    onChange={(e) => setManualShopName(e.target.value)}
                  />
                  {error && <p className="text-red-400 text-xs font-bold">{error}</p>}
                  <button 
                    type="submit"
                    className="w-full bg-accent text-white font-black py-4 rounded-2xl hover:brightness-110 transition-all active:scale-95 shadow-lg"
                  >
                    搜尋並進入登入頁面
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setShowManualLink(false); setError(''); }}
                    className="text-xs font-black text-white/40 hover:text-white transition-colors"
                  >
                    返回開通頁面
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            <button 
              onClick={() => setView('admin')}
              className="mt-6 opacity-30 hover:opacity-100 text-xs text-white/60 font-black uppercase tracking-[0.3em] transition-all cursor-pointer py-2 px-4"
            >
              Master Control Access
            </button>
          </motion.div>

          <footer className="mt-8 text-center space-y-2 opacity-60 hover:opacity-100 transition-opacity">
            <p className="text-xs font-black text-white uppercase tracking-[0.3em]">作者：閻羅@奧汀</p>
            <button 
              onClick={() => setShowDisclaimer(true)}
              className="text-xs font-black text-white/80 hover:text-white underline decoration-accent/50 underline-offset-4"
            >
              檢視系統服務條款與免責聲明
            </button>
          </footer>
        </div>

        {/* Disclaimer Modal */}
        <AnimatePresence>
          {showDisclaimer && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowDisclaimer(false)}
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-2xl bg-white rounded-[3rem] p-10 shadow-2xl overflow-hidden"
              >
                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                  <ShieldCheck className="text-accent" /> 系統服務條款與免責聲明
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
  }

  // 2. Setup View
  if (state.systemStatus === 'setup') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <AnimatePresence mode="wait">
          {!hasAgreedToTerms ? (
            <motion.div 
              key="agreement"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-2xl bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-accent/10 text-accent rounded-2xl flex items-center justify-center">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900">系統服務條款</h2>
                  <p className="text-slate-600 font-black text-base uppercase tracking-widest">Terms of Service</p>
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-[2rem] p-8 mb-8 border border-slate-100">
                <DisclaimerContent />
              </div>

              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => setHasAgreedToTerms(true)}
                  className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-black transition-all active:scale-95 shadow-xl shadow-slate-900/20"
                >
                  本人已詳細閱讀並同意上述條款
                </button>
                <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  作者：閻羅@奧汀
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="setup-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-lg bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100"
            >
              <div className="flex items-center gap-4 mb-10">
                <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                  <Store size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">建立店鋪檔案</h2>
                  <p className="text-slate-400 font-bold text-sm">請完成初始帳號設定</p>
                </div>
              </div>

              <form onSubmit={handleSetup} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest opacity-70 px-1">店鋪名稱</label>
                  <input 
                    required
                    type="text" 
                    placeholder="例如：金碟咖啡廳"
                    className="w-full bg-slate-100 border-2 border-transparent focus:border-slate-900 rounded-2xl px-6 py-4 outline-none transition-all font-black text-lg"
                    value={setupData.shopName}
                    onChange={(e) => setSetupData({...setupData, shopName: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest opacity-70 px-1 flex items-center gap-1.5">
                       <Crown size={14} className="text-amber-600" /> 店長密碼
                    </label>
                    <input 
                      required
                      type="password" 
                      placeholder="******"
                      className="w-full bg-slate-100 border-2 border-transparent focus:border-slate-900 rounded-2xl px-6 py-4 outline-none transition-all font-black"
                      value={setupData.managerPassword}
                      onChange={(e) => setSetupData({...setupData, managerPassword: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest opacity-70 px-1 flex items-center gap-1.5">
                       <Users size={14} className="text-blue-600" /> 店員共用密碼
                    </label>
                    <input 
                      required
                      type="password" 
                      placeholder="******"
                      className="w-full bg-slate-100 border-2 border-transparent focus:border-slate-900 rounded-2xl px-6 py-4 outline-none transition-all font-black"
                      value={setupData.staffPassword}
                      onChange={(e) => setSetupData({...setupData, staffPassword: e.target.value})}
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-black transition-all active:scale-95 shadow-xl shadow-slate-900/20 flex items-center justify-center gap-3 mt-4"
                >
                  完成設定並開始營業 <Rocket size={20} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // 3. Login View
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] p-6 relative">
      <div className="w-full max-w-md space-y-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden"
        >
          <div className="bg-slate-900 p-10 text-center text-white relative">
            <div className="relative z-10">
              <h1 className="text-3xl font-black mb-1">{state.shopName || '乙太連線'}</h1>
              <p className="text-white/40 uppercase font-bold text-[10px] tracking-widest">Aether Connect Login</p>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          </div>

          <div className="flex border-b pos-border text-center">
            <button 
              onClick={() => { setLoginTab('staff'); setLoginPassword(''); setError(''); }}
              className={`flex-1 py-4 text-sm font-black uppercase tracking-widest transition-all ${loginTab === 'staff' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 opacity-70'}`}
            >
              店員登入
            </button>
            <button 
              onClick={() => { setLoginTab('manager'); setLoginPassword(''); setError(''); }}
              className={`flex-1 py-4 text-sm font-black uppercase tracking-widest transition-all ${loginTab === 'manager' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 opacity-70'}`}
            >
              店長登入
            </button>
          </div>

          <form onSubmit={handleLogin} className="p-10 space-y-6">
            <AnimatePresence mode="wait">
              {loginTab === 'staff' ? (
                <motion.div 
                  key="staff"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest opacity-70 px-1 flex items-center gap-1.5">
                      <User size={14} /> 您的角色名稱
                    </label>
                    {state.staffList && state.staffList.length > 0 ? (
                      <select
                        required
                        className="w-full bg-slate-100 border-2 border-transparent focus:border-slate-900 rounded-2xl px-6 py-4 outline-none transition-all font-black appearance-none cursor-pointer text-lg"
                        value={loginStaffName}
                        onChange={(e) => setLoginStaffName(e.target.value)}
                      >
                        <option value="">請選擇角色名稱</option>
                        {state.staffList.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    ) : (
                      <input 
                        required
                        type="text" 
                        placeholder="輸入暱稱"
                        className="w-full bg-slate-100 border-2 border-transparent focus:border-slate-900 rounded-2xl px-6 py-4 outline-none transition-all font-black text-lg"
                        value={loginStaffName}
                        onChange={(e) => setLoginStaffName(e.target.value)}
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest opacity-70 px-1 flex items-center gap-1.5">
                      <Key size={14} /> 店員共用密碼
                    </label>
                    <input 
                      required
                      type="password" 
                      placeholder="******"
                      className="w-full bg-slate-100 border-2 border-transparent focus:border-slate-900 rounded-2xl px-6 py-4 outline-none transition-all font-black text-lg"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="manager"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest opacity-70 px-1 flex items-center gap-1.5">
                      <ShieldCheck size={14} /> 店長專屬密碼
                    </label>
                    <input 
                      required
                      type="password" 
                      placeholder="******"
                      className="w-full bg-slate-100 border-2 border-transparent focus:border-slate-900 rounded-2xl px-6 py-4 outline-none transition-all font-black text-lg"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && <p className="text-red-500 text-center text-xs font-bold animate-pulse">{error}</p>}

            <button 
              type="submit"
              className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-slate-900/20 active:scale-95 mt-4"
            >
              登入系統
            </button>
          </form>
        </motion.div>

        <footer className="text-center space-y-2 opacity-60 hover:opacity-100 transition-opacity">
          <p className="text-xs font-black text-slate-900 uppercase tracking-[0.3em]">作者：閻羅@奧汀</p>
          <div className="flex flex-col items-center gap-2">
            <button 
              onClick={() => setShowDisclaimer(true)}
              className="text-xs font-black text-slate-600 hover:text-slate-900 underline decoration-slate-300 underline-offset-4"
            >
              檢視系統服務條款與免責聲明
            </button>
            {!showResetConfirm ? (
              <button 
                onClick={() => setShowResetConfirm(true)}
                className="text-xs font-black text-red-500/70 hover:text-red-600 transition-colors uppercase tracking-widest mt-2"
              >
                初始化系統連結
              </button>
            ) : (
              <div className="flex items-center gap-4 mt-2">
                <button 
                  onClick={() => {
                    resetSystem();
                    setShowResetConfirm(false);
                  }}
                  className="text-xs font-black text-red-600 underline underline-offset-4 uppercase tracking-widest"
                >
                  確認初始化
                </button>
                <button 
                  onClick={() => setShowResetConfirm(false)}
                  className="text-xs font-black text-slate-600 hover:text-slate-900 uppercase tracking-widest"
                >
                  取消
                </button>
              </div>
            )}
          </div>
        </footer>
      </div>

      <button 
        onClick={() => setView('admin')}
        className="fixed bottom-4 right-4 opacity-10 hover:opacity-100 text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] transition-opacity px-4 py-2 cursor-pointer"
      >
        Admin Panel
      </button>

      {/* Disclaimer Modal */}
      <AnimatePresence>
        {showDisclaimer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
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
                <ShieldCheck className="text-accent" /> 系統服務條款與免責聲明
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
