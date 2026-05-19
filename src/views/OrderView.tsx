import React, { useState } from 'react';
import { usePos } from '../context/PosContext';
import { Product, CartItem } from '../types';
import { Plus, Minus, Trash2, ClipboardCheck, ShoppingBag, Coffee, User, Edit3, CreditCard, Users, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const OrderView: React.FC = () => {
  const { state, createOrder, addCustomer } = usePos();
  const [selectedCategory, setSelectedCategory] = useState((state.categories || [])[0]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [customerInput, setCustomerInput] = useState('');
  const [isGroup, setIsGroup] = useState(false);
  const [headcount, setHeadcount] = useState(1);
  const [note, setNote] = useState('');
  
  // Quick-fill state for sub-customer
  const [activeSubCustomer, setActiveSubCustomer] = useState('');
  
  // Checkout Modal State
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'together' | 'separate'>('together');

  // Combo Selection Modal State
  const [comboBeingConfigured, setComboBeingConfigured] = useState<Product | null>(null);
  const [selectedComboSubItems, setSelectedComboSubItems] = useState<{ productName: string; quantity: number }[]>([]);

  const filteredProducts = (state.products || []).filter(p => p.category === selectedCategory);

  const addToCartWithCombo = (product: Product, subItems?: { productName: string; quantity: number }[]) => {
    const cartId = `${product.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setCart(prev => [...prev, { 
      ...product, 
      quantity: 1, 
      cartId, 
      itemNote: '', 
      subCustomer: activeSubCustomer,
      comboItems: subItems || product.comboItems 
    }]);
  };

  const handleProductClick = (product: Product) => {
    if (product.type === 'combo') {
      setComboBeingConfigured(product);
      setSelectedComboSubItems(product.comboItems || []);
    } else {
      addToCart(product);
    }
  };

  const confirmComboAdd = () => {
    if (comboBeingConfigured) {
      addToCartWithCombo(comboBeingConfigured, selectedComboSubItems);
      setComboBeingConfigured(null);
      setSelectedComboSubItems([]);
    }
  };

  const addToCart = (product: Product) => {
    const cartId = `${product.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setCart(prev => [...prev, { ...product, quantity: 1, cartId, itemNote: '', subCustomer: activeSubCustomer }]);
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartId === cartId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const updateItemNote = (cartId: string, note: string) => {
    setCart(prev => prev.map(item => 
      item.cartId === cartId ? { ...item, itemNote: note } : item
    ));
  };

  const updateSubCustomer = (cartId: string, subCustomer: string) => {
    setCart(prev => prev.map(item => 
      item.cartId === cartId ? { ...item, subCustomer } : item
    ));
  };

  const removeFromCart = (cartId: string) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Grouped Totals for Separate Billing
  const groupedItems = cart.reduce((acc, item) => {
    const key = item.subCustomer?.trim() || '未指定';
    if (!acc[key]) acc[key] = { total: 0, items: [] };
    acc[key].total += item.price * item.quantity;
    acc[key].items.push(item);
    return acc;
  }, {} as Record<string, { total: number, items: CartItem[] }>);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setIsCheckoutModalOpen(true);
  };

  const confirmCheckout = async () => {
    let targetCustomerId: string | undefined = undefined;
    
    // 處理客戶邏輯：如果輸入了名字
    if (customerInput.trim()) {
      const existingCustomer = (state.customers || []).find(c => 
        c.name === customerInput.trim() || c.id === customerInput.trim()
      );

      if (existingCustomer) {
        targetCustomerId = existingCustomer.id;
      }
    }

    const itemsStr = cart.map(item => {
      const customerPart = item.subCustomer ? `[${item.subCustomer}] ` : '';
      const notePart = item.itemNote ? ` (${item.itemNote})` : '';
      if (item.type === 'combo' && item.comboItems) {
        const details = item.comboItems.map(ci => `${ci.productName}x${ci.quantity}`).join(', ');
        return `${customerPart}${item.name}${notePart} (內含: ${details})x${item.quantity}`;
      }
      return `${customerPart}${item.name}${notePart}x${item.quantity}`;
    }).join(', ');

    const customerName = customerInput.trim() || '';
    
    // Auto-add new customer if needed
    if (customerName && !targetCustomerId) {
      const isKnownName = (state.customers || []).some(c => c.name === customerName);
      if (!isKnownName) {
        addCustomer({ name: customerName, notes: '系統自動登錄' });
      }
    }

    const customerStr = customerName ? `${customerName} 閣下` : '貴賓';
    const groupSuffix = isGroup ? ` (👥 ${headcount}人)` : '';
    const noteSuffix = note.trim() ? ` (備註: ${note.trim()})` : '';
    
    // Split macro generation
    let macro = '';
    if (paymentMode === 'together') {
      macro = `歡迎光臨！${customerStr}${groupSuffix}，您的餐點：${itemsStr}，總計 ${total.toLocaleString()} Gil。${noteSuffix}感謝您的惠顧！`;
    } else {
      const splitDetail = Object.entries(groupedItems)
        .map(([name, data]: [string, any]) => `${name} ${data.total.toLocaleString()} Gil`)
        .join(', ');
      macro = `歡迎光臨！${customerStr}${groupSuffix}。本桌總計 ${total.toLocaleString()} Gil。各自結帳明細：${splitDetail}。請依序與我交易，感謝！`;
    }

    try {
      await navigator.clipboard.writeText(macro);
      await createOrder(cart, targetCustomerId, isGroup, headcount, note, customerInput.trim());
      
      // Discord Notification
      if (state.discordWebhookUrl) {
        let discordContent = `🔔 **新訂單通知**
**付款模式：** ${paymentMode === 'together' ? '📝 合併買單' : '👥 分開結帳'}
**接單外場：** ${state.staffName}
**顧客名稱：** ${customerInput.trim() || '（無設定）'}${isGroup ? ` (👥 團體客: ${headcount}人)` : ''}
${note.trim() ? `**📝 備註：** ${note.trim()}\n` : ''}**明細：**

${cart.map(item => {
  const customerPart = item.subCustomer ? `**[${item.subCustomer}]** ` : '';
  const notePart = item.itemNote ? ` *(${item.itemNote})*` : '';
  if (item.type === 'combo' && item.comboItems) {
    const details = item.comboItems.map(ci => `${ci.productName}x${ci.quantity}`).join(', ');
    return `${customerPart}${item.name}${notePart} (內含: ${details}) x ${item.quantity}`;
  }
  return `${customerPart}${item.name}${notePart} x ${item.quantity}`;
}).join('\n\n')}

**總計：** **${total.toLocaleString()} Gil**`;

        if (paymentMode === 'separate') {
          discordContent += `\n\n**💰 各自付款明細：**\n` + Object.entries(groupedItems)
            .map(([name, data]: [string, any]) => `• ${name}: ${data.total.toLocaleString()} Gil`)
            .join('\n');
        }

        fetch(state.discordWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: discordContent }),
        }).catch(err => console.error('Discord Push Failed:', err));
      }

      setCart([]);
      setCustomerInput('');
      setIsGroup(false);
      setHeadcount(1);
      setNote('');
      setActiveSubCustomer('');
      setIsCheckoutModalOpen(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error('Failed to complete checkout!', err);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar Categories */}
      <aside className="w-44 bg-white border-r pos-border flex flex-col py-4 gap-1">
        <div className="px-4 mb-2 text-xs font-black pos-text-secondary uppercase tracking-widest">目錄分類</div>
        {state.categories && state.categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`mx-2 px-4 py-3 rounded-lg text-sm font-medium text-left transition-all ${
              selectedCategory === cat 
              ? 'pos-btn-primary text-white shadow-md' 
              : 'pos-text-secondary hover:bg-black/5'
            }`}
          >
            {cat}
          </button>
        ))}
        <div className="mt-auto px-4 py-4">
          <div className="p-3 bg-black/5 rounded-xl border border-dashed pos-border">
            <div className="text-xs pos-text-secondary mb-1">乙太連線狀態</div>
            <div className="text-sm font-mono font-black text-emerald-600">穩定連線中</div>
          </div>
        </div>
      </aside>

      {/* Main Grid */}
      <section className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 p-6 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto content-start">
          {filteredProducts.map(product => (
            <motion.button
              whileTap={{ scale: 0.95 }}
              key={product.id}
              onClick={() => handleProductClick(product)}
              className={`group pos-card p-4 rounded-2xl shadow-sm hover:shadow-md transition-all text-left flex flex-col gap-3 relative ${product.type === 'combo' ? 'ring-2 ring-amber-400/50 bg-amber-50/10' : ''}`}
            >
              {product.type === 'combo' && (
                <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-amber-400 text-white text-[10px] font-black rounded shadow-sm z-10 uppercase tracking-widest"> 套餐 </div>
              )}
              <div className="w-full aspect-square bg-black/5 rounded-xl flex items-center justify-center relative overflow-hidden">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <ShoppingBag className="w-8 h-8 opacity-20 group-hover:scale-110 transition-transform" />
                )}
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-white/80 backdrop-blur rounded text-xs font-black border pos-border price-tag">
                  {product.price.toLocaleString()}G
                </div>
              </div>
                <div>
                  <div className="font-black text-lg leading-tight group-hover:text-accent transition-colors line-clamp-1">
                    {product.name}
                  </div>
                  <div className="text-sm pos-text-secondary">
                    {product.type === 'combo' ? (
                      <span className="text-amber-600 font-bold">精選超值組合</span>
                    ) : (
                      "精選品項"
                    )}
                  </div>
                </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Right: Cart */}
      <aside className="w-84 border-l pos-border flex flex-col pos-card relative shadow-2xl">
        <div className="p-4 border-b pos-border bg-black/5 flex items-center justify-between">
          <h2 className="font-black text-base flex items-center gap-2">
            當前點單
            <span className="px-2 py-0.5 bg-accent text-white text-xs rounded-full">{cart.length}</span>
          </h2>
          <button 
            onClick={() => setCart([])}
            className="text-xs text-rose-600 font-black hover:underline"
          >
            清除全部
          </button>
        </div>

        {/* Customer Input (Improved to handle new names) */}
        <div className="p-3 border-b pos-border bg-yellow-50/50 space-y-3">
          <div className="relative group">
            <input
              type="text"
              list="customer-list"
              value={customerInput}
              onChange={(e) => setCustomerInput(e.target.value)}
              placeholder="輸入客名或 ID (新客將自動登錄)"
              className="w-full bg-white border pos-border rounded-lg px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-accent/20 font-bold"
            />
            <datalist id="customer-list">
              {(state.customers || []).map(c => (
                <option key={c.id} value={c.name}>{c.id}</option>
              ))}
            </datalist>
            {!(state.customers || []).find(c => c.name === customerInput) && customerInput.trim() && (
              <div className="absolute -top-6 left-0 text-[9px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded animate-pulse">
                ✨ 偵測到新客：結帳後將自動登錄
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${isGroup ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300 group-hover:border-indigo-400'}`}>
                  <input 
                    type="checkbox" 
                    checked={isGroup} 
                    onChange={e => {
                      const checked = e.target.checked;
                      setIsGroup(checked);
                      if (checked && headcount === 1) setHeadcount(2);
                    }} 
                    className="hidden"
                  />
                  {isGroup && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-700">團體客模式</span>
              </label>
              
              <AnimatePresence>
                {isGroup && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-500">人數</span>
                      <input 
                        type="number" 
                        min="1"
                        value={headcount}
                        onChange={e => setHeadcount(parseInt(e.target.value) || 1)}
                        className="w-16 bg-white border pos-border rounded px-2 py-1 text-sm font-black text-center"
                      />
                    </div>
                    
                    <div className="bg-indigo-50/50 rounded-xl p-3 border border-indigo-100/50">
                      <div className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-1 flex justify-between">
                        <span>當前點餐對象 (自動帶入)</span>
                        {activeSubCustomer && (
                          <button onClick={() => setActiveSubCustomer('')} className="text-rose-500 hover:text-rose-600">清除</button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-indigo-400" />
                        <input 
                          type="text"
                          value={activeSubCustomer}
                          onChange={(e) => setActiveSubCustomer(e.target.value)}
                          placeholder="輸入姓名或點選編號..."
                          className="flex-1 bg-transparent border-none p-0 text-sm font-black text-indigo-700 placeholder:text-indigo-300 outline-none"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative group">
              <textarea 
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="訂單備註 (例如: 少冰、要求特定服務...)"
                rows={2}
                className="w-full bg-white/50 border border-dashed pos-border rounded-lg px-3 py-2 text-[11px] outline-none focus:bg-white focus:border-indigo-300 transition-all resize-none font-medium"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          <AnimatePresence>
            {cart.map((item) => (
              <motion.div
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                key={item.cartId}
                className="bg-white border pos-border rounded-xl p-3 space-y-2 shadow-sm"
              >
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 bg-black/5 rounded-lg flex items-center justify-center text-sm overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <Coffee size={18} className="opacity-40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-black truncate">{item.name}</div>
                    <div className="text-xs pos-text-secondary flex items-center gap-1.5 mt-0.5">
                      <button onClick={() => updateQuantity(item.cartId, -1)} className="hover:text-accent w-5 h-5 bg-slate-100 rounded flex items-center justify-center font-black">－</button>
                      <span className="font-black text-sm">x {item.quantity}</span>
                      <button onClick={() => updateQuantity(item.cartId, 1)} className="hover:text-accent w-5 h-5 bg-slate-100 rounded flex items-center justify-center font-black">＋</button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="text-sm font-mono font-black text-slate-900">
                      {(item.price * item.quantity).toLocaleString()}G
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.cartId)}
                      className="text-rose-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-dashed pos-border space-y-1.5">
                  <div className="flex gap-1.5">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none opacity-30">
                        <User size={10} />
                      </div>
                      <input 
                        type="text"
                        value={item.subCustomer || ''}
                        onChange={(e) => updateSubCustomer(item.cartId, e.target.value)}
                        placeholder="顧客 ID / 姓名..."
                        className="w-full bg-slate-50 border-none rounded-lg pl-6 pr-2 py-2 text-xs font-black placeholder:opacity-60 outline-none focus:bg-indigo-50 transition-colors"
                      />
                    </div>
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none opacity-40">
                        <Edit3 size={12} />
                      </div>
                      <input 
                        type="text"
                        value={item.itemNote || ''}
                        onChange={(e) => updateItemNote(item.cartId, e.target.value)}
                        placeholder="單品備註..."
                        className="w-full bg-slate-50 border-none rounded-lg pl-6 pr-2 py-2 text-xs font-black placeholder:opacity-60 outline-none focus:bg-indigo-50 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-30 gap-2 py-10">
              <ShoppingBag size={48} />
              <p className="text-xs font-medium">購物車目前空空如也</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t pos-border bg-black/5">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-black text-slate-600">小計</span>
            <span className="text-sm font-mono font-black text-slate-900">{total.toLocaleString()}G</span>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-base font-black text-slate-950">結帳總計</span>
            <span className="text-3xl font-mono font-black text-accent underline decoration-accent/20 decoration-2 price-tag">
              {total.toLocaleString()}G
            </span>
          </div>
          
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full py-4 pos-btn-primary rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            結帳並生成巨集
            <span className="px-1.5 py-0.5 bg-white/20 rounded text-[9px] font-mono tracking-tighter opacity-70 group-hover:opacity-100 transition-opacity">
              複製成功
            </span>
          </button>
        </div>

        {/* Toast Overlay */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-4 left-4 right-4 bg-slate-900 border border-white/10 text-white px-4 py-3 rounded-lg flex items-center gap-3 shadow-xl z-50 overflow-hidden"
            >
              <div className="w-5 h-5 bg-emerald-500 rounded-full flex-shrink-0 flex items-center justify-center text-[10px]">
                <ClipboardCheck size={12} />
              </div>
              <div className="flex-1">
                <div className="text-[11px] font-bold">巨集已生成！</div>
                <div className="text-[9px] opacity-60">已複製到剪貼簿。請在遊戲對話框貼上。</div>
              </div>
              <motion.div 
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 3 }}
                className="absolute bottom-0 left-0 h-1 bg-accent w-full origin-left"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </aside>

      {/* Checkout Selection Modal */}
      <AnimatePresence>
        {isCheckoutModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCheckoutModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-black text-slate-800">選擇結帳方式</h3>
                  <button onClick={() => setIsCheckoutModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <button 
                    onClick={() => setPaymentMode('together')}
                    className={`flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all gap-3 ${
                      paymentMode === 'together' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    <CreditCard size={32} />
                    <span className="font-black text-sm uppercase tracking-widest">合併買單</span>
                  </button>
                  <button 
                    onClick={() => setPaymentMode('separate')}
                    className={`flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all gap-3 ${
                      paymentMode === 'separate' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    <Users size={32} />
                    <span className="font-black text-sm uppercase tracking-widest">各自結帳</span>
                  </button>
                </div>

                <div className="bg-slate-50 rounded-3xl p-6 space-y-4">
                  {paymentMode === 'together' ? (
                    <div className="text-center py-4">
                      <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">應付總額</div>
                      <div className="text-4xl font-black text-slate-800 font-mono">{total.toLocaleString()} <span className="text-xl">G</span></div>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">各自應付明細</div>
                      {Object.entries(groupedItems).map(([name, data]: [string, any]) => (
                        <div key={name} className="flex justify-between items-center bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                          <span className="font-black text-xs text-slate-700">{name}</span>
                          <span className="font-black text-sm text-indigo-600 font-mono">{data.total.toLocaleString()} G</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button 
                  onClick={confirmCheckout}
                  className="w-full bg-slate-900 text-white hover:bg-black py-5 rounded-3xl font-black text-lg shadow-xl shadow-slate-200 transition-all active:scale-95 flex items-center justify-center gap-3 mt-8"
                >
                  <ClipboardCheck size={24} />
                  確認結帳並出單
                </button>
                
                <p className="text-center text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-widest">
                  結帳後將自動複製巨集並推播至 Discord
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Combo Configuration Modal */}
      <AnimatePresence>
        {comboBeingConfigured && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setComboBeingConfigured(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 bg-amber-50 border-b border-amber-100 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black text-slate-800">
                    配置套餐：{comboBeingConfigured.name}
                  </h3>
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mt-1">
                    您可以自由增減套餐內的品項，或從下方追加任何單品
                  </p>
                </div>
                <button onClick={() => setComboBeingConfigured(null)} className="text-slate-400 hover:text-slate-600 p-2">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Selected Items */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b pb-2 flex justify-between items-center">
                    <span>已選擇的內容</span>
                    <span className="text-indigo-600">{selectedComboSubItems.length} 項</span>
                  </h4>
                  <div className="space-y-2">
                    {selectedComboSubItems.map((ci, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                        <span className="font-black text-sm text-slate-800 truncate flex-1">{ci.productName}</span>
                        <div className="flex items-center gap-3 ml-2">
                          <button 
                            onClick={() => {
                              if (ci.quantity > 1) {
                                setSelectedComboSubItems(selectedComboSubItems.map((item, i) => i === idx ? { ...item, quantity: item.quantity - 1 } : item));
                              } else {
                                setSelectedComboSubItems(selectedComboSubItems.filter((_, i) => i !== idx));
                              }
                            }}
                            className="w-7 h-7 bg-white rounded-lg flex items-center justify-center font-bold text-indigo-400 shadow-sm border border-indigo-100"
                          >-</button>
                          <span className="font-black text-sm min-w-[20px] text-center">{ci.quantity}</span>
                          <button 
                            onClick={() => setSelectedComboSubItems(selectedComboSubItems.map((item, i) => i === idx ? { ...item, quantity: item.quantity + 1 } : item))}
                            className="w-7 h-7 bg-white rounded-lg flex items-center justify-center font-bold text-indigo-400 shadow-sm border border-indigo-100"
                          >+</button>
                        </div>
                      </div>
                    ))}
                    {selectedComboSubItems.length === 0 && (
                      <div className="py-10 text-center opacity-20 border-2 border-dashed rounded-3xl flex flex-col items-center gap-2">
                        <ShoppingBag size={32} />
                        <span className="text-xs font-bold uppercase tracking-widest">尚未選擇任何內容</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Available Items */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b pb-2">可追加品項 (料理與服務)</h4>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {state.products.filter(p => p.type !== 'combo').map(p => {
                      const isAdded = selectedComboSubItems.some(ci => ci.productName === p.name);
                      return (
                        <button 
                          key={p.id}
                          onClick={() => {
                            if (isAdded) {
                              setSelectedComboSubItems(selectedComboSubItems.map(ci => ci.productName === p.name ? { ...ci, quantity: ci.quantity + 1 } : ci));
                            } else {
                              setSelectedComboSubItems([...selectedComboSubItems, { productName: p.name, quantity: 1 }]);
                            }
                          }}
                          className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-transparent hover:border-slate-200 transition-all text-left"
                        >
                          <div>
                            <div className="font-bold text-sm text-slate-700">{p.name}</div>
                            <div className="text-[10px] font-black opacity-30 uppercase">{p.category}</div>
                          </div>
                          <Plus size={16} className="text-slate-300" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t flex gap-4">
                <button 
                  onClick={() => setComboBeingConfigured(null)}
                  className="px-8 py-4 bg-white border pos-border rounded-2xl font-black text-sm text-slate-500 hover:bg-slate-100 transition-all uppercase tracking-widest"
                >
                  取消
                </button>
                <button 
                  onClick={confirmComboAdd}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                >
                  <ClipboardCheck size={20} />
                  確認配置並加入購物車
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
