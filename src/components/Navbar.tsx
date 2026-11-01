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
  Search,
  Sliders,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  User,
  Hash,
  Smile,
  ChevronsRight,
  ChevronsLeft,
} from 'lucide-react';
import { UserProfileData } from '../lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';

export type TabType =
  | 'workouts'
  | 'academy'
  | 'logic'
  | 'tester'
  | 'feedback'
  | 'gamification'
  | 'registry'
  | 'mentor'
  | 'theory';

export type WorkoutSubModule = 'pao' | 'major' | 'palaces' | 'names' | 'academic';

interface NavbarProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  selectedWorkoutSubModule?: WorkoutSubModule;
  onSelectWorkoutSubModule?: (subModule: WorkoutSubModule) => void;
  workoutCounts?: {
    pao: number;
    major: number;
    palaces: number;
    names: number;
    academic: number;
  };
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
  selectedWorkoutSubModule = 'pao',
  onSelectWorkoutSubModule,
  workoutCounts,
  savedAssociationsCount,
  profile,
  currentUser,
  onLogin,
  onLogout,
  onOpenSearch,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Persistent expandable sub-menu for "מרכז אימונים":
  // Remains open while navigating within the Training Center and collapses ONLY upon a second click of the main "מרכז אימונים" button.
  const [isWorkoutsSubMenuOpen, setIsWorkoutsSubMenuOpen] = useState(true);
  // Expand / Minimize state for desktop Navbar (persistent in localStorage)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('memento_navbar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('memento_navbar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const workoutSubModules: {
    id: WorkoutSubModule;
    label: string;
    icon: React.ReactNode;
    color: string;
    badge?: string;
  }[] = [
    {
      id: 'pao',
      label: 'שיטת PAO',
      icon: <User className="w-3.5 h-3.5 shrink-0" />,
      color: 'text-[#1CB0F6]',
      badge: workoutCounts ? `${workoutCounts.pao}` : '00-99',
    },
    {
      id: 'major',
      label: 'שיטת Major',
      icon: <Hash className="w-3.5 h-3.5 shrink-0" />,
      color: 'text-[#58CC02]',
      badge: workoutCounts ? `${workoutCounts.major}` : '00-99',
    },
    {
      id: 'palaces',
      label: 'ארמונות זיכרון',
      icon: <Compass className="w-3.5 h-3.5 shrink-0" />,
      color: 'text-[#1CB0F6]',
      badge: workoutCounts ? `${workoutCounts.palaces}` : 'Loci',
    },
    {
      id: 'names',
      label: 'שמות ופנים',
      icon: <Smile className="w-3.5 h-3.5 shrink-0" />,
      color: 'text-[#FF9600]',
      badge: workoutCounts ? `${workoutCounts.names}` : undefined,
    },
    {
      id: 'academic',
      label: 'חומרים אקדמיים',
      icon: <BookOpen className="w-3.5 h-3.5 shrink-0" />,
      color: 'text-[#FF4B4B]',
      badge: workoutCounts ? `${workoutCounts.academic}` : undefined,
    },
  ];

  // Primary navigation tabs (with "ארמונות זיכרון" nested inside "מרכז אימונים")
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

  const handleMainWorkoutsButtonClick = () => {
    if (currentTab !== 'workouts') {
      onTabChange('workouts');
      setIsWorkoutsSubMenuOpen(true);
    } else {
      // Toggle sub-menu ONLY on a click of the main "מרכז אימונים" button
      setIsWorkoutsSubMenuOpen((prev) => !prev);
    }
  };

  const handleSelectWorkoutSubModule = (subId: WorkoutSubModule) => {
    onTabChange('workouts');
    onSelectWorkoutSubModule?.(subId);
    // Keep persistent sub-menu open while navigating within the Training Center
    setIsWorkoutsSubMenuOpen(true);
    setMobileMenuOpen(false);
  };

  const handleSelectTab = (tabId: TabType) => {
    if (tabId === 'workouts') {
      handleMainWorkoutsButtonClick();
      return;
    }
    onTabChange(tabId);
    setMobileMenuOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-4 gap-4 select-none">
      {/* Top Section: Brand + Search + Stats */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between gap-2 pb-3 border-b-2 border-slate-100">
          <div
            onClick={() => {
              onTabChange('workouts');
              setIsWorkoutsSubMenuOpen(true);
              setMobileMenuOpen(false);
            }}
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

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={toggleCollapse}
              className="hidden lg:flex p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-200 cursor-pointer transition-all"
              title="מזער סרגל ניווט (הרחב שטח עבודה)"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              title="סגור תפריט"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
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

          if (tab.id === 'workouts') {
            return (
              <div key={tab.id} className="space-y-1">
                <button
                  type="button"
                  onClick={handleMainWorkoutsButtonClick}
                  aria-expanded={isWorkoutsSubMenuOpen}
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
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-[#58CC02]/15 text-[#2e6e01] border border-[#58CC02]/30">
                      5 מודולות
                    </span>
                    {isWorkoutsSubMenuOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </button>

                {/* Persistent Expandable Sub-Menu for Training Center */}
                {isWorkoutsSubMenuOpen && (
                  <div className="mr-3 pr-2.5 border-r-2 border-slate-200 space-y-1 py-1 animate-fadeIn">
                    {workoutSubModules.map((sub) => {
                      const isSubActive = currentTab === 'workouts' && selectedWorkoutSubModule === sub.id;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => handleSelectWorkoutSubModule(sub.id)}
                          className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-right ${
                            isSubActive
                              ? 'bg-[#58CC02]/15 text-slate-900 border border-[#58CC02] shadow-2xs font-black'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={isSubActive ? 'text-[#58CC02]' : sub.color}>{sub.icon}</span>
                            <span className="truncate">{sub.label}</span>
                          </div>
                          {sub.badge && (
                            <span
                              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                                isSubActive
                                  ? 'bg-[#58CC02] text-white'
                                  : 'bg-slate-100 text-slate-500 border border-slate-200'
                              }`}
                            >
                              {sub.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

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

      {/* Bottom Section: User Auth */}
      <div className="pt-3 border-t-2 border-slate-100 space-y-2.5">
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
        </div>
      </div>
    </div>
  );

  const collapsedSidebarContent = (
    <div className="flex flex-col h-full justify-between items-center py-3.5 px-2 gap-3 select-none">
      {/* Top: Expand Button + Brain Brand Icon + Search + Stats */}
      <div className="flex flex-col items-center gap-2.5 w-full">
        {/* Expand / Minimize Toggle Button */}
        <button
          type="button"
          onClick={toggleCollapse}
          className="w-11 h-11 rounded-2xl bg-[#58CC02]/15 text-[#2e6e01] hover:bg-[#58CC02] hover:text-white border-2 border-[#58CC02]/40 hover:border-[#46a302] flex items-center justify-center transition-all cursor-pointer shadow-xs active:translate-y-0.5 group"
          title="הרחב סרגל ניווט (הצג את כל הפרטים והשמות)"
        >
          <ChevronsLeft className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>

        {/* Brand Brain Icon */}
        <div
          onClick={() => {
            onTabChange('workouts');
            setIsWorkoutsSubMenuOpen(true);
          }}
          className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-[#58CC02] border-b-4 border-[#46a302] shadow-sm hover:scale-105 active:translate-y-0.5 transition-all cursor-pointer shrink-0"
          title="ממנטו (Memento) - לחץ למרכז האימונים"
        >
          <Brain className="w-5 h-5 text-white font-black drop-shadow" />
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#FFC800] rounded-full border-2 border-white animate-pulse" />
        </div>

        {/* Global Search Button */}
        {onOpenSearch && (
          <button
            onClick={onOpenSearch}
            className="w-11 h-10 rounded-2xl bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 border border-slate-300/80 hover:border-amber-400 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
            title="חיפוש כללי (Ctrl + K)"
          >
            <Search className="w-4 h-4 text-amber-600" />
          </button>
        )}

        {/* Compact Stats (Streak & XP) */}
        <div className="flex flex-col items-center gap-1.5 w-full pt-1.5 border-t border-slate-100">
          <div
            onClick={() => handleSelectTab('gamification')}
            className="flex flex-col items-center justify-center bg-[#FF9600]/15 border border-[#FF9600]/40 w-11 py-1 rounded-xl text-[#c76500] font-black text-[10px] cursor-pointer hover:bg-[#FF9600]/25 transition-all"
            title={`רצף יומי: ${profile.dailyStreak} ימים`}
          >
            <Flame className="w-3.5 h-3.5 fill-[#FF9600]" />
            <span className="leading-tight">{profile.dailyStreak}</span>
          </div>
          <div
            onClick={() => handleSelectTab('gamification')}
            className="flex flex-col items-center justify-center bg-[#FFC800]/20 border border-[#FFC800]/50 w-11 py-1 rounded-xl text-amber-900 font-black text-[10px] cursor-pointer hover:bg-[#FFC800]/30 transition-all"
            title={`נקודות XP: ${profile.points}`}
          >
            <Zap className="w-3.5 h-3.5 fill-[#FFC800]" />
            <span className="leading-tight font-mono">{profile.points}</span>
          </div>
        </div>
      </div>

      {/* Middle: Centered Icon Modules Navigation */}
      <nav className="flex-1 overflow-y-auto space-y-2 py-2 w-full flex flex-col items-center">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <div key={tab.id} className="relative group w-full flex justify-center">
              <button
                type="button"
                onClick={() => handleSelectTab(tab.id)}
                className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 border-2 border-[#58CC02] border-b-4 border-b-[#46a302] shadow-xs scale-105'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-2 border-transparent'
                }`}
                title={`${tab.label}${tab.badge ? ` (${tab.badge})` : ''}`}
              >
                <span className={isActive ? 'text-[#58CC02]' : tab.color}>
                  {tab.icon}
                </span>

                {/* Left Active Glow Indicator */}
                {isActive && (
                  <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-1.5 h-5 bg-[#58CC02] rounded-full" />
                )}
              </button>

              {/* Tooltip on Hover */}
              <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1.5 bg-slate-900 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl shadow-xl whitespace-nowrap z-50 pointer-events-none animate-fadeIn">
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="text-[10px] bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded-md font-mono">
                    {tab.badge}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom: Compact User Profile / Login */}
      <div className="pt-2 border-t border-slate-100 w-full flex flex-col items-center gap-2">
        {currentUser ? (
          <div className="relative group flex justify-center">
            <div
              className="relative cursor-pointer"
              title={`${profile.displayName || currentUser.email} (מחובר)`}
            >
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt=""
                  className="w-9 h-9 rounded-xl border-2 border-[#58CC02] object-cover shadow-xs"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-[#58CC02] border-2 border-[#58CC02] flex items-center justify-center font-black text-xs">
                  {profile.displayName?.charAt(0) || 'U'}
                </div>
              )}
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-white"></span>
              </span>
            </div>

            {/* Quick Logout Flyout on hover */}
            <div className="absolute right-full mr-2 bottom-0 hidden group-hover:flex items-center gap-2 bg-slate-900 text-white text-xs font-bold p-2 rounded-xl shadow-xl whitespace-nowrap z-50">
              <span className="max-w-28 truncate">{profile.displayName || currentUser.email}</span>
              <button
                onClick={onLogout}
                className="text-rose-400 hover:text-rose-300 p-1 hover:bg-slate-800 rounded-lg cursor-pointer"
                title="התנתק"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={onLogin}
            className="w-10 h-10 rounded-2xl bg-[#58CC02] hover:bg-[#46a302] text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
            title="התחבר לענן"
          >
            <LogIn className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Vertical Sidebar (Sticky, stays visible on scroll, Expandable & Minimizable) */}
      <aside
        className={`hidden lg:flex lg:flex-col shrink-0 bg-white border-l-2 border-slate-200 sticky top-0 h-screen z-40 shadow-xs transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-68 xl:w-72'
        }`}
      >
        {isCollapsed ? collapsedSidebarContent : sidebarContent}
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
            onClick={() => {
              onTabChange('workouts');
              setIsWorkoutsSubMenuOpen(true);
            }}
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
