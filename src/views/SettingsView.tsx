import React, { useState } from 'react';
import { usePos } from '../context/PosContext';
import { Plus, Save, Trash2, Tag, Edit3, ShieldCheck, Key, Crown, Users, Check, Bell, Link, Send, Upload, AlertCircle, FileText, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const SettingsView: React.FC = () => {
  const { 
    state, addProduct, updateProduct, deleteProduct, 
    bulkAddProducts, updatePasswords, resetSystem, 
    updateStaffList, updateDiscordWebhookUrl, setFontSize, 
    setTheme, updateAnnouncement, updateCategories 
  } = usePos();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Category Management State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategoryIndex, setEditingCategoryIndex] = useState<number | null>(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleUpdateCategory = async () => {
    if (editingCategoryIndex !== null && editingCategoryValue.trim()) {
      const updated = [...state.categories];
      updated[editingCategoryIndex] = editingCategoryValue.trim();
      await updateCategories(updated);
      setEditingCategoryIndex(null);
    }
  };

  const handleDeleteCategory = async (index: number) => {
    const updated = state.categories.filter((_, i) => i !== index);
    await updateCategories(updated);
  };

  const handleMoveCategory = async (index: number, direction: 'up' | 'down') => {
    const updated = [...state.categories];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < updated.length) {
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      await updateCategories(updated);
    }
  };

  const handleAddCategory = async () => {
    if (newCategoryName.trim() && !state.categories.includes(newCategoryName.trim())) {
      await updateCategories([...state.categories, newCategoryName.trim()]);
      setNewCategoryName('');
    }
  };
  
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  
  // Bulk Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  // Discord Webhook State
  const [discordUrl, setDiscordUrl] = useState(state.discordWebhookUrl || '');
  const [isTestingDiscord, setIsTestingDiscord] = useState(false);
  const [discordStatus, setDiscordStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showDiscordHelp, setShowDiscordHelp] = useState(false);
  
  // Product Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [commissionPercent, setCommissionPercent] = useState('0');
  const [category, setCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [image, setImage] = useState<string | undefined>(undefined);
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [productType, setProductType] = useState<'single' | 'combo'>('single');
  const [comboItems, setComboItems] = useState<{ productName: string; quantity: number }[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // Staff List State
  const [newStaffMember, setNewStaffMember] = useState('');

  // Announcement State
  const [announcementText, setAnnouncementText] = useState(state.announcement || '');
  const [isUpdatingAnnouncement, setIsUpdatingAnnouncement] = useState(false);
  const [showAnnounceSuccess, setShowAnnounceSuccess] = useState(false);

  // Password Form State
  const [newManagerPass, setNewManagerPass] = useState('');
  const [newStaffPass, setNewStaffPass] = useState('');
  const [hourlyWage, setHourlyWage] = useState(state.hourlyWage.toString());
  const [showPassSuccess, setShowPassSuccess] = useState(false);

  const handleSaveProduct = async () => {
    setFormError(null);
    const finalCategory = isAddingNewCategory ? newCategory : category;
    
    if (!name.trim()) {
      setFormError('請輸入商品名稱');
      return;
    }
    if (!price || isNaN(parseInt(price))) {
      setFormError('請輸入有效的商品價格');
      return;
    }
    if (!finalCategory) {
      setFormError('請選擇或輸入商品分類');
      return;
    }
    
    try {
      const productData = {
        name: name.trim(),
        price: parseInt(price) || 0,
        commissionPercent: parseInt(commissionPercent) || 0,
        category: finalCategory.trim(),
        image,
        type: productType,
        comboItems: productType === 'combo' ? comboItems : undefined,
      };

      if (editingId) {
        await updateProduct({ id: editingId, ...productData });
        setEditingId(null);
      } else {
        await addProduct(productData);
      }

      // Reset
      setName(''); setPrice(''); setCommissionPercent('0'); setCategory(''); setNewCategory(''); setImage(undefined); setIsAddingNewCategory(false);
      setProductType('single'); setComboItems([]);
    } catch (err: any) {
      console.error('Save product error:', err);
      setFormError('儲存失敗：' + (err.message || '未知錯誤'));
    }
  };

  const handleUpdatePasswords = () => {
    updatePasswords(
      newManagerPass || undefined, 
      newStaffPass || undefined,
      parseInt(hourlyWage) || undefined
    );
    setNewManagerPass('');
    setNewStaffPass('');
    setShowPassSuccess(true);
    setTimeout(() => setShowPassSuccess(false), 3000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTestDiscord = async () => {
    if (!discordUrl) return;
    setIsTestingDiscord(true);
    setDiscordStatus('idle');
    try {
      const response = await fetch(discordUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: "✅ POS 系統連線成功！" }),
      });
      if (response.ok) {
        setDiscordStatus('success');
      } else {
        setDiscordStatus('error');
      }
    } catch (err) {
      setDiscordStatus('error');
    } finally {
      setIsTestingDiscord(false);
      setTimeout(() => setDiscordStatus('idle'), 3000);
    }
  };

  const startEdit = (p: any) => {
    setEditingId(p.id);
    setName(p.name);
    setPrice(p.price.toString());
    setCommissionPercent(p.commissionPercent?.toString() || '0');
    setCategory(p.category);
    setImage(p.image);
    setNewCategory('');
    setIsAddingNewCategory(false);
    setProductType(p.type || 'single');
    setComboItems(p.comboItems || []);
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(line => line.trim());
      
      // Skip header if it exists
      const startIdx = lines[0].toLowerCase().includes('name') ? 1 : 0;
      
      const newProducts: any[] = [];
      for (let i = startIdx; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim());
        if (parts.length >= 3) {
          const name = parts[0];
          const price = parseInt(parts[1]);
          const category = parts[2];
          const commissionPercent = parts[3] ? parseInt(parts[3]) : 0;

          if (name && !isNaN(price) && category) {
            newProducts.push({
              name,
              price,
              category,
              commissionPercent,
              type: 'single'
            });
          }
        }
      }

      if (newProducts.length > 0) {
        await bulkAddProducts(newProducts);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 5000);
      } else {
        setUploadError('找不到符合格式的商品資料 (請見下方說明)');
      }
    } catch (err) {
      setUploadError('讀取 CSV 檔案失敗');
    } finally {
      setIsUploading(false);
      // Clear input
      e.target.value = '';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto h-[calc(100vh-64px)] overflow-y-auto space-y-12">
      
      {/* 1. Header & Quick Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-1">{state.shopName}</h1>
          <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-xs">後台管理系統 / Control Panel</p>
        </div>
        {state.role === 'manager' && (
          <div className="flex gap-2">
            <div className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black flex items-center gap-2">
              <Crown size={14} className="text-amber-400" /> 店長權限已開通
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Management Tools */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Product Editor */}
          <div className="pos-card rounded-3xl p-6 border shadow-sm pos-border">
            <h2 className="text-lg font-black mb-6 flex items-center gap-2">
              <Edit3 size={20} className="text-accent" />
              {editingId ? '修改商品' : '新增品項'}
            </h2>
            
            {/* Type Toggle */}
            <div className="flex bg-black/5 p-1 rounded-xl mb-6">
              <button 
                onClick={() => setProductType('single')}
                className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${productType === 'single' ? 'bg-white shadow-sm ring-1 ring-black/5 text-slate-900' : 'opacity-60 text-slate-400'}`}
              >
                單品
              </button>
              <button 
                onClick={() => {
                  setProductType('combo');
                  if (!category) setCategory('套餐優惠');
                }}
                className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${productType === 'combo' ? 'bg-white shadow-sm ring-1 ring-black/5 text-amber-600' : 'opacity-60 text-slate-400'}`}
              >
                套餐組合
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-widest opacity-60 px-1">商品名稱</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-black/5 border border-transparent focus:border-accent rounded-xl px-4 py-3 outline-none transition-all font-black text-slate-900"
                  placeholder="例如：提拉米蘇"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-widest opacity-60 px-1">價格 (G)</label>
                <input 
                  type="number" 
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  className="w-full bg-black/5 border border-transparent focus:border-accent rounded-xl px-4 py-3 outline-none transition-all font-black text-slate-900"
                  placeholder="2000"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-widest opacity-60 px-1">抽成比例 (%)</label>
                <input 
                  type="number" 
                  value={commissionPercent}
                  onChange={e => setCommissionPercent(e.target.value)}
                  className="w-full bg-black/5 border border-transparent focus:border-accent rounded-xl px-4 py-3 outline-none transition-all font-black text-slate-900"
                  placeholder="例如：10"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-widest opacity-60 px-1">對應分類</label>
                <select 
                  value={isAddingNewCategory ? 'NEW' : category}
                  onChange={e => {
                    if (e.target.value === 'NEW') {
                      setIsAddingNewCategory(true);
                      setCategory('');
                    } else {
                      setIsAddingNewCategory(false);
                      setCategory(e.target.value);
                    }
                  }}
                  className="w-full bg-black/5 border border-transparent focus:border-accent rounded-xl px-4 py-3 outline-none font-black text-slate-900"
                >
                  <option value="">選擇分類</option>
                  {state.categories && state.categories.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="NEW">+ 新增分類...</option>
                </select>
                {isAddingNewCategory && (
                  <motion.input 
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                    type="text" autoFocus
                    placeholder="輸入新分類名稱"
                    className="w-full mt-2 bg-black/5 border border-transparent focus:border-accent rounded-xl px-4 py-3 outline-none font-black text-slate-900 placeholder:opacity-40"
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                  />
                )}
              </div>

              {/* Combo Items Selector */}
              {productType === 'combo' && (
                <div className="space-y-2 p-4 bg-amber-50/50 border border-amber-200/50 rounded-2xl">
                  <label className="text-[10px] font-black uppercase tracking-widest text-amber-600 px-1">套餐包含內容</label>
                  <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {state.products.filter(p => p.type !== 'combo').map(p => {
                      const existing = comboItems.find(ci => ci.productName === p.name);
                      return (
                        <div key={p.id} className="flex items-center justify-between gap-2 p-2 bg-white rounded-xl border border-black/5">
                          <span className="text-xs font-bold truncate flex-1">{p.name}</span>
                          <div className="flex items-center gap-2">
                            {existing ? (
                              <>
                                <button 
                                  onClick={() => {
                                    if (existing.quantity > 1) {
                                      setComboItems(comboItems.map(ci => ci.productName === p.name ? { ...ci, quantity: ci.quantity - 1 } : ci));
                                    } else {
                                      setComboItems(comboItems.filter(ci => ci.productName !== p.name));
                                    }
                                  }}
                                  className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-500"
                                >-</button>
                                <span className="text-xs font-black min-w-[20px] text-center">{existing.quantity}</span>
                                <button 
                                  onClick={() => setComboItems(comboItems.map(ci => ci.productName === p.name ? { ...ci, quantity: ci.quantity + 1 } : ci))}
                                  className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-500"
                                >+</button>
                              </>
                            ) : (
                              <button 
                                onClick={() => setComboItems([...comboItems, { productName: p.name, quantity: 1 }])}
                                className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-amber-200 transition-colors"
                              >
                                加入
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {comboItems.length === 0 && (
                    <p className="text-[9px] font-bold text-amber-400 text-center py-2 italic">請選擇至少一個單品</p>
                  )}
                </div>
              )}
              
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 px-1">商品圖片</label>
                <div className="flex flex-col gap-2">
                  <div className="w-full aspect-video bg-black/5 border-2 border-dashed pos-border rounded-2xl flex items-center justify-center overflow-hidden relative group">
                    {image ? (
                      <>
                        <img src={image} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          onClick={() => setImage(undefined)}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-black"
                        >
                          更換圖片
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-4">
                        <Tag className="w-6 h-6 mx-auto opacity-20 mb-2" />
                        <p className="text-[8px] opacity-40 uppercase font-black tracking-widest">點擊下方按鈕上傳</p>
                      </div>
                    )}
                  </div>
                  <label className="w-full">
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    <div className="w-full py-2 bg-slate-900 hover:bg-black text-[10px] font-black text-white text-center rounded-xl cursor-pointer transition-all uppercase tracking-widest">
                      選擇檔案
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-6 flex gap-3">
                <button 
                  onClick={handleSaveProduct}
                  className="flex-1 bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
                >
                  <Save size={20} className="text-white" />
                  <span className="text-white">{editingId ? '儲存變更' : '新增商品 (加到目錄)'}</span>
                </button>
                {editingId && (
                  <button 
                    onClick={() => {
                      setEditingId(null);
                      setName(''); setPrice(''); setCommissionPercent('0'); setCategory(''); setNewCategory(''); setImage(undefined); setIsAddingNewCategory(false);
                      setProductType('single'); setComboItems([]);
                      setFormError(null);
                    }}
                    className="px-6 py-4 bg-black/5 hover:bg-black/10 rounded-2xl transition-all font-black text-xs text-slate-500"
                  >
                    取消
                  </button>
                )}
              </div>

              {formError && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600"
                >
                  <AlertCircle size={18} />
                  <p className="text-xs font-black">{formError}</p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Bulk Import Products */}
          <div className="pos-card rounded-3xl p-6 border shadow-sm pos-border bg-slate-50/50">
            <h2 className="text-lg font-black mb-4 flex items-center gap-2">
              <Upload size={20} className="text-indigo-600" />
              大量匯入品項 (CSV)
            </h2>
            
            <div className="space-y-4">
              <label className="block w-full cursor-pointer group">
                <input 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  onChange={handleCSVUpload}
                  disabled={isUploading}
                />
                <div className={`w-full py-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all ${isUploading ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'pos-border hover:bg-white hover:border-indigo-400'}`}>
                  {isUploading ? (
                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-2" />
                  ) : (
                    <FileText className={`w-10 h-10 mb-2 transition-transform group-hover:-translate-y-1 ${uploadSuccess ? 'text-emerald-500' : 'opacity-20'}`} />
                  )}
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                    {isUploading ? '正在處理中...' : uploadSuccess ? '成功匯入品項！' : '點擊或拖放 CSV 檔案'}
                  </span>
                </div>
              </label>

              {uploadError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold ring-1 ring-red-100">
                  <AlertCircle size={14} />
                  {uploadError}
                </div>
              )}

              <div className="bg-white rounded-2xl p-5 border pos-border">
                <p className="text-xs font-black uppercase tracking-widest text-slate-800 mb-3 flex items-center gap-1.5">
                  <Key size={14} className="text-slate-400" /> CSV 格式範例與說明
                </p>
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-600">請確保 CSV 欄位順序正確 (標頭列可有可無)：</p>
                  <div className="p-4 border-l-4 border-slate-900 rounded-r-xl font-mono text-sm leading-relaxed text-slate-700 bg-transparent">
                    <span className="text-slate-900 font-black">商品名稱, 價格, 分類, 抽成(%)</span><br/>
                    提拉米蘇, 2000, 甜點, 10<br/>
                    經典拿鐵, 120, 飲品, 0
                  </div>
                  <p className="text-[12px] font-bold text-indigo-600 leading-relaxed bg-indigo-50/30 p-3 rounded-lg">
                    💡 提示：您可以使用 Excel 編輯後，「另存新檔」選擇 <span className="underline decoration-2">CSV (逗號分隔)</span> 格式即可直接上傳。
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Staff List Management - MANAGER ONLY */}
          {state.role === 'manager' && (
            <div className="pos-card rounded-3xl p-6 border shadow-sm pos-border">
              <h2 className="text-lg font-black mb-6 flex items-center gap-2">
                <Users size={20} className="text-accent" />
                店員名單管理
              </h2>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newStaffMember}
                    onChange={e => setNewStaffMember(e.target.value)}
                    className="flex-1 bg-black/5 border border-transparent focus:border-accent rounded-xl px-4 py-2 outline-none font-bold placeholder:opacity-30 text-sm"
                    placeholder="輸入店員角色名稱"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && newStaffMember.trim()) {
                        updateStaffList(Array.from(new Set([...(state.staffList || []), newStaffMember.trim()])));
                        setNewStaffMember('');
                      }
                    }}
                  />
                  <button 
                    onClick={() => {
                      if (newStaffMember.trim()) {
                        updateStaffList(Array.from(new Set([...(state.staffList || []), newStaffMember.trim()])));
                        setNewStaffMember('');
                      }
                    }}
                    className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-black transition-all"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-2 pt-2">
                  {(state.staffList || []).length > 0 ? (state.staffList || []).map(member => (
                    <div key={member} className="flex items-center gap-2 bg-slate-100 text-slate-800 px-3 py-1.5 rounded-xl font-bold text-xs group">
                      {member}
                      <button 
                        onClick={() => {
                          updateStaffList(state.staffList.filter(m => m !== member));
                        }}
                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )) : (
                    <p className="text-[10px] font-bold opacity-30 italic">尚未設定店員名單</p>
                  )}
                </div>
                <p className="text-[9px] font-bold opacity-40 leading-relaxed pt-2">
                  💡 設定完成後，此名單將用於報表端對比「未開市員工」，方便補發底薪。
                </p>
              </div>
            </div>
          )}

          {/* Category Management - MANAGER ONLY */}
          {state.role === 'manager' && (
            <div className="pos-card rounded-3xl p-6 border shadow-sm pos-border bg-slate-50/50">
              <h2 className="text-lg font-black mb-6 flex items-center gap-2">
                <Tag size={20} className="text-accent" />
                菜單分類管理
              </h2>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    className="flex-1 bg-white border pos-border rounded-xl px-4 py-2 outline-none font-bold placeholder:opacity-30 text-sm"
                    placeholder="輸入新分類名稱"
                    onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                  />
                  <button 
                    onClick={handleAddCategory}
                    className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-black transition-all"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                
                <div className="space-y-2">
                  {state.categories.map((cat, index) => (
                    <div key={cat} className="flex items-center gap-2 bg-white p-3 rounded-xl border pos-border group">
                      {editingCategoryIndex === index ? (
                        <input 
                          autoFocus
                          value={editingCategoryValue}
                          onChange={e => setEditingCategoryValue(e.target.value)}
                          onBlur={handleUpdateCategory}
                          onKeyDown={e => e.key === 'Enter' && handleUpdateCategory()}
                          className="flex-1 bg-black/5 border-none px-2 py-1 rounded text-sm font-black outline-none"
                        />
                      ) : (
                        <span className="flex-1 text-sm font-black text-slate-800">{cat}</span>
                      )}
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleMoveCategory(index, 'up')}
                          disabled={index === 0}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 disabled:opacity-0"
                        >
                          <Plus size={14} className="rotate-45" /> 
                        </button>
                        <button 
                          onClick={() => {
                            setEditingCategoryIndex(index);
                            setEditingCategoryValue(cat);
                          }}
                          className="p-1 hover:bg-indigo-50 text-indigo-500 rounded"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteCategory(index)}
                          className="p-1 hover:bg-red-50 text-red-500 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[9px] font-bold opacity-40 leading-relaxed pt-2">
                  💡 您可以調整順序、編輯名稱或刪除不再使用的分類。
                </p>
              </div>
            </div>
          )}

          {/* Appearance Settings - MANAGER ONLY */}
          {state.role === 'manager' && (
            <div className="pos-card rounded-3xl p-6 border shadow-sm pos-border">
              <h2 className="text-lg font-black mb-6 flex items-center gap-2">
                <Sparkles size={20} className="text-accent" />
                介面顯示設定
              </h2>
              <div className="space-y-6">
                {/* Theme Selector */}
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest opacity-60 px-1">系統配色主題</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'warm-retro', name: '溫甜復古', color: 'bg-[#c22e3c]' },
                      { id: 'soft-mint', name: '清新薄荷', color: 'bg-[#ec4899]' },
                      { id: 'earth-neutral', name: '摩登靛藍', color: 'bg-[#4338ca]' }
                    ].map(theme => (
                      <button
                        key={theme.id}
                        onClick={() => setTheme(theme.id as any)}
                        className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${state.theme === theme.id ? 'border-accent bg-accent/5' : 'border-transparent bg-black/5 hover:bg-black/10'}`}
                      >
                        <div className={`w-6 h-6 rounded-full ${theme.color} shadow-sm`} />
                        <span className={`text-[10px] font-black ${state.theme === theme.id ? 'text-accent' : 'text-slate-500'}`}>{theme.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Size Selector */}
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest opacity-60 px-1">全域字體大小</label>
                  <div className="flex bg-black/5 p-1 rounded-2xl">
                    {[
                      { id: 'small', name: '小 (預覽)', label: 'Aa', size: 'text-[10px]' },
                      { id: 'medium', name: '中 (預設)', label: 'Aa', size: 'text-sm' },
                      { id: 'large', name: '大 (清晰)', label: 'Aa', size: 'text-lg' }
                    ].map(size => (
                      <button
                        key={size.id}
                        onClick={() => setFontSize(size.id as any)}
                        className={`flex-1 py-3 rounded-xl transition-all flex flex-col items-center justify-center gap-1 ${state.fontSize === size.id ? 'bg-white shadow-md text-slate-900 ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        <span className={`font-black ${size.size}`}>{size.label}</span>
                        <span className="text-[10px] font-bold">{size.name}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] font-bold opacity-30 leading-relaxed px-1">
                    💡 這將調整整個系統的基礎字級，方便不同視力需求的服務員使用。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Shop Announcement - MANAGER ONLY */}
          {state.role === 'manager' && (
            <div className="pos-card rounded-3xl p-6 border shadow-sm pos-border bg-indigo-50/20">
              <h2 className="text-lg font-black mb-6 flex items-center gap-2">
                <Bell size={20} className="text-indigo-600" />
                店內上班公告
              </h2>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-60 px-1">公告內容 (將會彈出給所有登入的店員)</label>
                  <textarea 
                    value={announcementText}
                    onChange={e => setAnnouncementText(e.target.value)}
                    className="w-full bg-white border pos-border rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold text-sm min-h-[120px] resize-none"
                    placeholder="請輸入上班注意事項或店鋪公告..."
                  />
                </div>
                <button 
                  onClick={async () => {
                    setIsUpdatingAnnouncement(true);
                    try {
                      await updateAnnouncement(announcementText);
                      setShowAnnounceSuccess(true);
                      setTimeout(() => setShowAnnounceSuccess(false), 3000);
                    } catch (e) {}
                    setIsUpdatingAnnouncement(false);
                  }}
                  disabled={isUpdatingAnnouncement}
                  className="w-full bg-indigo-600 text-white hover:bg-slate-900 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
                >
                  {isUpdatingAnnouncement ? (
                    <div className="w-4 h-4 border-2 border-slate-300 border-t-white rounded-full animate-spin" />
                  ) : showAnnounceSuccess ? (
                    <><Check size={16} /> 公告已發布</>
                  ) : (
                    <><Save size={16} /> 發布上班公告</>
                  )}
                </button>
                <p className="text-[9px] font-bold opacity-30 leading-relaxed px-1">
                  💡 發布後，店員在重新整理或開啟系統時將會收到彈窗通知。若要取消公告，請清空內容並儲存。
                </p>
              </div>
            </div>
          )}

          {/* Password Management - MANAGER ONLY */}
          {state.role === 'manager' && (
            <div className="pos-card rounded-3xl p-6 border shadow-sm pos-border bg-slate-900 text-white overflow-hidden relative">
              <div className="relative z-10">
                <h2 className="text-lg font-black mb-6 flex items-center gap-2">
                  <ShieldCheck size={20} className="text-amber-400" />
                  密碼管理
                </h2>
                <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest opacity-60 px-1">新店長密碼 (不改則留空)</label>
                  <input 
                    type="password" 
                    value={newManagerPass}
                    onChange={e => setNewManagerPass(e.target.value)}
                    className="w-full bg-white/10 border border-white/5 rounded-xl px-4 py-3 outline-none focus:bg-white/20 transition-all font-black"
                    placeholder="******"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest opacity-60 px-1">新店員共用密碼 (不改則留空)</label>
                  <input 
                    type="password" 
                    value={newStaffPass}
                    onChange={e => setNewStaffPass(e.target.value)}
                    className="w-full bg-white/10 border border-white/5 rounded-xl px-4 py-3 outline-none focus:bg-white/20 transition-all font-black"
                    placeholder="******"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest opacity-60 px-1">店鋪預設時薪 (G)</label>
                  <input 
                    type="number" 
                    value={hourlyWage}
                    onChange={e => setHourlyWage(e.target.value)}
                    className="w-full bg-white/10 border border-white/5 rounded-xl px-4 py-3 outline-none focus:bg-white/20 transition-all font-black"
                    placeholder="180"
                  />
                </div>
                  <button 
                    onClick={handleUpdatePasswords}
                    className="w-full bg-white text-slate-900 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    {showPassSuccess ? <><Check size={16} /> 修改成功</> : '儲存新密碼'}
                  </button>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            </div>
          )}

          {/* Discord Integration - MANAGER ONLY */}
          {state.role === 'manager' && (
            <div className="pos-card rounded-3xl p-6 border shadow-sm pos-border">
              <h2 className="text-lg font-black mb-6 flex items-center gap-2">
                <Bell size={20} className="text-accent" />
                🔗 Discord 整合設定
              </h2>
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Discord Webhook URL</label>
                    <button 
                      onClick={() => setShowDiscordHelp(!showDiscordHelp)}
                      className="text-[9px] font-black uppercase tracking-widest text-accent hover:underline flex items-center gap-1"
                    >
                      如何取得？
                    </button>
                  </div>
                  
                  <AnimatePresence>
                    {showDiscordHelp && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-amber-50 border border-amber-200/50 rounded-xl p-4 mb-3 text-[10px] leading-relaxed text-amber-800 space-y-2">
                          <p className="font-black text-amber-900 border-b border-amber-200 pb-1 flex items-center gap-2">
                            <Crown size={12} /> Webhook 設定教學
                          </p>
                          <ol className="list-decimal pl-4 space-y-1.5 font-bold">
                            <li><span className="text-amber-900">建立專屬頻道：</span> 在 Discord 伺服器建立文字頻道（例如：🍳｜內場訂單廣播）。可設為私密，僅限店員查看。</li>
                            <li><span className="text-amber-900">進入頻道設定：</span> 點擊頻道名稱旁的 <span className="p-0.5 bg-white border border-amber-200 rounded">齒輪圖示 (編輯頻道)</span>。</li>
                            <li><span className="text-amber-900">建立 Webhook：</span> 進入左側選單的 「整合」，點擊 「建立 Webhook」，可自訂機器人名稱。</li>
                            <li><span className="text-amber-900">複製網址：</span> 點擊 「複製 Webhook 網址」，並貼到下方的輸入框中。</li>
                          </ol>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none opacity-20">
                        <Link size={14} />
                      </div>
                      <input 
                        type="text" 
                        value={discordUrl}
                        onChange={e => setDiscordUrl(e.target.value)}
                        className="w-full bg-black/5 border border-transparent focus:border-accent rounded-xl pl-10 pr-4 py-2.5 outline-none transition-all font-bold text-xs"
                        placeholder="https://discord.com/api/webhooks/..."
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => updateDiscordWebhookUrl(discordUrl)}
                    className="flex-1 bg-slate-900 text-white hover:bg-black py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Save size={14} /> 儲存設定
                  </button>
                  <button 
                    onClick={handleTestDiscord}
                    disabled={isTestingDiscord || !discordUrl}
                    className={`px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 ${
                      discordStatus === 'success' ? 'bg-emerald-500 text-white' :
                      discordStatus === 'error' ? 'bg-red-500 text-white' :
                      'bg-black/5 text-slate-500 hover:bg-black/10'
                    }`}
                  >
                    {isTestingDiscord ? (
                      <div className="w-4 h-4 border-2 border-slate-300 border-t-white rounded-full animate-spin" />
                    ) : discordStatus === 'success' ? (
                      <Check size={14} />
                    ) : discordStatus === 'error' ? (
                      <Trash2 size={14} />
                    ) : (
                      <Send size={14} />
                    )}
                    發送測試
                  </button>
                </div>
                
                <p className="text-[9px] font-bold opacity-30 leading-relaxed pt-2">
                  💡 設定 Webhook 後，每筆訂單成交時都會自動推播內容至指定頻道。
                </p>
              </div>
            </div>
          )}

          {/* System Reset - DANGEROUS AREA */}
          {state.role === 'manager' && (
            <div className="pos-card rounded-3xl p-6 border-2 border-red-500/10 shadow-sm pos-border bg-red-50/30">
              <h2 className="text-sm font-black mb-4 text-red-600 flex items-center gap-2 uppercase tracking-widest">
                危險區域 / Dangerous Area
              </h2>
              <p className="text-[10px] text-red-400 font-bold mb-4 leading-relaxed">
                初始化系統連結將會中斷目前與此店鋪的聯繫，回到初始開通頁面。這可以用於重新選擇店鋪或修復連結錯誤。
              </p>
              
              {!isResetting ? (
                <button 
                  onClick={() => setIsResetting(true)}
                  className="w-full bg-white border border-red-200 text-red-500 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm"
                >
                  初始化系統連結
                </button>
              ) : (
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      resetSystem();
                    }}
                    className="flex-1 bg-red-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg"
                  >
                    確定初始化
                  </button>
                  <button 
                    onClick={() => setIsResetting(false)}
                    className="px-4 py-3 bg-white border border-slate-200 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
                  >
                    取消
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Inventory Table */}
        <div className="lg:col-span-8">
          <div className="pos-card rounded-[2.5rem] overflow-hidden shadow-sm border pos-border bg-white flex flex-col h-full">
            <div className="px-8 py-6 border-b pos-border flex items-center justify-between">
              <h2 className="text-xl font-black flex items-center gap-3">
                <Tag size={24} className="text-accent" />
                商品目錄總覽
              </h2>
              <div className="text-[10px] font-black px-3 py-1 bg-black/5 rounded-full uppercase tracking-widest opacity-50">
                共 {(state.products || []).length} 個品項
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-black/5 text-xs font-black uppercase tracking-[0.2em] opacity-60 border-b pos-border text-slate-600">
                    <th className="px-8 py-5">品名資訊</th>
                    <th className="px-8 py-5">分類標籤</th>
                    <th className="px-8 py-5 text-right">單價 (G)</th>
                    <th className="px-8 py-5 text-right">抽成</th>
                    {(state.role === 'manager' || true) && <th className="px-8 py-5 text-center">操作</th>}
                  </tr>
                </thead>
                <tbody className="divide-y pos-border">
                  {(state.products || []).map(product => (
                    <tr key={product.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200">
                            {product.image ? (
                              <img src={product.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center opacity-20">
                                <Plus size={16} />
                              </div>
                            )}
                          </div>
                          <div className="font-bold text-slate-800 flex items-center gap-2">
                            {product.name}
                            {product.type === 'combo' && (
                              <span className="text-[8px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-black uppercase tracking-widest ring-1 ring-amber-200"> 套餐 </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-accent font-black uppercase tracking-widest">
                            {product.category}
                          </span>
                          {product.type === 'combo' && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {product.comboItems?.map(ci => (
                                <span key={ci.productName} className="text-[8px] font-bold bg-slate-100 text-slate-400 px-1 rounded">
                                  {ci.productName}x{ci.quantity}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="font-mono font-black text-slate-900">{product.price.toLocaleString()}</div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="text-xs font-bold text-slate-500">{product.commissionPercent || 0}%</div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => startEdit(product)}
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                            title="編輯"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button 
                            onClick={() => setProductToDelete(product.id)}
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-400 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                            title="刪除"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {state.products.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-20 contrast-0 grayscale">
                <Plus size={48} className="mb-4" />
                <p className="font-black uppercase tracking-[0.3em]">暫無商品資料</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Delete Confirmation Modal */}
      <AnimatePresence>
        {productToDelete && (
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
              <h3 className="text-xl font-bold mb-2 text-slate-900">確定刪除此商品？</h3>
              <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                品名: <span className="font-bold text-slate-900">{(state.products || []).find(p => p.id === productToDelete)?.name}</span><br/>
                刪除後該品項將無法再被點選。
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    deleteProduct(productToDelete);
                    setProductToDelete(null);
                  }}
                  className="flex-1 bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 transition-all active:scale-95 shadow-lg"
                >
                  確認刪除
                </button>
                <button 
                  onClick={() => setProductToDelete(null)}
                  className="px-6 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
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
