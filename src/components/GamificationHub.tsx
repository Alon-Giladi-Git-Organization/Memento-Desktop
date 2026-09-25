import React, { useState } from 'react';
import {
  Trophy,
  Flame,
  Award,
  Users,
  Calendar,
  Sparkles,
  CheckCircle2,
  LogIn,
  LogOut,
  ChevronRight,
  Shield,
  Zap,
  Target,
  ArrowUpRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DailyChallenge, BadgeDefinition } from '../types/memory';
import { ALL_BADGES, calculateLevel } from '../data/gamificationData';
import { UserProfileData } from '../lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';

interface GamificationHubProps {
  currentUser: FirebaseUser | null;
  profile: UserProfileData;
  leaderboard: UserProfileData[];
  dailyChallenge: DailyChallenge;
  onLogin: () => Promise<void>;
  onLogout: () => Promise<void>;
  onCompleteDailyChallenge: (challengeId: string, reward: number) => void;
  onEarnPoints: (amount: number, reason?: string) => void;
  onUnlockBadge: (badge: string) => void;
}

export const GamificationHub: React.FC<GamificationHubProps> = ({
  currentUser,
  profile,
  leaderboard,
  dailyChallenge,
  onLogin,
  onLogout,
  onCompleteDailyChallenge,
  onEarnPoints,
  onUnlockBadge,
}) => {
  const [dailyResponse, setDailyResponse] = useState('');
  const [isDailySubmitted, setIsDailySubmitted] = useState(dailyChallenge.completed);
  const [showAnswer, setShowAnswer] = useState(false);

  const levelInfo = calculateLevel(profile.points);
  const progressPercent = Math.min(
    100,
    Math.round(
      ((profile.points - levelInfo.currentBase) /
        (levelInfo.nextThreshold - levelInfo.currentBase)) *
        100
    )
  );

  const handleDailySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dailyResponse.trim() || isDailySubmitted) return;

    setIsDailySubmitted(true);
    setShowAnswer(true);
    onCompleteDailyChallenge(dailyChallenge.id, dailyChallenge.rewardPoints);
    confetti({ particleCount: 80, spread: 90, origin: { y: 0.6 } });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Top Profile & Progress Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={profile.displayName || 'משתמש'}
                  className="w-16 h-16 rounded-2xl border-2 border-amber-400 shadow-xl object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center text-slate-950 font-black text-2xl shadow-xl shadow-amber-500/20">
                  {profile.displayName?.charAt(0) || 'מ'}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 bg-slate-950 text-amber-400 text-[10px] font-black px-1.5 py-0.5 rounded-md border border-amber-400">
                Lv.{levelInfo.level}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {profile.displayName || 'ספורטאי זיכרון'}
                </h2>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {levelInfo.title}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {currentUser ? currentUser.email : 'משתמש מקומי (התחבר כדי לסנכרן לענן)'}
              </p>
            </div>
          </div>

          {/* Auth Button */}
          <div>
            {currentUser ? (
              <button
                onClick={onLogout}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400" />
                <span>התנתק מחשבון</span>
              </button>
            ) : (
              <button
                onClick={onLogin}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-slate-950" />
                <span>התחבר עם Google לשמירה בענן</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-center">
            <span className="text-xs text-slate-400 block mb-1">סך נקודות XP</span>
            <div className="text-2xl font-black text-amber-400">{profile.points}</div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-center">
            <span className="text-xs text-slate-400 block mb-1">רצף ימים (Streak)</span>
            <div className="text-2xl font-black text-orange-400 flex items-center justify-center gap-1">
              <Flame className="w-5 h-5 fill-orange-400 text-orange-400 animate-pulse" />
              <span>{profile.dailyStreak} ימים</span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-center">
            <span className="text-xs text-slate-400 block mb-1">תגים שנפתחו</span>
            <div className="text-2xl font-black text-indigo-400">
              {profile.badges.length}/{ALL_BADGES.length}
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-center">
            <span className="text-xs text-slate-400 block mb-1">תרגילים שהושלמו</span>
            <div className="text-2xl font-black text-emerald-400">{profile.exercisesCompleted}</div>
          </div>
        </div>

        {/* Level Progress Bar */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">
              התקדמות לדרגה הבאה: <strong className="text-white">דרגה {levelInfo.level + 1}</strong>
            </span>
            <span className="text-amber-400 font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Daily Challenge & Badges */}
        <div className="lg:col-span-2 space-y-8">
          {/* Daily Challenge Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/30">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base sm:text-lg">
                    {dailyChallenge.title}
                  </h3>
                  <p className="text-xs text-slate-400">{dailyChallenge.subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-full text-xs font-black">
                <Sparkles className="w-3.5 h-3.5" />
                <span>+{dailyChallenge.rewardPoints} XP</span>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <p className="text-sm text-slate-200 leading-relaxed font-medium bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
                {dailyChallenge.description}
              </p>

              <div className="text-xs text-amber-300 font-semibold bg-amber-950/20 border border-amber-500/20 p-3 rounded-xl">
                💡 <span className="underline">המשימה:</span> {dailyChallenge.prompt}
              </div>

              {!isDailySubmitted ? (
                <form onSubmit={handleDailySubmit} className="space-y-3">
                  <textarea
                    rows={2}
                    required
                    value={dailyResponse}
                    onChange={(e) => setDailyResponse(e.target.value)}
                    placeholder="כתוב את הפיענוח, מילת התחליף או התרחיש המנטלי שלך..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black px-6 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 text-xs transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>הגש פתרון וקבל +{dailyChallenge.rewardPoints} XP</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-4 space-y-2 animate-fadeIn">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>אתגר היום הושלם בהצלחה! נקודות ה-XP נוספו לרקורד שלך.</span>
                  </div>
                  {showAnswer && (
                    <div className="text-xs text-slate-300 pt-2 border-t border-emerald-500/20">
                      <span className="font-bold text-emerald-300 block mb-1">
                        התשובה המנמונית המובילה:
                      </span>
                      <p className="font-medium text-white">{dailyChallenge.targetAnswer}</p>
                      <p className="text-[11px] text-slate-400 mt-1">{dailyChallenge.explanation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Badges Showcase Grid */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Award className="w-5 h-5 text-indigo-400" />
                <h3 className="font-black text-white text-lg">ארון התגים וההישגים (Milestone Badges)</h3>
              </div>
              <span className="text-xs text-slate-400 font-semibold">
                {profile.badges.length} מתוך {ALL_BADGES.length} פתוחים
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ALL_BADGES.map((b) => {
                const isUnlocked = profile.badges.includes(b.title);

                return (
                  <div
                    key={b.id}
                    className={`rounded-2xl p-4 border transition-all flex items-start gap-3.5 ${
                      isUnlocked
                        ? 'bg-slate-950/80 border-indigo-500/40 shadow-sm'
                        : 'bg-slate-950/30 border-slate-800/60 opacity-60'
                    }`}
                  >
                    <div
                      className={`text-2xl w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                        isUnlocked
                          ? 'bg-indigo-500/20 border-indigo-500/50'
                          : 'bg-slate-800/40 border-slate-700/40 grayscale'
                      }`}
                    >
                      {b.icon}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4
                          className={`font-bold text-sm ${
                            isUnlocked ? 'text-white' : 'text-slate-400'
                          }`}
                        >
                          {b.title}
                        </h4>
                        {isUnlocked && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                            פתוח ✓
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-snug">{b.description}</p>
                      <div className="text-[10px] text-amber-400 font-medium pt-1">
                        🎯 דרישה: {b.conditionDescription}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Leaderboard */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-white text-base">לוח אלופים עולמי (Leaderboard)</h3>
              </div>
              <span className="text-[11px] text-slate-500 font-semibold">חי מסונכרן</span>
            </div>

            <div className="space-y-3">
              {leaderboard.map((user, idx) => {
                const isCurrent =
                  user.uid === profile.uid || (currentUser && user.uid === currentUser.uid);

                return (
                  <div
                    key={user.uid}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      isCurrent
                        ? 'bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-500/10'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                          idx === 0
                            ? 'bg-yellow-400 text-slate-950'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-950'
                            : idx === 2
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {idx + 1}
                      </div>

                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt=""
                          className="w-9 h-9 rounded-xl object-cover border border-slate-700"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs border border-slate-700">
                          {user.displayName?.charAt(0) || 'U'}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-xs font-bold ${
                              isCurrent ? 'text-amber-300 font-black' : 'text-slate-200'
                            }`}
                          >
                            {user.displayName}
                          </span>
                          {isCurrent && (
                            <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1 rounded">
                              אתה
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block">{user.levelTitle}</span>
                      </div>
                    </div>

                    <div className="text-left">
                      <div className="text-sm font-black text-amber-400">{user.points} XP</div>
                      <div className="text-[10px] text-orange-400 font-semibold flex items-center justify-end gap-0.5">
                        <Flame className="w-3 h-3 fill-orange-400" />
                        <span>{user.dailyStreak}d</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
