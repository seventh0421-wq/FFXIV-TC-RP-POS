import React, { useState } from 'react';
import { usePos } from '../context/PosContext';
import { Search, Calendar, User, ShoppingBag, ReceiptText, Trash2, Edit3, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order } from '../types';

export const HistoryView: React.FC = () => {
  const { state, deleteOrder, updateOrder } = usePos();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const completedOrders = (state.orders || [])
    .filter(o => o.status === 'completed')
    .filter(o => 
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.customerId && (state.customers || []).find(c => c.id === o.customerId)?.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  const handleUpdate = () => {
    if (editingOrder) {
      updateOrder(editingOrder);
      setEditingOrder(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-64px)] flex flex-col gap-6 overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ReceiptText className="text-accent" />
            訂單歷史紀錄
          </h1>
          <p className="text-sm pos-text-secondary">查看與管理所有已完成的冒險者交易</p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={18} />
          <input 
            type="text"
            placeholder="搜尋單號、店員或客情..."
            className="w-full pl-10 pr-4 py-2 bg-white border pos-border rounded-xl outline-none focus:ring-2 focus:ring-accent/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="pos-card rounded-2xl overflow-hidden flex-1 flex flex-col border pos-border shadow-sm">
        <div className="overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-black/5 z-10">
              <tr className="text-xs font-black uppercase tracking-wider pos-text-secondary border-b pos-border text-slate-600">
                <th className="px-6 py-5">交易單號</th>
                <th className="px-6 py-5">時間</th>
                <th className="px-6 py-5">對應客情</th>
                <th className="px-6 py-5">經手店員</th>
                <th className="px-6 py-5">明細</th>
                <th className="px-6 py-5 text-right">總計</th>
                <th className="px-6 py-5 text-center">管理</th>
              </tr>
            </thead>
            <tbody className="divide-y pos-border bg-white">
              <AnimatePresence mode="popLayout">
                {completedOrders.map((order) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -20 }}
                    key={order.id} 
                    className="hover:bg-slate-50 transition-colors text-sm"
                  >
                    <td className="px-6 py-4 font-mono font-bold text-accent order-id">{order.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-black text-sm">{new Date(order.createdAt).toLocaleDateString()}</span>
                        <span className="text-xs font-black text-slate-500">{new Date(order.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {order.customerId ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-xs font-black text-accent">
                            {state.customers.find(c => c.id === order.customerId)?.name.substring(0, 1)}
                          </div>
                          <span className="font-black text-sm">{state.customers.find(c => c.id === order.customerId)?.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm font-black italic opacity-40">散客</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-slate-900">{order.staffName}</td>
                    <td className="px-6 py-4">
                      <div className="max-w-[200px] truncate opacity-70">
                        {order.items.map(i => `${i.subCustomer ? `[${i.subCustomer}]` : ''}${i.name}${i.itemNote ? `(${i.itemNote})` : ''}x${i.quantity}`).join(', ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold price-tag text-lg">
                      {order.total.toLocaleString()}G
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => setEditingOrder(order)}
                          className="p-2 hover:bg-blue-50 text-blue-500 rounded-lg transition-colors"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirmId(order.id)}
                          className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {completedOrders.length === 0 && (
            <div className="p-20 flex flex-col items-center justify-center opacity-20 gap-4">
              <ShoppingBag size={48} />
              <p className="font-medium text-lg">查為訂單紀錄</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="pos-card w-full max-w-sm rounded-[2rem] shadow-2xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2 text-slate-900">確定刪除訂單？</h3>
              <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                交易單號: <span className="font-mono font-bold text-red-500">{deleteConfirmId}</span><br/>
                此操作將永久刪除該筆紀錄，且不可恢復。
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    deleteOrder(deleteConfirmId);
                    setDeleteConfirmId(null);
                  }}
                  className="flex-1 bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-900/10"
                >
                  確認刪除
                </button>
                <button 
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-6 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                >
                  取消
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="pos-card w-full max-w-md rounded-2xl shadow-2xl p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Edit3 size={24} className="text-accent" />
                  編輯訂單 {editingOrder.id}
                </h2>
                <button onClick={() => setEditingOrder(null)} className="p-2 hover:bg-black/5 rounded-full"><X size={20}/></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase opacity-50 mb-1">店員名稱</label>
                  <input 
                    type="text" 
                    className="w-full bg-black/5 border pos-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
                    value={editingOrder.staffName}
                    onChange={e => setEditingOrder({ ...editingOrder, staffName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase opacity-50 mb-1">對應客情 ID</label>
                  <select 
                    className="w-full bg-black/5 border pos-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
                    value={editingOrder.customerId || ''}
                    onChange={e => setEditingOrder({ ...editingOrder, customerId: e.target.value || undefined })}
                  >
                    <option value="">散客</option>
                    {state.customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase opacity-50 mb-1">總金額 (G)</label>
                  <input 
                    type="number" 
                    className="w-full bg-black/5 border pos-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
                    value={editingOrder.total}
                    onChange={e => setEditingOrder({ ...editingOrder, total: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button 
                  onClick={handleUpdate}
                  className="flex-1 pos-btn-primary py-4 rounded-xl font-bold transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  儲存修正
                </button>
                <button 
                  onClick={() => setEditingOrder(null)}
                  className="px-6 py-4 bg-black/5 rounded-xl font-medium hover:bg-black/10 transition-colors"
                >
                  取消
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
