import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, User, ShieldCheck, ChevronRight, ShoppingBag, ChefHat, BarChart3, Settings as SettingsIcon, CreditCard, MessageSquare } from 'lucide-react';

export const TutorialView: React.FC = () => {
  return (
    <div className="h-full overflow-y-auto bg-slate-50/50 p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-12 pb-20">
        
        {/* Header */}
        <header className="text-center space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-widest"
          >
            <BookOpen size={14} /> 系統使用教學
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight"
          >
            快速上手您的 <span className="text-indigo-600">乙太 POS</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 font-medium max-w-xl mx-auto"
          >
            本手冊將協助您快速熟悉系統各項功能，無論您是管理店鋪的店長，或是第一線服務的店員，都能輕鬆上手。
          </motion.p>
        </header>

        {/* Staff Guide */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-4">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
              <User size={24} />
            </div>
            <h2 className="text-2xl font-black text-slate-800">店員操作指南</h2>
          </div>

          <div className="grid gap-4">
            <TutorialCard 
              icon={<ShoppingBag size={20} />}
              title="1. 點單操作"
              content="選擇分類後，點擊商品即可加入購物車。若是多人團體，記得勾選「團體客」，並輸入每位客人的 ID 或編號，點餐時會自動帶入，方便分開結帳。"
            />
            <TutorialCard 
              icon={<CreditCard size={20} />}
              title="2. 結帳與出單"
              content="確認餐點後點擊「結帳」。您可以選擇「合併買單」或「各自結帳」。系統會自動將點單巨集複製到您的剪貼簿，並同步推播至 Discord 通知廚房。"
            />
            <TutorialCard 
              icon={<ChefHat size={20} />}
              title="3. 出餐管理"
              content="切換至「出餐管理」分頁，可查看待處理訂單。點擊訂單卡片可展開查看詳細明細與備註，製作完成後點擊「完成出餐」即可消單。"
            />
          </div>
        </section>

        {/* Manager Guide */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-4">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-2xl font-black text-slate-800">店長管理指南</h2>
          </div>

          <div className="grid gap-4">
            <TutorialCard 
              icon={<SettingsIcon size={20} />}
              title="1. 系統設定與菜單"
              content="在「系統設定」中，您可以調整菜單類型（單品或套餐）、設定商品圖片、價格及抽成比例。同時也能在此管理店員名單及 Discord 通知連結。"
            />
            <TutorialCard 
              icon={<BarChart3 size={20} />}
              title="2. 營收報表與分潤"
              content="店長模式專屬功能。可查看當日總營收、客單價、商品銷量排行，以及每位店員的預估抽成金額，方便店鋪進行帳務結算與薪資發放。"
            />
            <TutorialCard 
              icon={<MessageSquare size={20} />}
              title="3. 系統日誌與追蹤"
              content="透過「歷史紀錄」，店長可以追溯每一筆訂單的詳細資訊，包含由哪位店員點餐、客人的分單狀況及具體的結帳時間點。"
            />
          </div>
        </section>

        {/* Tips Section */}
        <div className="bg-slate-900 text-white rounded-[2rem] p-8 md:p-12 shadow-xl shadow-slate-200">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1 space-y-4 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-300">
                <MessageSquare size={12} /> 小技巧
              </div>
              <h3 className="text-2xl font-black">善用團體客 ID 指南</h3>
              <p className="text-white/60 font-medium leading-relaxed">
                在團體消費時，為每道菜填寫「顧客 ID」不但能讓出餐人員知道是誰點的，結帳時更會自動生成分開買單的明細，大幅縮短人工算帳的時間。
              </p>
            </div>
            <div className="w-px h-24 bg-white/10 hidden md:block" />
            <div className="flex gap-4">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                <ChefHat className="text-accent" />
              </div>
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                <CreditCard className="text-amber-400" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const TutorialCard = ({ icon, title, content }: { icon: React.ReactNode, title: string, content: string }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex gap-4"
  >
    <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
      {icon}
    </div>
    <div className="space-y-1">
      <h3 className="font-black text-slate-800">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed font-medium">
        {content}
      </p>
    </div>
    <div className="ml-auto self-center text-slate-100">
      <ChevronRight size={24} />
    </div>
  </motion.div>
);
