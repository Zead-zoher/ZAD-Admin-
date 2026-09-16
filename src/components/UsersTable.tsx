import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Trash2,
  Edit2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Globe,
  Smartphone,
  ShieldBan,
  UserCheck,
  UserX,
  Filter,
  Download,
  Terminal,
  MoreVertical,
} from 'lucide-react';
import { UserRecord, UserStatus } from '../types';

interface UsersTableProps {
  users: UserRecord[];
  onApprove: (user: UserRecord) => void;
  onBan: (user: UserRecord) => void;
  onUnban: (user: UserRecord) => void;
  onDelete: (user: UserRecord) => void;
  onEdit: (user: UserRecord) => void;
  selectedFilter: 'all' | 'pending' | 'active' | 'banned';
  onFilterChange: (filter: 'all' | 'pending' | 'active' | 'banned') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const UsersTable: React.FC<UsersTableProps> = ({
  users,
  onApprove,
  onBan,
  onUnban,
  onDelete,
  onEdit,
  selectedFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
}) => {
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(id);
    setTimeout(() => setCopiedField(null), 1800);
  };

  // Filtered users list
  const filteredUsers = users.filter((u) => {
    if (selectedFilter !== 'all' && u.status !== selectedFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        u.displayName.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.ip.includes(q) ||
        u.location.toLowerCase().includes(q) ||
        u.deviceId.toLowerCase().includes(q) ||
        u.os.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const exportToCSV = () => {
    const headers = ['ID', 'DisplayName', 'Username', 'Email', 'Password', 'IP', 'Location', 'DeviceID', 'OS', 'Status', 'RegisteredAt'];
    const rows = filteredUsers.map((u) => [
      u.id,
      `"${u.displayName}"`,
      `"${u.username}"`,
      `"${u.email}"`,
      `"${u.password}"`,
      `"${u.ip}"`,
      `"${u.location}"`,
      `"${u.deviceId}"`,
      `"${u.os}"`,
      u.status,
      `"${u.registeredAt}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `omni_zad_users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl" dir="rtl">
      
      {/* Top Filter and Search Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="بحث بالاسم، البريد، الـ IP، أو البصمة..."
            className="w-full bg-slate-950 border border-slate-700/80 focus:border-indigo-500 rounded-xl px-4 py-2 pr-10 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
          />
          <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Status Filter Tabs & CSV Export */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end overflow-x-auto pb-1 md:pb-0">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 shrink-0">
            <button
              onClick={() => onFilterChange('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                selectedFilter === 'all'
                  ? 'bg-slate-800 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              الكل ({users.length})
            </button>
            <button
              onClick={() => onFilterChange('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                selectedFilter === 'pending'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3 h-3 text-amber-400" />
              <span>معلق ({users.filter((u) => u.status === 'pending').length})</span>
            </button>
            <button
              onClick={() => onFilterChange('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                selectedFilter === 'active'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>نشط ({users.filter((u) => u.status === 'active').length})</span>
            </button>
            <button
              onClick={() => onFilterChange('banned')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                selectedFilter === 'banned'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldBan className="w-3 h-3 text-rose-400" />
              <span>محظور ({users.filter((u) => u.status === 'banned').length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={exportToCSV}
            title="تصدير جدول المستخدمين كـ CSV"
            className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-slate-200 transition shrink-0"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Responsive Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs sm:text-sm">
          <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-mono text-[11px]">
            <tr>
              <th className="py-3.5 px-4">المستخدم</th>
              <th className="py-3.5 px-4">بيانات الحساب والسر</th>
              <th className="py-3.5 px-4">الـ IP والموقع الجغرافي</th>
              <th className="py-3.5 px-4">الجهاز وبصمة النظام</th>
              <th className="py-3.5 px-4">التاريخ والنشاط</th>
              <th className="py-3.5 px-4 text-center">الحالة</th>
              <th className="py-3.5 px-4 text-center">إجراءات الأدمن</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500 font-mono">
                  لا توجد نتائج مطابقة لخيارات البحث الحالية.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const isPasswordRevealed = !!visiblePasswords[user.id];

                return (
                  <tr
                    key={user.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      user.status === 'pending'
                        ? 'bg-amber-500/[0.03]'
                        : user.status === 'banned'
                        ? 'bg-rose-500/[0.03] opacity-80'
                        : ''
                    }`}
                  >
                    {/* User Profile */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border ${
                            user.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : user.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {user.displayName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                            <span>{user.displayName}</span>
                            {user.isOnline && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="متصل الآن" />
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-indigo-400" dir="ltr">
                            @{user.username}
                          </div>
                          {user.notes && (
                            <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                              {user.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email & Password */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="space-y-1.5">
                        {/* Email */}
                        <div className="flex items-center gap-1.5 font-mono text-slate-300 text-xs" dir="ltr">
                          <span className="select-all">{user.email}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(user.email, `email-${user.id}`)}
                            className="text-slate-500 hover:text-slate-300 p-0.5"
                            title="نسخ البريد"
                          >
                            {copiedField === `email-${user.id}` ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>

                        {/* Password with toggle & copy */}
                        <div className="flex items-center gap-1.5 font-mono bg-slate-950 px-2 py-1 rounded-md border border-slate-800 text-xs w-fit" dir="ltr">
                          <span className="text-amber-300">
                            {isPasswordRevealed ? user.password : '••••••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(user.id)}
                            className="text-slate-500 hover:text-slate-300 p-0.5 ml-1"
                            title={isPasswordRevealed ? 'إخفاء' : 'إظهار كلمة المرور'}
                          >
                            {isPasswordRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(user.password, `pass-${user.id}`)}
                            className="text-slate-500 hover:text-slate-300 p-0.5"
                            title="نسخ كلمة المرور"
                          >
                            {copiedField === `pass-${user.id}` ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* IP & Location */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 font-mono text-xs text-slate-200" dir="ltr">
                          <span className="font-semibold">{user.ip}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(user.ip, `ip-${user.id}`)}
                            className="text-slate-500 hover:text-slate-300 p-0.5"
                            title="نسخ عنوان IP"
                          >
                            {copiedField === `ip-${user.id}` ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Globe className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span>{user.location}</span>
                        </div>
                      </div>
                    </td>

                    {/* Device & OS */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-slate-300">
                          <Smartphone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{user.os}</span>
                        </div>
                        <div className="font-mono text-[11px] text-slate-500 flex items-center gap-1" dir="ltr">
                          <span>FP: {user.deviceId}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(user.deviceId, `fp-${user.id}`)}
                            className="text-slate-600 hover:text-slate-400 p-0.5"
                            title="نسخ بصمة الجهاز"
                          >
                            {copiedField === `fp-${user.id}` ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Registration & Last Active */}
                    <td className="py-3.5 px-4 align-top text-xs text-slate-400">
                      <div>
                        <span className="text-slate-500">التسجيل:</span> {user.registeredAt.split(' ')[0]}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        <span className="text-slate-500">آخر نشاط:</span> <span className="text-slate-300">{user.lastActive}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 align-top text-center">
                      {user.status === 'active' && (
                        <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>نشط ✅</span>
                        </span>
                      )}
                      {user.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs px-2.5 py-1 rounded-full font-medium">
                          <Clock className="w-3 h-3" />
                          <span>معلق ⏳</span>
                        </span>
                      )}
                      {user.status === 'banned' && (
                        <span className="inline-flex items-center gap-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs px-2.5 py-1 rounded-full font-medium">
                          <ShieldBan className="w-3 h-3" />
                          <span>محظور 🚫</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 align-top text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        
                        {/* Approve button (for pending or banned users) */}
                        {user.status !== 'active' && (
                          <button
                            type="button"
                            onClick={() => onApprove(user)}
                            title="تفعيل الحساب (Approve)"
                            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-2.5 py-1 rounded-lg transition shadow-sm font-medium"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>تفعيل</span>
                          </button>
                        )}

                        {/* Ban IP & Device button */}
                        {user.status !== 'banned' ? (
                          <button
                            type="button"
                            onClick={() => onBan(user)}
                            title="حظر شامل للـ IP والجهاز (Ban)"
                            className="flex items-center gap-1 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs px-2.5 py-1 rounded-lg transition font-medium"
                          >
                            <ShieldBan className="w-3.5 h-3.5 text-rose-400" />
                            <span>حظر</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onUnban(user)}
                            title="إلغاء الحظر (Unban)"
                            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs px-2.5 py-1 rounded-lg transition font-medium"
                          >
                            <span>فك الحظر</span>
                          </button>
                        )}

                        {/* Edit button */}
                        <button
                          type="button"
                          onClick={() => onEdit(user)}
                          title="تعديل بيانات الحساب"
                          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => onDelete(user)}
                          title="حذف الحساب نهائياً"
                          className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="bg-slate-950/80 border-t border-slate-800 px-5 py-3 flex items-center justify-between text-xs text-slate-500 font-mono">
        <div>
          عرض <b>{filteredUsers.length}</b> من أصل <b>{users.length}</b> مستخدم
        </div>
        <div className="text-indigo-400">
          Omni Zad Security Core
        </div>
      </div>
    </div>
  );
};
