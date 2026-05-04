import React from 'react';
import { usePos } from '../context/PosContext';
import { CheckCircle, Clock, User, Plus, Minus, ChefHat } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const KitchenView: React.FC = () => {
  const { state, completeOrder } = usePos();

  const pendingOrders = (state.orders || []).filter(o => o.status === 'pending');
  const completedOrders = (state.orders || []).filter(o => o.status === 'completed');

    const OrderCard: React.FC<{ order: any, showAction?: boolean }> = ({ order, showAction = false }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`pos-card rounded-2xl transition-all cursor-pointer hover:ring-2 hover:ring-indigo-100/50 relative overflow-hidden group ${
          isExpanded 
            ? 'shadow-xl ring-2 ring-indigo-200 p-6' 
            : 'bg-white/80 p-3 shadow-sm'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-center relative z-10 w-full">
          <div className="flex items-center gap-3">
            <span className={`font-black tracking-tighter text-slate-800 transition-all ${isExpanded ? 'text-2xl' : 'text-lg'}`}>
              #{order.id.slice(-4).toUpperCase()}
            </span>
            
            {!isExpanded && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md uppercase">
                  {order.totalItems || order.items.length}P
                </span>
                {order.customerName && (
                  <span className="text-[10px] font-black text-slate-400 truncate max-w-[80px]">
                    {order.customerName}
                  </span>
                )}
                {order.isGroup && (
                  <span className="text-[11px] font-black text-amber-600">
                    👥{order.headcount}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1 font-mono font-black uppercase tracking-tight text-slate-400 ${isExpanded ? 'text-xs bg-slate-50 px-2 py-1 rounded-md' : 'text-[10px]'}`}>
              <Clock size={isExpanded ? 12 : 10} />
              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${isExpanded ? 'bg-indigo-600 text-white rotate-180' : 'bg-slate-100 text-slate-300'}`}>
              <Plus size={12} />
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-5 space-y-4 pt-4 border-t border-dashed pos-border">
                {order.customerName && (
                  <div className="flex items-center gap-2">
                     <span className="text-xs font-black text-slate-900 flex items-center gap-1 bg-white px-2 py-1 rounded-lg border pos-border shadow-sm">
                      <User size={12} className="text-indigo-400" /> {order.customerName}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span className="flex items-center gap-1.5"><ChefHat size={12} /> 服務員: {order.staffName}</span>
                  {order.isGroup && (
                     <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
                      👥 同行人數: {order.headcount}
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {order.items.map((item: any, idx: number) => (
                    <div key={idx} className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="font-black text-base text-slate-800">
                            {item.subCustomer && (
                              <span className="text-indigo-600 mr-2 text-sm">@{item.subCustomer}</span>
                            )}
                            {item.name}
                          </span>
                          {item.itemNote && (
                            <div className="text-xs font-black text-slate-500 mt-1 pl-3 border-l-2 border-indigo-200">
                              ↳ {item.itemNote}
                            </div>
                          )}
                        </div>
                        <span className="font-black bg-indigo-600 text-white px-3 py-1 rounded-xl min-w-[44px] text-center text-xs shadow-sm">x {item.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {order.note && (
                  <div className="p-4 bg-amber-50/70 border border-amber-200/50 rounded-[24px]">
                    <div className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2 flex items-center gap-1.5">
                      📝 客戶特別要求
                    </div>
                    <div className="text-sm font-black text-amber-950 leading-relaxed italic">
                      「{order.note}」
                    </div>
                  </div>
                )}

                <div className="pt-4 flex justify-between items-center border-t border-dashed pos-border mt-2">
                  <span className="text-[11px] text-slate-300 font-mono font-black tracking-widest">{order.id}</span>
                  {showAction && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        completeOrder(order.id);
                      }}
                      className="bg-slate-900 hover:bg-black text-white p-3 rounded-[20px] transition-all active:scale-90 shadow-xl shadow-slate-200 flex items-center gap-2 px-6"
                    >
                      <CheckCircle size={18} />
                      <span className="text-sm font-black uppercase tracking-widest">完成出餐</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-64px)] overflow-hidden">
      {/* Pending Column */}
      <div className="flex flex-col gap-6 overflow-hidden">
        <h2 className="text-xl font-black flex items-center gap-3 text-slate-800 px-2">
          <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span>
          待處理訂單
          <span className="bg-amber-500 text-white text-[11px] font-black px-3 py-0.5 rounded-full shadow-lg shadow-amber-200/50">
            {pendingOrders.length}
          </span>
        </h2>
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 pr-2 scrollbar-hide">
          <AnimatePresence mode="popLayout">
            {pendingOrders.map(order => (
              <OrderCard key={order.id} order={order} showAction />
            ))}
          </AnimatePresence>
          {pendingOrders.length === 0 && (
            <div className="col-span-full h-full flex flex-col items-center justify-center opacity-10 py-20">
              <ChefHat size={80} />
              <p className="text-lg font-black mt-4 uppercase tracking-[0.4em]">暫無待處理訂單</p>
            </div>
          )}
        </div>
      </div>

      {/* Completed Column */}
      <div className="flex flex-col gap-6 overflow-hidden border-l border-dashed pos-border pl-6">
        <h2 className="text-xl font-black flex items-center gap-3 text-slate-400 px-2 uppercase tracking-tight">
          <span className="w-1.5 h-6 bg-slate-300 rounded-full"></span>
          今日已出餐
          <span className="bg-slate-200 text-slate-500 text-[10px] font-black px-2.5 py-0.5 rounded-full">
            {completedOrders.length}
          </span>
        </h2>
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 pr-2 opacity-60 grayscale hover:grayscale-0 transition-all scrollbar-hide">
          <AnimatePresence>
            {completedOrders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
