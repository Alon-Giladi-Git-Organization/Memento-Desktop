import React, { useState } from 'react';
import {
  Brain,
  Sparkles,
  BookOpen,
  Dumbbell,
  Compass,
  CheckCircle2,
  GraduationCap,
  Flame,
  Zap,
  Activity,
  LogIn,
  LogOut,
  RotateCcw,
  Search,
  Cloud,
  RefreshCw,
  Database,
  Sliders,
  Menu,
  X,
} from 'lucide-react';
import { UserProfileData } from '../lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';

export type TabType =
  | 'workouts'
  | 'academy'
  | 'logic'
  | 'palaces'
  | 'tester'
  | 'feedback'
  | 'gamification'
  | 'registry'
  | 'mentor'
  | 'theory';

interface NavbarProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  savedAssociationsCount: number;
  testCount: number;
  averageScore: number;
  profile: UserProfileData;
  currentUser: FirebaseUser | null;
  isOnline?: boolean;
  isSyncing?: boolean;
  lastSyncTime?: number | null;
  syncStatusMessage?: string | null;
  onLogin: () => Promise<void>;
  onLogout: () => Promise<void>;
  onResetDefaults: () => void;
  onOpenSearch?: () => void;
  onSyncCloud?: () => Promise<{ success: boolean; message: string }>;
  onSeedCloudTables?: () => Promise<{ success: boolean; message: string }>;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  savedAssociationsCount,
  profile,
  currentUser,
  isOnline = true,
  isSyncing = false,
  syncStatusMessage,
  onLogin,
  onLogout,
  onResetDefaults,
  onOpenSearch,
  onSyncCloud,
  onSeedCloudTables,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Ordered strictly as requested:
  // 1. מרכז אימונים (workouts)
  // 2. לוגיקת מספרים (logic)
  // 3. אקדמיית מתחילים (academy)
  // 4. ארמונות זיכרון (palaces)
  // 5. פנקס אסוציאציות (registry)
  // 6. מדע ושיטות (theory)
  // and then the remaining modules
  const tabs: {
    id: TabType;
    label: string;
    icon: React.ReactNode;
    color: string;
    badge?: string;
  }[] = [
    {
      id: 'workouts',
      label: 'מרכז אימונים',
      icon: <Dumbbell className="w-4 h-4 shrink-0" />,
      color: 'text-[#58CC02]',
    },
    {
      id: 'logic',
      label: 'לוגיקת מספרים',
      icon: <Sliders className="w-4 h-4 shrink-0" />,
      color: 'text-[#FFC800]',
      badge: '0-9',
    },
    {
      id: 'academy',
      label: 'אקדמיית מתחילים',
      icon: <GraduationCap className="w-4 h-4 shrink-0" />,
      color: 'text-[#58CC02]',
      badge: 'לימוד מאפס',
    },
    {
      id: 'palaces',
      label: 'ארמונות זיכרון',
      icon: <Compass className="w-4 h-4 shrink-0" />,
      color: 'text-[#1CB0F6]',
      badge: 'Loci',
    },
    {
      id: 'registry',
      label: 'פנקס אסוציאציות',
      icon: <BookOpen className="w-4 h-4 shrink-0" />,
      color: 'text-[#1CB0F6]',
      badge: `${savedAssociationsCount}`,
    },
    {
      id: 'theory',
      label: 'מדע ושיטות',
      icon: <GraduationCap className="w-4 h-4 shrink-0" />,
      color: 'text-[#FF4B4B]',
    },
    {
      id: 'tester',
      label: 'בוחן ה-AI החכם',
      icon: <CheckCircle2 className="w-4 h-4 shrink-0" />,
      color: 'text-[#58CC02]',
      badge: 'Active Recall',
    },
    {
      id: 'feedback',
      label: 'משוב וניתוח AI',
      icon: <Activity className="w-4 h-4 shrink-0" />,
      color: 'text-[#CE82FF]',
      badge: 'חדש',
    },
    {
      id: 'gamification',
      label: 'אתגר יומי ומובילים',
      icon: <Zap className="w-4 h-4 shrink-0" />,
      color: 'text-[#FFC800]',
      badge: `${profile.points} XP`,
    },
    {
      id: 'mentor',
      label: 'מנטור הזיכרון',
      icon: <Sparkles className="w-4 h-4 shrink-0" />,
      color: 'text-[#CE82FF]',
      badge: 'LIVE',
    },
  ];

  const handleSelectTab = (tabId: TabType) => {
    onTabChange(tabId);
    setMobileMenuOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-4 gap-4 select-none">
      {/* Top Section: Brand + Search + Stats */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between gap-2 pb-3 border-b-2 border-slate-100">
          <div
            onClick={() => handleSelectTab('workouts')}
            className="flex items-center gap-2.5 cursor-pointer group min-w-0"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-[#58CC02] border-b-4 border-[#46a302] shadow-sm group-hover:scale-105 active:translate-y-0.5 transition-all shrink-0 animate-float">
              <Brain className="w-5 h-5 text-white font-black drop-shadow" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#FFC800] rounded-full border-2 border-white animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black text-slate-900 tracking-tight truncate">
                  ממנטו <span className="text-[#58CC02]">Memento</span>
                </span>
                <span className="text-[10px] font-black uppercase bg-[#FFC800]/25 text-amber-800 border border-[#FFC800]/60 px-1.5 py-0.5 rounded-lg shrink-0">
                  רמה {profile.level}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold truncate">
                אקדמיית מנמוניקה וארמונות זיכרון
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            title="סגור תפריט"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Search Trigger Bar */}
        {onOpenSearch && (
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenSearch();
            }}
            className="w-full flex items-center justify-between gap-2 bg-slate-100/90 hover:bg-slate-200/90 border border-slate-300/80 hover:border-amber-500 px-3 py-2 rounded-2xl text-xs text-slate-600 hover:text-slate-900 transition-all cursor-pointer shadow-inner"
            title="חיפוש כללי בכל האפליקציה (Ctrl + K)"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Search className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="truncate font-bold">חיפוש בכל המודולים...</span>
            </div>
            <kbd className="bg-white border border-slate-300 text-[10px] font-mono px-1.5 py-0.5 rounded text-slate-500 shadow-xs shrink-0">
              Ctrl+K
            </kbd>
          </button>
        )}

        {/* Gamification Stats (Streak & XP) */}
        <div className="grid grid-cols-2 gap-2">
          <div
            onClick={() => handleSelectTab('gamification')}
            title="רצף ימי אימון יומי"
            className="flex items-center justify-center gap-1.5 bg-[#FF9600]/15 border-2 border-[#FF9600]/40 px-2.5 py-1.5 rounded-2xl text-[#c76500] font-black text-xs cursor-pointer hover:bg-[#FF9600]/25 transition-all whitespace-nowrap"
          >
            <Flame className="w-4 h-4 fill-[#FF9600] animate-glow shrink-0" />
            <span>{profile.dailyStreak} ימים</span>
          </div>

          <div
            onClick={() => handleSelectTab('gamification')}
            title="סך נקודות XP"
            className="flex items-center justify-center gap-1.5 bg-[#FFC800]/20 border-2 border-[#FFC800]/50 px-2.5 py-1.5 rounded-2xl text-amber-900 font-black text-xs cursor-pointer hover:bg-[#FFC800]/30 transition-all whitespace-nowrap"
          >
            <Zap className="w-4 h-4 fill-[#FFC800] shrink-0" />
            <span>{profile.points} XP</span>
          </div>
        </div>
      </div>

      {/* Middle Section: Vertical Modules Navigation */}
      <nav className="flex-1 overflow-y-auto space-y-1.5 py-1 pr-0.5">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2 pb-1">
          מודולות ניווט
        </div>
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleSelectTab(tab.id)}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all duration-150 cursor-pointer text-right ${
                isActive
                  ? 'bg-slate-100 text-slate-900 border-2 border-[#58CC02] border-b-4 border-b-[#46a302] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border-2 border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={isActive ? 'text-[#58CC02]' : tab.color}>{tab.icon}</span>
                <span className="truncate">{tab.label}</span>
              </div>
              {tab.badge && (
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-lg shrink-0 ${
                    isActive
                      ? 'bg-[#58CC02]/20 text-[#2e6e01] border border-[#58CC02]/40'
                      : 'bg-slate-200/70 text-slate-600 border border-slate-300'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Section: Cloud Sync & User Auth */}
      <div className="pt-3 border-t-2 border-slate-100 space-y-2.5">
        {currentUser && isOnline && (onSyncCloud || onSeedCloudTables) && (
          <div className="flex items-center gap-1.5">
            {onSyncCloud && (
              <button
                onClick={onSyncCloud}
                disabled={isSyncing}
                title="סנכרן עכשיו לענן"
                className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#1CB0F6]/10 hover:bg-[#1CB0F6]/20 text-[#1CB0F6] border border-[#1CB0F6]/30 text-[11px] font-extrabold transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'מסנכרן...' : 'סנכרן ענן'}</span>
              </button>
            )}
            {onSeedCloudTables && (
              <button
                onClick={onSeedCloudTables}
                disabled={isSyncing}
                title="טען ושמור את כל טבלאות ברירת המחדל לענן"
                className="p-1.5 rounded-xl bg-[#FF9600]/10 hover:bg-[#FF9600]/20 text-[#FF9600] border border-[#FF9600]/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <Database className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {syncStatusMessage && (
          <div className="px-2.5 py-1 rounded-xl bg-[#58CC02]/15 border border-[#58CC02]/40 text-[#2e6e01] text-[11px] font-bold text-center">
            {syncStatusMessage}
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          {currentUser ? (
            <div className="flex items-center justify-between gap-2 flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-2xl px-2.5 py-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative inline-flex items-center shrink-0" title="מחובר ומסונכרן בזמן אמת">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt=""
                      className="w-7 h-7 rounded-xl border-2 border-[#58CC02] object-cover shadow-xs"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-xl bg-slate-100 text-[#58CC02] border-2 border-[#58CC02] flex items-center justify-center font-black text-xs">
                      {profile.displayName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-white"></span>
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-700 truncate">
                  {profile.displayName || currentUser.email}
                </span>
              </div>
              <button
                onClick={onLogout}
                title="התנתק"
                className="text-slate-500 hover:text-rose-600 p-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="flex-1 flex items-center justify-center gap-1.5 btn-duo-green px-3 py-2 text-xs cursor-pointer whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>התחבר לענן</span>
            </button>
          )}

          <button
            onClick={onResetDefaults}
            title="איפוס נתונים לברירת מחדל"
            className="text-slate-500 hover:text-slate-800 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Vertical Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-68 xl:w-72 shrink-0 bg-white border-l-2 border-slate-200 sticky top-0 h-screen z-40 shadow-xs">
        {sidebarContent}
      </aside>

      {/* Mobile Header Bar */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-slate-200 px-3 py-2.5 flex items-center justify-between gap-2 w-full">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 cursor-pointer shrink-0"
            title="פתח תפריט ניווט"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div
            onClick={() => handleSelectTab('workouts')}
            className="flex items-center gap-2 cursor-pointer min-w-0"
          >
            <div className="w-8 h-8 rounded-xl bg-[#58CC02] border-b-3 border-[#46a302] flex items-center justify-center shrink-0">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-black text-slate-900 truncate">
              ממנטו <span className="text-[#58CC02]">Memento</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="text-slate-600 hover:text-amber-600 p-2 rounded-xl bg-slate-100 border border-slate-300 transition-colors cursor-pointer"
              title="חיפוש כללי"
            >
              <Search className="w-4 h-4 text-amber-600" />
            </button>
          )}
          <div
            onClick={() => handleSelectTab('gamification')}
            className="flex items-center gap-1 bg-[#FF9600]/15 border border-[#FF9600]/40 px-2 py-1 rounded-xl text-[#c76500] font-black text-xs cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5 fill-[#FF9600]" />
            <span>{profile.dailyStreak}</span>
          </div>
          <div
            onClick={() => handleSelectTab('gamification')}
            className="flex items-center gap-1 bg-[#FFC800]/20 border border-[#FFC800]/50 px-2 py-1 rounded-xl text-amber-900 font-black text-xs cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 fill-[#FFC800]" />
            <span>{profile.points}</span>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Over Vertical Sidebar Drawer */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-start animate-fadeIn"
          dir="rtl"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setMobileMenuOpen(false);
            }
          }}
        >
          <aside
            className="w-72 max-w-[85vw] bg-white h-full shadow-2xl border-l-2 border-slate-200 overflow-y-auto"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};

