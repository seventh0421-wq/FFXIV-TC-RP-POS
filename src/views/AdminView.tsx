import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Lock, Search, RefreshCw, Plus, Trash2, CheckCircle2, XCircle, Store } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, getDocs, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';

export const AdminView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [codes, setCodes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const checkPassword = () => {
    if (password === '7736') {
      setIsAuthenticated(true);
      fetchCodes();
    } else {
      alert('密碼錯誤');
    }
  };

  const fetchCodes = async () => {
    setIsLoading(true);
    const path = 'activationCodes';
    try {
      const q = query(collection(db, path));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCodes(data);
    } catch (err: any) {
      console.error("Fetch Codes Error:", err);
      // We don't throw here to avoid global rejection handler in Admin View
      alert('連線資料庫失敗，請確認 Firebase 設定或網路連線。' + (err?.message || ''));
    } finally {
      setIsLoading(false);
    }
  };

  const generateCode = async () => {
    const code = `AETHER-${Math.floor(1000 + Math.random() * 9000)}`;
    const path = 'activationCodes';
    try {
      await addDoc(collection(db, path), {
        code,
        isUsed: false,
        createdAt: serverTimestamp(),
        storeName: '',
        usedAt: null
      });
      fetchCodes();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const deleteCode = async (id: string) => {
    if (!confirm('確定要刪除此開通碼嗎？')) return;
    const path = `activationCodes/${id}`;
    try {
      await deleteDoc(doc(db, 'activationCodes', id));
      fetchCodes();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-6 z-[2000]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-10 max-w-md w-full shadow-2xl space-y-8"
        >
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock size={32} />
            </div>
            <h2 className="text-3xl font-black text-slate-950">系統管理員驗證</h2>
            <p className="text-slate-600 text-base font-black">請輸入 4 位數授權密碼以進入後台</p>
          </div>

          <div className="space-y-4">
            <input 
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && checkPassword()}
              placeholder="••••"
              className="w-full h-20 text-center text-4xl font-black tracking-[1em] bg-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
            />
            <button 
              onClick={checkPassword}
              className="w-full bg-slate-900 text-white h-14 rounded-2xl font-black text-lg shadow-xl shadow-slate-200 transition-all active:scale-95"
            >
              進入管理系統
            </button>
            <button 
              onClick={onBack}
              className="w-full text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors"
            >
              返回登入頁
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-50 flex flex-col overflow-hidden">
      <header className="bg-white border-b px-8 py-6 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-950">POS 服務管理中心</h1>
            <p className="text-sm font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
              <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} /> 
              系統連線中 • 即時數據同步
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={generateCode}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
          >
            <Plus size={18} /> 產生新開通碼
          </button>
          <button 
            onClick={onBack}
            className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-sm"
          >
            退出
          </button>
        </div>
      </header>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                <Store size={24} />
              </div>
              <div>
                <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">總店鋪開通數</div>
                <div className="text-4xl font-black text-slate-950">{codes.filter(c => c.isUsed).length}</div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">可用配額</div>
                <div className="text-4xl font-black text-slate-950">{codes.filter(c => !c.isUsed).length}</div>
              </div>
            </div>
          </div>

          {/* List */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center">
              <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                授權序號列表 <span className="text-sm bg-slate-100 text-slate-600 px-3 py-1 rounded-full">{codes.length}</span>
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-xs uppercase font-black tracking-wider text-slate-600">
                    <th className="px-8 py-5">序號代碼</th>
                    <th className="px-8 py-5">狀態</th>
                    <th className="px-8 py-5">開通店鋪名稱</th>
                    <th className="px-8 py-5">使用日期</th>
                    <th className="px-8 py-5 text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {codes.map(code => (
                    <motion.tr layout key={code.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-5">
                        <span className="font-mono font-black text-indigo-600 text-sm tracking-wider">{code.code}</span>
                      </td>
                      <td className="px-8 py-5">
                        {code.isUsed ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-black">
                            <CheckCircle2 size={12} /> 已使用
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-300 text-xs font-black">
                            <XCircle size={12} /> 未使用
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-sm font-black text-slate-700">{code.storeName || '-'}</span>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-xs font-medium text-slate-400">
                          {code.usedAt ? new Date(code.usedAt.toDate()).toLocaleString() : '-'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <button 
                          onClick={() => deleteCode(code.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-rose-300 hover:bg-rose-50 hover:text-rose-600 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                  {codes.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3 grayscale opacity-20">
                          <Search size={48} />
                          <p className="font-black">目前尚無授權序號</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
