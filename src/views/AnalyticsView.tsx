import React, { useMemo, useState } from 'react';
import { usePos } from '../context/PosContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { TrendingUp, Users, DollarSign, Package, Calendar, Download, CheckCircle2, Wallet, Table, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AnalyticsView: React.FC = () => {
  const { state, setFilterDate } = usePos();
  const [activeTab, setActiveTab] = useState<'charts' | 'payroll'>('charts');
  const [shiftHours, setShiftHours] = useState<number>(2);
  const [staffHours, setStaffHours] = useState<Record<string, number>>({});
  const [manualAdjustments, setManualAdjustments] = useState<Record<string, number>>({});
  const [manuallyAddedStaff, setManuallyAddedStaff] = useState<string[]>([]);
  const [paidStatus, setPaidStatus] = useState<Record<string, boolean>>({});

  const completedOrders = useMemo(() => 
    (state.orders || []).filter(o => o.status === 'completed')
  , [state.orders]);

  // Orders for current filtered date (managed by PosContext query now)
  const filteredOrders = completedOrders;

  // 1. Total Revenue
  const totalRevenue = useMemo(() => 
    filteredOrders.reduce((sum, o) => sum + o.total, 0)
  , [filteredOrders]);

  // 2. Hourly Data
  const hourlyData = useMemo(() => {
    const hours: Record<number, { hour: number, revenue: number, staff: Set<string> }> = {};
    for (let i = 0; i < 24; i++) {
      hours[i] = { hour: i, revenue: 0, staff: new Set() };
    }
    filteredOrders.forEach(order => {
      const date = new Date(order.createdAt);
      const h = date.getHours();
      hours[h].revenue += order.total;
      hours[h].staff.add(order.staffName);
    });
    return Object.values(hours).map(data => ({
      ...data,
      displayHour: `${data.hour}:00`,
      avgPerStaff: data.staff.size > 0 ? Math.round(data.revenue / data.staff.size) : 0
    }));
  }, [filteredOrders]);

  // 3. Payroll Aggregation (Refactored for Shift-based)
  const activeStaffNames = useMemo(() => {
    const names = new Set<string>();
    filteredOrders.forEach(o => names.add(o.staffName));
    return Array.from(names);
  }, [filteredOrders]);

  const inactiveStaff = useMemo(() => {
    const allStaff = state.staffList || [];
    return allStaff.filter(name => !activeStaffNames.includes(name) && !manuallyAddedStaff.includes(name));
  }, [state.staffList, activeStaffNames, manuallyAddedStaff]);

  const payrollData = useMemo(() => {
    const staffNames = new Set<string>();
    const commissions: Record<string, number> = {};
    const manualFlags: Record<string, boolean> = {};
    
    // 1. Identify active staff and calculate individual commissions from orders
    filteredOrders.forEach(order => {
      staffNames.add(order.staffName);
      
      if (!commissions[order.staffName]) commissions[order.staffName] = 0;
      
      order.items.forEach(item => {
        const rate = item.commissionPercent || 0;
        commissions[order.staffName] += (item.price * item.quantity * rate) / 100;
      });
    });

    // 2. Add manually added staff
    manuallyAddedStaff.forEach(name => {
      staffNames.add(name);
      manualFlags[name] = true;
    });

    const staffCount = staffNames.size;
    const splitSales = staffCount > 0 ? totalRevenue / staffCount : 0;

    // 3. Construct final payroll data
    return Array.from(staffNames).map(name => ({
      staffName: name,
      totalSales: splitSales,
      commission: commissions[name] || 0,
      isManual: manualFlags[name] || false
    }));
  }, [filteredOrders, manuallyAddedStaff, totalRevenue]);

  const totalPayout = useMemo(() => {
    return payrollData.reduce((sum, data) => {
      const hoursAdjusted = staffHours[data.staffName] ?? shiftHours;
      const baseSalary = hoursAdjusted * state.hourlyWage;
      const adjustment = manualAdjustments[data.staffName] || 0;
      return sum + baseSalary + data.totalSales + data.commission + adjustment;
    }, 0);
  }, [payrollData, staffHours, shiftHours, state.hourlyWage, manualAdjustments]);

  // 4. Product Rankings
  const productRankings = useMemo(() => {
    const counts: Record<string, { name: string, quantity: number, revenue: number }> = {};
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        if (!counts[item.id]) {
          counts[item.id] = { name: item.name, quantity: 0, revenue: 0 };
        }
        counts[item.id].quantity += item.quantity;
        counts[item.id].revenue += item.quantity * item.price;
      });
    });
    return Object.values(counts).sort((a, b) => b.quantity - a.quantity).slice(0, 10);
  }, [filteredOrders]);

  const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

  const exportCSV = () => {
    const filename = `${state.shopName || '乙太連線'}_營業總表_${state.filterDate}.csv`;
    
    const headers = ['結算日期', '店員名稱', '結算時數', '預計底薪', '總接單金額', '業績抽成', '手動調整', '最終應發額', '已領薪'];
    const rows = payrollData.map(data => {
      const hoursAdjusted = staffHours[data.staffName] ?? shiftHours;
      const baseSalary = hoursAdjusted * state.hourlyWage;
      const adjustment = manualAdjustments[data.staffName] || 0;
      const finalPay = baseSalary + data.totalSales + data.commission + adjustment;
      const isPaid = paidStatus[data.staffName] ? '是' : '否';
      return [
        state.filterDate,
        data.staffName,
        hoursAdjusted,
        baseSalary,
        data.totalSales,
        Math.round(data.commission),
        adjustment,
        Math.round(finalPay),
        isPaid
      ];
    });

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-64px)] overflow-y-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[3rem] border pos-border shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-black flex items-center gap-2">
            <TrendingUp className="text-accent" />
            營業數據與薪資管理
          </h1>
          <p className="text-sm pos-text-secondary font-bold opacity-60">店長專屬後台：掌握數據流向與各日期結算</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-black uppercase tracking-widest opacity-60 px-1">選擇報表日期</label>
            <input 
              type="date" 
              value={state.filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-black/5 border border-transparent focus:border-accent rounded-xl px-4 py-2 text-sm font-black outline-none transition-all cursor-pointer hover:bg-black/10"
            />
          </div>

          <div className="flex bg-black/5 p-1 rounded-2xl h-fit self-end">
            <button 
              onClick={() => setActiveTab('charts')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'charts' ? 'bg-white shadow-sm text-slate-900 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <TrendingUp size={14} /> 營業分析
            </button>
            <button 
              onClick={() => setActiveTab('payroll')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'payroll' ? 'bg-white shadow-sm text-slate-900 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Wallet size={14} /> 薪資結算
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'charts' ? (
          <motion.div 
            key="charts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="pos-card rounded-[2rem] p-6 border pos-border shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                    <DollarSign size={20} />
                  </div>
                  <span className="text-sm font-bold opacity-60">指定日營收</span>
                </div>
                <div className="text-3xl font-mono font-black text-accent price-tag">{totalRevenue.toLocaleString()}<span className="text-sm ml-1">G</span></div>
              </div>

              <div className="pos-card rounded-[2rem] p-6 border pos-border shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Calendar size={20} />
                  </div>
                  <span className="text-sm font-bold opacity-60">指定日訂單量</span>
                </div>
                <div className="text-3xl font-mono font-black text-accent price-tag">{filteredOrders.length}<span className="text-sm ml-1">單</span></div>
              </div>

              <div className="pos-card rounded-[2rem] p-6 border pos-border shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center">
                    <Package size={20} />
                  </div>
                  <span className="text-sm font-bold opacity-60">售出品項數</span>
                </div>
                <div className="text-3xl font-mono font-black text-accent">{productRankings.reduce((s, r) => s + r.quantity, 0)}<span className="text-sm ml-1">件</span></div>
              </div>

              <div className="pos-card rounded-[2rem] p-6 border pos-border shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <Users size={20} />
                  </div>
                  <span className="text-sm font-bold opacity-60">平均客單價</span>
                </div>
                <div className="text-3xl font-mono font-black text-accent price-tag">
                  {filteredOrders.length > 0 ? Math.round(totalRevenue / filteredOrders.length).toLocaleString() : 0}
                  <span className="text-sm ml-1">G</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="pos-card rounded-[2rem] p-8 border pos-border shadow-sm flex flex-col h-[400px]">
                <h3 className="font-black mb-6 flex justify-between items-center text-sm uppercase tracking-widest opacity-60">
                  指定日：時段營收分析
                  <span className="text-[10px] bg-black/5 px-2 py-1 rounded">24小時制</span>
                </h3>
                <div className="flex-1 w-full min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                      <XAxis dataKey="displayHour" fontSize={10} axisLine={false} tickLine={false} fontStyle="italic" />
                      <YAxis fontSize={10} axisLine={false} tickLine={false} fontStyle="italic" />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
                        formatter={(value: any) => [`${value.toLocaleString()} G`]}
                      />
                      <Bar dataKey="revenue" fill="var(--accent)" name="總營收" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="pos-card rounded-[2rem] p-8 border pos-border shadow-sm flex flex-col h-[400px]">
                <h3 className="font-black mb-6 text-sm uppercase tracking-widest opacity-60">熱門品項排行榜 (當日)</h3>
                <div className="flex-1 overflow-y-auto space-y-5 pr-2">
                  {productRankings.length > 0 ? (
                    productRankings.map((rank, index) => (
                      <div key={rank.name} className="flex items-center gap-4 group">
                        <div className="w-6 font-black text-slate-400 text-xs italic opacity-50">
                          {String(index + 1).padStart(2, '0')}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1.5">
                            <span className="font-black text-slate-700">{rank.name}</span>
                            <span className="font-mono text-xs font-black opacity-40">{rank.quantity} 份</span>
                          </div>
                          <div className="w-full h-2 bg-black/5 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${(rank.quantity / productRankings[0].quantity) * 100}%` }} transition={{ duration: 1.2, ease: "circOut" }} className="h-full bg-accent" />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex items-center justify-center italic opacity-30 text-sm font-black">此日期尚無銷售數據</div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="payroll"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center bg-white p-8 rounded-[3rem] border pos-border shadow-sm">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-accent/10 text-accent rounded-2xl flex items-center justify-center">
                  <Table size={28} />
                </div>
                <div>
                  <h3 className="font-black text-xl text-slate-900">{state.filterDate} 業績結算</h3>
                  <p className="text-sm font-black opacity-60 uppercase tracking-[0.2em]">Shift-based Payroll & Performance</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex flex-col gap-1 items-end">
                  <label className="text-xs font-black uppercase tracking-widest opacity-60 px-1 text-accent">本次營業總支付額 (Total Payout)</label>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-3xl text-slate-900 tracking-tighter">
                      {Math.round(totalPayout).toLocaleString()} <span className="text-xs opacity-50 font-sans tracking-normal ml-0.5">G</span>
                    </span>
                  </div>
                </div>

                <div className="h-10 w-px bg-black/10 mx-2 invisible md:visible" />

                <div className="flex flex-col gap-1 items-end">
                  <label className="text-xs font-black uppercase tracking-widest opacity-60 px-1 text-accent">本次營業總時數 (Shift Hours)</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      value={shiftHours}
                      onChange={(e) => setShiftHours(parseFloat(e.target.value) || 0)}
                      className="w-24 bg-accent/5 border border-accent/20 rounded-xl px-4 py-2 text-right font-black text-base outline-none focus:ring-2 focus:ring-accent transition-all"
                    />
                    <span className="text-xs font-black opacity-60">HR</span>
                  </div>
                </div>

                <button 
                  onClick={exportCSV}
                  className="px-8 py-4 bg-slate-900 text-white rounded-[1.25rem] text-xs font-black shadow-xl hover:bg-black transition-all flex items-center gap-3 active:scale-95"
                >
                  <Download size={18} /> 下載總表 (CSV)
                </button>
              </div>
            </div>

            <div className="pos-card rounded-[3rem] bg-white border pos-border overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-black/5 text-xs font-black uppercase tracking-[0.15em] opacity-60">
                    <th className="px-8 py-6">店員名稱</th>
                    <th className="px-8 py-6">個人微調時數</th>
                    <th className="px-8 py-6">基本底薪 (G)</th>
                    <th className="px-8 py-6">接單總額 (G)</th>
                    <th className="px-8 py-6">業績抽成 (G)</th>
                    <th className="px-8 py-6">手動調整 (±G)</th>
                    <th className="px-8 py-6 text-right">最終應發放</th>
                    <th className="px-8 py-6 text-center">已發薪</th>
                  </tr>
                </thead>
                <tbody className="divide-y pos-border">
                  {payrollData.length > 0 ? payrollData.map((data) => {
                    const hoursAdjusted = staffHours[data.staffName] ?? shiftHours;
                    const baseSalary = hoursAdjusted * state.hourlyWage;
                    const adjustment = manualAdjustments[data.staffName] || 0;
                    const finalPay = baseSalary + data.totalSales + data.commission + adjustment;
                    return (
                      <tr key={data.staffName} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-7 font-black text-slate-800 text-lg flex items-center gap-2">
                          {data.staffName}
                          {data.isManual && <span className="text-[10px] bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">手動加入</span>}
                        </td>
                        <td className="px-8 py-7">
                          <input 
                            type="number"
                            step="0.5"
                            value={staffHours[data.staffName] ?? shiftHours}
                            onChange={(e) => setStaffHours(prev => ({ 
                              ...prev, 
                              [data.staffName]: parseFloat(e.target.value) || 0 
                            }))}
                            className="w-20 bg-black/5 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-accent font-black text-xs transition-all text-center"
                          />
                        </td>
                        <td className="px-8 py-7 font-mono text-sm font-bold opacity-60">
                          {baseSalary.toLocaleString()}
                        </td>
                        <td className="px-8 py-7 font-mono text-sm font-bold opacity-60">{data.totalSales.toLocaleString()}</td>
                        <td className="px-8 py-7 font-mono text-sm font-black text-accent">{Math.round(data.commission).toLocaleString()}</td>
                        <td className="px-8 py-7">
                          <input 
                            type="number"
                            value={manualAdjustments[data.staffName] || ''}
                            onChange={(e) => setManualAdjustments(prev => ({ 
                              ...prev, 
                              [data.staffName]: parseInt(e.target.value) || 0 
                            }))}
                            placeholder="0"
                            className="w-24 bg-black/5 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-accent font-black text-xs transition-all text-center"
                          />
                        </td>
                        <td className="px-8 py-7 text-right">
                          <span className="font-mono font-black text-slate-900 text-2xl tracking-tighter">
                            {Math.round(finalPay).toLocaleString()} <span className="text-xs opacity-30 font-sans tracking-normal ml-0.5">G</span>
                          </span>
                        </td>
                        <td className="px-8 py-7">
                          <div className="flex justify-center">
                            <button 
                              onClick={() => setPaidStatus(prev => ({ ...prev, [data.staffName]: !prev[data.staffName] }))}
                              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                                paidStatus[data.staffName] 
                                ? 'bg-emerald-100 text-emerald-600 shadow-inner' 
                                : 'bg-slate-100 text-slate-300 hover:bg-slate-200 hover:text-slate-400'
                              }`}
                            >
                              <CheckCircle2 size={28} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={8} className="px-10 py-24 text-center italic opacity-30 text-sm font-black tracking-widest uppercase">此日期尚無結算紀錄</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Inactive Staff Addition Section */}
            {inactiveStaff.length > 0 && (
              <div className="bg-white/40 border border-dashed pos-border rounded-[2.5rem] p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                    <Plus size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">加入今日有出勤但無接單的員工</h4>
                    <p className="text-[10px] font-bold opacity-40">Add staff who were on duty but have no orders record</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {inactiveStaff.map(name => (
                    <button 
                      key={name}
                      onClick={() => setManuallyAddedStaff(prev => [...prev, name])}
                      className="px-6 py-3 bg-white border pos-border rounded-2xl text-xs font-black shadow-sm hover:border-accent hover:text-accent transition-all active:scale-95 flex items-center gap-2 group"
                    >
                      <Plus size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {manuallyAddedStaff.length > 0 && (
              <div className="flex justify-end px-4">
                <button 
                  onClick={() => setManuallyAddedStaff([])}
                  className="text-[10px] font-black text-red-400 hover:text-red-500 underline underline-offset-4 uppercase tracking-widest"
                >
                  清除所有手動加入的員工
                </button>
              </div>
            )}

            <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl overflow-hidden relative group">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-500">
                  <DollarSign size={80} className="text-white" />
               </div>
               <div className="relative z-10 flex items-start gap-6">
                 <div className="w-14 h-14 bg-white/10 text-white rounded-2xl flex items-center justify-center flex-shrink-0 animate-pulse">
                   <Table size={28} />
                 </div>
                 <div className="space-y-2">
                   <h4 className="text-base font-black text-white uppercase tracking-widest">店長安全指南：結算邏輯說明</h4>
                   <p className="text-xs text-white/50 leading-relaxed font-bold max-w-2xl">
                     本報表採用「班次結算制 (Shift-based Payroll)」。系統自動從選定日期的已完成訂單中萃取當日出勤名單。<br />
                     <span className="text-accent underline font-black">計算公式：</span> (個人微調時數 * 店鋪預設時薪) + 業績抽成 + 手動調整 = 最終應發放金額。<br />
                     <span className="text-accent underline font-black">店鋪時薪：</span> 目前設定為 {state.hourlyWage} G / 小時（可在「系統設定」中調整）。<br />
                     手動調整與發薪狀態為「暫時性狀態」，重新整理後會重置，請在結算完成後下載 CSV 存檔。
                   </p>
                 </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
