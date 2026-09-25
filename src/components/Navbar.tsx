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
  Trophy,
  Activity,
  LogIn,
  LogOut,
  RotateCcw,
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
}) => {
  const tabs: { id: TabType; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'workouts',
      label: 'מרכז האימונים',
      icon: <Dumbbell className="w-4 h-4 ml-1.5 text-amber-400" />,
    },
    {
      id: 'palaces',
      label: 'ארמונות זיכרון',
      icon: <Compass className="w-4 h-4 ml-1.5 text-indigo-400" />,
      badge: 'Loci',
    },
    {
      id: 'tester',
      label: 'בוחן ה-AI החכם',
      icon: <CheckCircle2 className="w-4 h-4 ml-1.5 text-emerald-400" />,
      badge: 'AI Active Recall',
    },
    {
      id: 'feedback',
      label: 'משוב וניתוח AI',
      icon: <Activity className="w-4 h-4 ml-1.5 text-teal-400" />,
      badge: 'חדש',
    },
    {
      id: 'gamification',
      label: 'אתגר יומי ומובילים',
      icon: <Trophy className="w-4 h-4 ml-1.5 text-yellow-400" />,
      badge: `${profile.points} XP`,
    },
    {
      id: 'registry',
      label: 'פנקס האסוציאציות',
      icon: <BookOpen className="w-4 h-4 ml-1.5 text-cyan-400" />,
      badge: `${savedAssociationsCount}`,
    },
    {
      id: 'mentor',
      label: 'מנטור הזיכרון',
      icon: <Sparkles className="w-4 h-4 ml-1.5 text-violet-400" />,
      badge: 'חי',
    },
    {
      id: 'theory',
      label: 'המדע והשיטות',
      icon: <GraduationCap className="w-4 h-4 ml-1.5 text-rose-400" />,
    },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            onClick={() => onTabChange('workouts')}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Brain className="w-5 h-5 text-slate-950 font-bold" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 bg-clip-text text-transparent">
                  ממנטו • Memento
                </span>
                <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded">
                  Lv.{profile.level}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                אקדמיית מנמוניקה, ארמונות זיכרון ו-PAO
              </p>
            </div>
          </div>

          {/* Gamification Stats & User Auth */}
          <div className="flex items-center gap-3">
            {/* Streak */}
            <div
              onClick={() => onTabChange('gamification')}
              title="רצף ימי אימון יומי"
              className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/30 px-2.5 py-1 rounded-xl text-orange-400 font-bold text-xs cursor-pointer hover:bg-orange-500/20 transition-all"
            >
              <Flame className="w-4 h-4 fill-orange-400" />
              <span>{profile.dailyStreak} ימים</span>
            </div>

            {/* XP Points */}
            <div
              onClick={() => onTabChange('gamification')}
              title="סך נקודות XP"
              className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-xl text-amber-300 font-bold text-xs cursor-pointer hover:bg-amber-500/20 transition-all"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>{profile.points} XP</span>
            </div>

            {/* Auth Button */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt=""
                    className="w-8 h-8 rounded-full border border-amber-400/60 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-amber-400 border border-amber-400/40 flex items-center justify-center font-bold text-xs">
                    {profile.displayName?.charAt(0) || 'U'}
                  </div>
                )}
                <button
                  onClick={onLogout}
                  title="התנתק"
                  className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">התחבר</span>
              </button>
            )}

            <button
              onClick={onResetDefaults}
              title="איפוס נתונים לברירת מחדל"
              className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-2 no-scrollbar border-t border-slate-800/40">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`mr-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-amber-400/20 text-amber-300'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
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
