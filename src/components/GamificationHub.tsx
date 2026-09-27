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
    <div className="max-w-6xl mx-auto space-y-8 pb-16 text-slate-900">
      {/* Top Profile & Progress Banner */}
      <div className="bg-white border-2 border-slate-200 border-b-6 border-b-slate-300 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={profile.displayName || 'משתמש'}
                  className="w-16 h-16 rounded-2xl border-2 border-[#58CC02] shadow-md object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-[#58CC02] border-b-4 border-[#46a302] flex items-center justify-center text-white font-black text-2xl shadow-md">
                  {profile.displayName?.charAt(0) || 'מ'}
                </div>
              )}
              <div className="absolute -bottom-1.5 -right-1.5 bg-[#FFC800] text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-lg border border-slate-900 shadow-sm">
                Lv.{levelInfo.level}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  {profile.displayName || 'ספורטאי זיכרון'}
                </h2>
                <span className="text-xs font-black px-3 py-1 rounded-xl bg-[#58CC02]/20 text-[#46a302] border border-[#58CC02]/40">
                  {levelInfo.title}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                {currentUser ? currentUser.email : 'משתמש מקומי (התחבר כדי לסנכרן לענן)'}
              </p>
            </div>
          </div>

          {/* Auth Button */}
          <div>
            {currentUser ? (
              <button
                onClick={onLogout}
                className="btn-duo-neutral flex items-center gap-2 px-4 py-2 text-xs cursor-pointer shadow-xs"
              >
                <LogOut className="w-4 h-4 text-slate-500" />
                <span>התנתק מחשבון</span>
              </button>
            ) : (
              <button
                onClick={onLogin}
                className="btn-duo-green flex items-center gap-2 px-5 py-2.5 text-xs cursor-pointer shadow-xs"
              >
                <LogIn className="w-4 h-4" />
                <span>התחבר עם Google לשמירה בענן</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t-2 border-slate-200">
          <div className="bg-slate-50 border-2 border-slate-200 border-b-4 rounded-2xl p-4 text-center shadow-2xs">
            <span className="text-xs text-slate-500 font-bold block mb-1">סך נקודות XP</span>
            <div className="text-2xl font-black text-amber-600">{profile.points}</div>
          </div>

          <div className="bg-slate-50 border-2 border-slate-200 border-b-4 rounded-2xl p-4 text-center shadow-2xs">
            <span className="text-xs text-slate-500 font-bold block mb-1">רצף ימים (Streak)</span>
            <div className="text-2xl font-black text-[#FF9600] flex items-center justify-center gap-1.5">
              <Flame className="w-5 h-5 fill-[#FF9600] text-[#FF9600] animate-bounce" />
              <span>{profile.dailyStreak} ימים</span>
            </div>
          </div>

          <div className="bg-slate-50 border-2 border-slate-200 border-b-4 rounded-2xl p-4 text-center shadow-2xs">
            <span className="text-xs text-slate-500 font-bold block mb-1">תגים שנפתחו</span>
            <div className="text-2xl font-black text-[#1CB0F6]">
              {profile.badges.length}/{ALL_BADGES.length}
            </div>
          </div>

          <div className="bg-slate-50 border-2 border-slate-200 border-b-4 rounded-2xl p-4 text-center shadow-2xs">
            <span className="text-xs text-slate-500 font-bold block mb-1">תרגילים שהושלמו</span>
            <div className="text-2xl font-black text-[#58CC02]">{profile.exercisesCompleted}</div>
          </div>
        </div>

        {/* Level Progress Bar */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 font-bold">
              התקדמות לדרגה הבאה: <strong className="text-slate-900">דרגה {levelInfo.level + 1}</strong>
            </span>
            <span className="text-[#58CC02] font-black">{progressPercent}%</span>
          </div>
          <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden p-0.5 border-2 border-slate-200">
            <div
              className="h-full bg-[#58CC02] rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Daily Challenge & Badges */}
        <div className="lg:col-span-2 space-y-8">
          {/* Daily Challenge Card */}
          <div className="bg-white border-2 border-slate-200 border-b-6 border-b-slate-300 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-200">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                    {dailyChallenge.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">{dailyChallenge.subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1 rounded-full text-xs font-black">
                <Sparkles className="w-3.5 h-3.5" />
                <span>+{dailyChallenge.rewardPoints} XP</span>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <p className="text-sm text-slate-700 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-200">
                {dailyChallenge.description}
              </p>

              <div className="text-xs text-amber-800 font-semibold bg-amber-50 border border-amber-200 p-3 rounded-xl">
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
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-400"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="btn-duo-green flex items-center gap-2 px-6 py-2.5 text-xs cursor-pointer shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>הגש פתרון וקבל +{dailyChallenge.rewardPoints} XP</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2 animate-fadeIn">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>אתגר היום הושלם בהצלחה! נקודות ה-XP נוספו לרקורד שלך.</span>
                  </div>
                  {showAnswer && (
                    <div className="text-xs text-slate-700 pt-2 border-t border-emerald-200">
                      <span className="font-bold text-emerald-800 block mb-1">
                        התשובה המנמונית המובילה:
                      </span>
                      <p className="font-semibold text-slate-900">{dailyChallenge.targetAnswer}</p>
                      <p className="text-[11px] text-slate-500 mt-1">{dailyChallenge.explanation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Badges Showcase Grid */}
          <div className="bg-white border-2 border-slate-200 border-b-6 border-b-slate-300 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <Award className="w-5 h-5 text-indigo-600" />
                <h3 className="font-black text-slate-900 text-lg">ארון התגים וההישגים (Milestone Badges)</h3>
              </div>
              <span className="text-xs text-slate-500 font-semibold">
                {profile.badges.length} מתוך {ALL_BADGES.length} פתוחים
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ALL_BADGES.map((b) => {
                const isUnlocked = profile.badges.includes(b.title);

                return (
                  <div
                    key={b.id}
                    className={`rounded-2xl p-4 border transition-all flex items-start gap-3.5 shadow-2xs ${
                      isUnlocked
                        ? 'bg-indigo-50/50 border-indigo-200 shadow-xs'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div
                      className={`text-2xl w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                        isUnlocked
                          ? 'bg-indigo-100 border-indigo-300'
                          : 'bg-slate-200 border-slate-300 grayscale'
                      }`}
                    >
                      {b.icon}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4
                          className={`font-bold text-sm ${
                            isUnlocked ? 'text-slate-900' : 'text-slate-500'
                          }`}
                        >
                          {b.title}
                        </h4>
                        {isUnlocked && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold border border-emerald-300">
                            פתוח ✓
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-snug font-medium">{b.description}</p>
                      <div className="text-[10px] text-amber-700 font-semibold pt-1">
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
          <div className="bg-white border-2 border-slate-200 border-b-6 border-b-slate-300 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-slate-900 text-base">לוח אלופים עולמי (Leaderboard)</h3>
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
                        ? 'bg-amber-50 border-amber-300 shadow-sm'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-white'
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
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {idx + 1}
                      </div>

                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt=""
                          className="w-9 h-9 rounded-xl object-cover border border-slate-300"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs border border-slate-300">
                          {user.displayName?.charAt(0) || 'U'}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-xs font-bold ${
                              isCurrent ? 'text-amber-900 font-black' : 'text-slate-800'
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
                        <span className="text-[10px] text-slate-500 font-medium block">{user.levelTitle}</span>
                      </div>
                    </div>

                    <div className="text-left">
                      <div className="text-sm font-black text-amber-600">{user.points} XP</div>
                      <div className="text-[10px] text-orange-600 font-semibold flex items-center justify-end gap-0.5">
                        <Flame className="w-3 h-3 fill-orange-500 text-orange-500" />
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
