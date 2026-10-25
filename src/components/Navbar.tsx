import React from 'react';
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
  CloudOff,
  RefreshCw,
  Database,
  Sliders,
  Hash,
} from 'lucide-react';
import { UserProfileData } from '../lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';

export type TabType =
  | 'workouts'
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
  lastSyncTime,
  syncStatusMessage,
  onLogin,
  onLogout,
  onResetDefaults,
  onOpenSearch,
  onSyncCloud,
  onSeedCloudTables,
}) => {
  const tabs: { id: TabType; label: string; icon: React.ReactNode; color: string; badge?: string }[] = [
    {
      id: 'workouts',
      label: 'מרכז האימונים',
      icon: <Dumbbell className="w-4 h-4 ml-1.5" />,
      color: 'text-[#58CC02]',
    },
    {
      id: 'logic',
      label: 'לוגיקת מספרים',
      icon: <Sliders className="w-4 h-4 ml-1.5" />,
      color: 'text-[#FFC800]',
      badge: '0-9',
    },
    {
      id: 'palaces',
      label: 'ארמונות זיכרון',
      icon: <Compass className="w-4 h-4 ml-1.5" />,
      color: 'text-[#1CB0F6]',
      badge: 'Loci',
    },
    {
      id: 'tester',
      label: 'בוחן ה-AI החכם',
      icon: <CheckCircle2 className="w-4 h-4 ml-1.5" />,
      color: 'text-[#58CC02]',
      badge: 'Active Recall',
    },
    {
      id: 'feedback',
      label: 'משוב וניתוח AI',
      icon: <Activity className="w-4 h-4 ml-1.5" />,
      color: 'text-[#CE82FF]',
      badge: 'חדש',
    },
    {
      id: 'gamification',
      label: 'אתגר יומי ומובילים',
      icon: <Zap className="w-4 h-4 ml-1.5" />,
      color: 'text-[#FFC800]',
      badge: `${profile.points} XP`,
    },
    {
      id: 'registry',
      label: 'פנקס האסוציאציות',
      icon: <BookOpen className="w-4 h-4 ml-1.5" />,
      color: 'text-[#1CB0F6]',
      badge: `${savedAssociationsCount}`,
    },
    {
      id: 'mentor',
      label: 'מנטור הזיכרון',
      icon: <Sparkles className="w-4 h-4 ml-1.5" />,
      color: 'text-[#CE82FF]',
      badge: 'LIVE',
    },
    {
      id: 'theory',
      label: 'המדע והשיטות',
      icon: <GraduationCap className="w-4 h-4 ml-1.5" />,
      color: 'text-[#FF4B4B]',
    },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b-2 border-slate-200 shadow-sm w-full max-w-full overflow-hidden">
      <div className="w-full max-w-none px-3 sm:px-6 lg:px-8 xl:px-12 mx-auto">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 w-full">
          {/* Logo */}
          <div
            onClick={() => onTabChange('workouts')}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group shrink-0 min-w-0"
          >
            <div className="relative flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#58CC02] border-b-4 border-[#46a302] shadow-sm group-hover:scale-105 active:translate-y-0.5 transition-all shrink-0 animate-float">
              <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-white font-black drop-shadow" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#FFC800] rounded-full border-2 border-white animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-base sm:text-xl font-black text-slate-900 tracking-tight whitespace-nowrap">
                  ממנטו <span className="text-[#58CC02] hidden xs:inline">Memento</span>
                </span>
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-[#FFC800]/25 text-amber-800 border-2 border-[#FFC800]/60 px-1.5 sm:px-2 py-0.5 rounded-lg sm:rounded-xl whitespace-nowrap">
                  רמה {profile.level}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold hidden sm:block truncate">
                אקדמיית מנמוניקה, ארמונות זיכרון ואימונים יומיים
              </p>
            </div>
          </div>

          {/* Global Search Trigger Bar */}
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2 bg-slate-100/90 hover:bg-slate-200/90 border border-slate-300/80 hover:border-amber-500 px-3.5 py-1.5 rounded-2xl text-xs text-slate-600 hover:text-slate-900 transition-all cursor-pointer shadow-inner max-w-xs w-full hidden md:flex justify-between"
              title="חיפוש כללי בכל האפליקציה (Ctrl + K)"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-amber-600" />
                <span className="truncate font-medium">חיפוש בכל המודולים...</span>
              </div>
              <kbd className="hidden lg:inline-block bg-white border border-slate-300 text-[10px] font-mono px-1.5 py-0.5 rounded text-slate-500 shadow-xs">
                Ctrl + K
              </kbd>
            </button>
          )}

          {/* Gamification Stats & User Auth */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Mobile Search Button */}
            {onOpenSearch && (
              <button
                onClick={onOpenSearch}
                className="md:hidden text-slate-600 hover:text-amber-600 p-1.5 sm:p-2 rounded-xl bg-slate-100 border border-slate-300 transition-colors"
                title="חיפוש כללי"
              >
                <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
              </button>
            )}

            {/* Streak */}
            <div
              onClick={() => onTabChange('gamification')}
              title="רצף ימי אימון יומי"
              className="flex items-center gap-1 bg-[#FF9600]/15 border-2 border-[#FF9600]/40 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl text-[#c76500] font-black text-[11px] sm:text-xs cursor-pointer hover:bg-[#FF9600]/25 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-[#FF9600] animate-glow" />
              <span>{profile.dailyStreak}</span>
              <span className="hidden xs:inline"> ימים</span>
            </div>

            {/* XP Points */}
            <div
              onClick={() => onTabChange('gamification')}
              title="סך נקודות XP"
              className="flex items-center gap-1 bg-[#FFC800]/20 border-2 border-[#FFC800]/50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl text-amber-900 font-black text-[11px] sm:text-xs cursor-pointer hover:bg-[#FFC800]/30 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-[#FFC800]" />
              <span>{profile.points} XP</span>
            </div>

            {/* Auth Button with live pulsing green indicator beside user profile */}
            {currentUser ? (
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="relative inline-flex items-center" title="מחובר ומסונכרן בזמן אמת">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt=""
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl border-2 border-[#58CC02] object-cover shadow-sm"
                    />
                  ) : (
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-slate-100 text-[#58CC02] border-2 border-[#58CC02] flex items-center justify-center font-black text-xs sm:text-sm shadow-sm">
                      {profile.displayName?.charAt(0) || 'U'}
                    </div>
                  )}
                  {/* Beautiful green pulsing indicator right beside profile */}
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white"></span>
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  title="התנתק"
                  className="text-slate-500 hover:text-rose-600 p-1.5 sm:p-2 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="flex items-center gap-1 sm:gap-1.5 btn-duo-green px-2.5 sm:px-3.5 py-1.5 text-xs cursor-pointer whitespace-nowrap"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">התחבר</span>
              </button>
            )}

            <button
              onClick={onResetDefaults}
              title="איפוס נתונים לברירת מחדל"
              className="text-slate-500 hover:text-slate-800 p-1.5 sm:p-2 rounded-xl hover:bg-slate-100 transition-colors hidden xs:flex"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="w-full max-w-full overflow-x-auto py-2 sm:py-2.5 no-scrollbar border-t border-slate-200">
          <div className="flex items-center gap-1.5 sm:gap-2 w-max">
            {tabs.map((tab) => {
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center whitespace-nowrap px-3 sm:px-3.5 py-1.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-extrabold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 border-2 border-[#58CC02] border-b-4 border-b-[#46a302] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border-2 border-transparent'
                  }`}
                >
                  <span className={isActive ? 'text-[#58CC02]' : tab.color}>{tab.icon}</span>
                  <span className="mr-1">{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`mr-2 text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-lg ${
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
          </div>
        </div>
      </div>
    </header>
  );
};
