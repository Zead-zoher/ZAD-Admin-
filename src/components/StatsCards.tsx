import React from 'react';
import { Users, Clock, CheckCircle2, ShieldBan, XCircle } from 'lucide-react';
import { AdminStats } from '../types';

interface StatsCardsProps {
  stats: AdminStats;
  selectedFilter: string;
  onSelectFilter: (filter: 'all' | 'pending' | 'active' | 'rejected' | 'banned') => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats, selectedFilter, onSelectFilter }) => {
  const cards = [
    {
      id: 'pending' as const,
      label: 'طلبات قيد الانتظار',
      sublabel: 'Pending Requests',
      value: stats.pendingUsers,
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      activeBorder: 'border-amber-500 ring-2 ring-amber-500/40 bg-amber-950/20',
      badge: stats.pendingUsers > 0 ? `${stats.pendingUsers} بانتظار قرارك ⚡` : 'لا توجد طلبات معلقة',
      alert: stats.pendingUsers > 0,
    },
    {
      id: 'active' as const,
      label: 'المستخدمين المقبولين النشطين',
      sublabel: 'Active Accounts',
      value: stats.activeUsers,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/40 bg-emerald-950/20',
      badge: `${stats.activeUsers} حساب مفعل بالكامل`,
    },
    {
      id: 'rejected' as const,
      label: 'المستخدمين المرفوضين',
      sublabel: 'Rejected Users',
      value: stats.rejectedUsers,
      icon: XCircle,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20',
      activeBorder: 'border-orange-500 ring-2 ring-orange-500/40 bg-orange-950/20',
      badge: `${stats.rejectedUsers} طلب مرفوض (غير مقبول)`,
    },
    {
      id: 'banned' as const,
      label: 'المحظورين والقائمة السوداء',
      sublabel: 'Banned & Blacklist',
      value: stats.bannedUsers,
      icon: ShieldBan,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      activeBorder: 'border-rose-500 ring-2 ring-rose-500/40 bg-rose-950/20',
      badge: `${stats.bannedIPsCount} عناوين IP وبصمات محظورة`,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" dir="rtl">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = selectedFilter === card.id;

        return (
          <div
            key={card.id}
            onClick={() => onSelectFilter(card.id)}
            className={`cursor-pointer rounded-2xl bg-slate-900/80 p-5 border transition-all duration-200 hover:bg-slate-900 relative overflow-hidden group ${
              isSelected ? card.activeBorder : `${card.border} hover:border-slate-700`
            }`}
          >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-300 block mb-1">
                  {card.label}
                </span>
                <div className="text-3xl font-extrabold text-slate-100 font-mono tracking-tight">
                  {card.value}
                </div>
              </div>
              <div className={`p-3 rounded-xl ${card.bg} ${card.color} border border-white/5`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono text-[11px]">{card.sublabel}</span>
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                  card.alert
                    ? 'bg-amber-500/20 text-amber-300 animate-pulse border border-amber-500/40'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {card.badge}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
