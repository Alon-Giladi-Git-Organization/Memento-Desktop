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
} from 'lucide-react';
import { UserProfileData } from '../lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';

export type TabType =
  | 'workouts'
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
  onLogin: () => Promise<void>;
  onLogout: () => Promise<void>;
  onResetDefaults: () => void;
  onOpenSearch?: () => void;
  onSyncCloud?: () => Promise<{ success: boolean; message: string }>;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  savedAssociationsCount,
  profile,
  currentUser,
  onLogin,
  onLogout,
  onResetDefaults,
  onOpenSearch,
  onSyncCloud,
}) => {
  const [syncStatus, setSyncStatus] = React.useState<string | null>(null);

  const handleManualSync = async () => {
    if (!onSyncCloud) return;
    setSyncStatus('מסנכרן...');
    const res = await onSyncCloud();
    setSyncStatus(res.success ? '✓ סונכרן!' : 'שגיאה');
    setTimeout(() => setSyncStatus(null), 3000);
  };
  const tabs: { id: TabType; label: string; icon: React.ReactNode; color: string; badge?: string }[] = [
    {
      id: 'workouts',
      label: 'מרכז האימונים',
      icon: <Dumbbell className="w-4 h-4 ml-1.5" />,
      color: 'text-[#58CC02]',
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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b-2 border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            onClick={() => onTabChange('workouts')}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-[#58CC02] border-b-4 border-[#46a302] shadow-sm group-hover:scale-105 active:translate-y-0.5 transition-all">
              <Brain className="w-6 h-6 text-white font-black drop-shadow" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#FFC800] rounded-full border-2 border-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-slate-900 tracking-tight">
                  ממנטו <span className="text-[#58CC02]">Memento</span>
                </span>
                <span className="text-[11px] font-black uppercase tracking-wider bg-[#FFC800]/25 text-amber-800 border-2 border-[#FFC800]/60 px-2 py-0.5 rounded-xl">
                  רמה {profile.level}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold hidden sm:block">
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
          <div className="flex items-center gap-2.5">
            {/* Mobile Search Button */}
            {onOpenSearch && (
              <button
                onClick={onOpenSearch}
                className="md:hidden text-slate-600 hover:text-amber-600 p-2 rounded-xl bg-slate-100 border border-slate-300 transition-colors"
                title="חיפוש כללי"
              >
                <Search className="w-4 h-4 text-amber-600" />
              </button>
            )}

            {/* Streak */}
            <div
              onClick={() => onTabChange('gamification')}
              title="רצף ימי אימון יומי"
              className="flex items-center gap-1.5 bg-[#FF9600]/15 border-2 border-[#FF9600]/40 px-3 py-1.5 rounded-2xl text-[#c76500] font-black text-xs cursor-pointer hover:bg-[#FF9600]/25 transition-all hover:scale-105 active:scale-95"
            >
              <Flame className="w-4 h-4 fill-[#FF9600]" />
              <span>{profile.dailyStreak} ימים</span>
            </div>

            {/* XP Points */}
            <div
              onClick={() => onTabChange('gamification')}
              title="סך נקודות XP"
              className="flex items-center gap-1.5 bg-[#FFC800]/20 border-2 border-[#FFC800]/50 px-3 py-1.5 rounded-2xl text-amber-900 font-black text-xs cursor-pointer hover:bg-[#FFC800]/30 transition-all hover:scale-105 active:scale-95"
            >
              <Zap className="w-4 h-4 fill-[#FFC800]" />
              <span>{profile.points} XP</span>
            </div>

            {/* Cloud Sync Button */}
            {currentUser && onSyncCloud && (
              <button
                onClick={handleManualSync}
                title="סנכרן נתונים עכשיו ל-Firestore בענן"
                className="flex items-center gap-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border-2 border-sky-300 px-2.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                <Cloud className="w-3.5 h-3.5 text-sky-600" />
                <span className="hidden md:inline">{syncStatus || 'סנכרון ענן'}</span>
                {syncStatus && <span className="md:hidden">{syncStatus}</span>}
              </button>
            )}

            {/* Auth Button */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt=""
                    className="w-9 h-9 rounded-2xl border-2 border-[#58CC02] object-cover shadow-sm"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-2xl bg-slate-100 text-[#58CC02] border-2 border-[#58CC02] flex items-center justify-center font-black text-sm shadow-sm">
                    {profile.displayName?.charAt(0) || 'U'}
                  </div>
                )}
                <button
                  onClick={onLogout}
                  title="התנתק"
                  className="text-slate-500 hover:text-rose-600 p-2 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="flex items-center gap-1.5 btn-duo-green px-3.5 py-1.5 text-xs cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">התחבר</span>
              </button>
            )}

            <button
              onClick={onResetDefaults}
              title="איפוס נתונים לברירת מחדל"
              className="text-slate-500 hover:text-slate-800 p-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-auto py-2.5 no-scrollbar border-t border-slate-200">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center whitespace-nowrap px-3.5 py-1.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 border-2 border-[#58CC02] border-b-4 border-b-[#46a302] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border-2 border-transparent'
                }`}
              >
                <span className={isActive ? 'text-[#58CC02]' : tab.color}>{tab.icon}</span>
                <span className="mr-1">{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`mr-2 text-[10px] font-black px-2 py-0.5 rounded-lg ${
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
    </header>
  );
};
