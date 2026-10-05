import { useState, useEffect, useCallback } from 'react';
import {
  MajorItem,
  PAOItem,
  PegShapeItem,
  BodyPegItem,
  MemoryPalace,
  PersonFaceCard,
  AbstractShapeCard,
  PersonalContactAssociation,
  AcademicKeyPoint,
  TestResult,
  MentorChatMessage,
  DailyChallenge,
  AIFeedbackReport,
} from '../types/memory';
import {
  DEFAULT_MAJOR_DIGITS,
  DEFAULT_MAJOR_00_99,
  DEFAULT_PAO_ITEMS,
  DEFAULT_NUMBER_SHAPE_PEGS,
  DEFAULT_BODY_PEGS,
  DEFAULT_PALACES,
  DEFAULT_PEOPLE_CARDS,
  DEFAULT_ABSTRACT_SHAPES,
  DEFAULT_ACADEMIC_POINTS,
  DEFAULT_PERSONAL_ASSOCIATIONS,
} from '../data/defaultAssociations';
import { generateWordForConsonants } from '../lib/majorWordGenerator';
import {
  ALL_BADGES,
  BENCHMARK_LEADERBOARD,
  getDailyChallengeForToday,
  calculateLevel,
} from '../data/gamificationData';
import {
  auth,
  db,
  signInWithGoogle as firebaseGoogleSignIn,
  signOutUser as firebaseSignOut,
  getOrInitUserProfile,
  saveUserProfile,
  UserProfileData,
  fetchLeaderboard,
} from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';

const STORAGE_KEYS = {
  MAJOR_DIGITS: 'mem_major_digits_0_9_v3',
  MAJOR: 'mem_major_00_99_v4',
  PAO: 'mem_pao_items',
  SHAPES_PEGS: 'mem_number_shapes',
  BODY_PEGS: 'mem_body_pegs',
  PALACES: 'mem_palaces',
  PEOPLE: 'mem_people_cards',
  ABSTRACT_SHAPES: 'mem_abstract_shapes',
  ACADEMIC: 'mem_academic_points',
  PERSONAL_ASSOCIATIONS: 'mem_personal_associations',
  TEST_RESULTS: 'mem_test_results',
  MENTOR_CHAT: 'mem_mentor_chat',
  FEEDBACK: 'mem_ai_feedbacks',
  PROFILE: 'mem_offline_profile',
  DAILY_CHALLENGE: 'mem_daily_challenge',
};

const DEFAULT_OFFLINE_PROFILE: UserProfileData = {
  uid: 'offline-local-user',
  displayName: 'ספורטאי זיכרון',
  email: null,
  photoURL: null,
  points: 120,
  level: 1,
  levelTitle: 'שוליית מנמוניקה',
  badges: ['צעד ראשון בהיפוקמפוס'],
  dailyStreak: 1,
  lastChallengeDate: null,
  exercisesCompleted: 3,
};

export function useMemoryStore() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // User Profile & Gamification
  const [profile, setProfile] = useState<UserProfileData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return saved ? JSON.parse(saved) : DEFAULT_OFFLINE_PROFILE;
    } catch {
      return DEFAULT_OFFLINE_PROFILE;
    }
  });

  const [leaderboard, setLeaderboard] = useState<UserProfileData[]>(BENCHMARK_LEADERBOARD);

  // Daily Challenge
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DAILY_CHALLENGE);
      const today = getDailyChallengeForToday();
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.id === today.id) return parsed;
      }
      return today;
    } catch {
      return getDailyChallengeForToday();
    }
  });

  // AI Feedback Reports
  const [feedbackReports, setFeedbackReports] = useState<AIFeedbackReport[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FEEDBACK);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isAnalyzingFeedback, setIsAnalyzingFeedback] = useState(false);

  // 0. Major Digits (0-9)
  const [majorDigits, setMajorDigits] = useState<MajorItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MAJOR_DIGITS);
      return saved ? JSON.parse(saved) : DEFAULT_MAJOR_DIGITS;
    } catch {
      return DEFAULT_MAJOR_DIGITS;
    }
  });

  // 1. Major System
  const [majorItems, setMajorItems] = useState<MajorItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MAJOR);
      return saved ? JSON.parse(saved) : DEFAULT_MAJOR_00_99;
    } catch {
      return DEFAULT_MAJOR_00_99;
    }
  });

  // 2. PAO Items
  const [paoItems, setPaoItems] = useState<PAOItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PAO);
      return saved ? JSON.parse(saved) : DEFAULT_PAO_ITEMS;
    } catch {
      return DEFAULT_PAO_ITEMS;
    }
  });

  // 3. Shape Pegs
  const [shapePegs, setShapePegs] = useState<PegShapeItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SHAPES_PEGS);
      return saved ? JSON.parse(saved) : DEFAULT_NUMBER_SHAPE_PEGS;
    } catch {
      return DEFAULT_NUMBER_SHAPE_PEGS;
    }
  });

  // 4. Body Pegs
  const [bodyPegs, setBodyPegs] = useState<BodyPegItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BODY_PEGS);
      return saved ? JSON.parse(saved) : DEFAULT_BODY_PEGS;
    } catch {
      return DEFAULT_BODY_PEGS;
    }
  });

  // 5. Palaces
  const [palaces, setPalaces] = useState<MemoryPalace[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PALACES);
      return saved ? JSON.parse(saved) : DEFAULT_PALACES;
    } catch {
      return DEFAULT_PALACES;
    }
  });

  // 6. People Cards
  const [peopleCards, setPeopleCards] = useState<PersonFaceCard[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PEOPLE);
      return saved ? JSON.parse(saved) : DEFAULT_PEOPLE_CARDS;
    } catch {
      return DEFAULT_PEOPLE_CARDS;
    }
  });

  // 7. Abstract Shapes
  const [abstractShapes, setAbstractShapes] = useState<AbstractShapeCard[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ABSTRACT_SHAPES);
      return saved ? JSON.parse(saved) : DEFAULT_ABSTRACT_SHAPES;
    } catch {
      return DEFAULT_ABSTRACT_SHAPES;
    }
  });

  // 8. Academic Points
  const [academicPoints, setAcademicPoints] = useState<AcademicKeyPoint[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACADEMIC);
      return saved ? JSON.parse(saved) : DEFAULT_ACADEMIC_POINTS;
    } catch {
      return DEFAULT_ACADEMIC_POINTS;
    }
  });

  // 9. Personal Associations
  const [personalAssociations, setPersonalAssociations] = useState<PersonalContactAssociation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PERSONAL_ASSOCIATIONS);
      return saved ? JSON.parse(saved) : DEFAULT_PERSONAL_ASSOCIATIONS;
    } catch {
      return DEFAULT_PERSONAL_ASSOCIATIONS;
    }
  });

  // 10. Test Results
  const [testResults, setTestResults] = useState<TestResult[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TEST_RESULTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 11. Mentor Chat Messages
  const [chatMessages, setChatMessages] = useState<MentorChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MENTOR_CHAT);
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: 'welcome',
              role: 'assistant',
              content:
                'שלום אלוף! אני מאמן הזיכרון האישי שלך. אני מבוסס על המתודולוגיות המובילות של אלופי העולם: שיטת המקומות (ארמונות זיכרון), שיטת ה-Major בעברית, PAO, זיהוי שמות ועוגנים בפנים, ודחיסה קוגניטיבית קינטית. במה תרצה שנתאמן היום, או איזה מספר/טקסט תרצה שנמציא עבורו דימוי בלתי נשכח?',
              timestamp: Date.now(),
            },
          ];
    } catch {
      return [];
    }
  });

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DAILY_CHALLENGE, JSON.stringify(dailyChallenge));
  }, [dailyChallenge]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(feedbackReports));
  }, [feedbackReports]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MAJOR_DIGITS, JSON.stringify(majorDigits));
  }, [majorDigits]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MAJOR, JSON.stringify(majorItems));
  }, [majorItems]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PAO, JSON.stringify(paoItems));
  }, [paoItems]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SHAPES_PEGS, JSON.stringify(shapePegs));
  }, [shapePegs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BODY_PEGS, JSON.stringify(bodyPegs));
  }, [bodyPegs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PALACES, JSON.stringify(palaces));
  }, [palaces]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PEOPLE, JSON.stringify(peopleCards));
  }, [peopleCards]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ABSTRACT_SHAPES, JSON.stringify(abstractShapes));
  }, [abstractShapes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACADEMIC, JSON.stringify(academicPoints));
  }, [academicPoints]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PERSONAL_ASSOCIATIONS, JSON.stringify(personalAssociations));
  }, [personalAssociations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TEST_RESULTS, JSON.stringify(testResults));
  }, [testResults]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MENTOR_CHAT, JSON.stringify(chatMessages));
  }, [chatMessages]);

  // Auth Listener and Firestore Sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);

      if (user) {
        try {
          const userProf = await getOrInitUserProfile(user);
          setProfile(userProf);

          // Fetch palaces for user from Firestore
          const palacesCol = collection(db, 'palaces');
          const pq = query(palacesCol, where('userId', '==', user.uid));
          const pSnap = await getDocs(pq);
          if (!pSnap.empty) {
            const userPalaces: MemoryPalace[] = [];
            pSnap.forEach((doc) => userPalaces.push(doc.data() as MemoryPalace));
            setPalaces(userPalaces);
          } else {
            // First time: sync default palaces to Firestore for this user
            DEFAULT_PALACES.forEach(async (dp) => {
              await setDoc(doc(db, 'palaces', `${user.uid}_${dp.id}`), {
                ...dp,
                userId: user.uid,
                createdAt: Date.now(),
              });
            });
          }

          // Fetch personal associations for user
          const assocCol = collection(db, 'personal_associations');
          const aq = query(assocCol, where('userId', '==', user.uid));
          const aSnap = await getDocs(aq);
          if (!aSnap.empty) {
            const userAssocs: PersonalContactAssociation[] = [];
            aSnap.forEach((doc) => userAssocs.push(doc.data() as PersonalContactAssociation));
            setPersonalAssociations(userAssocs);
          }

          // Fetch or initialize user custom data (Major 00-99, PAO, Pegs, Cards, Academic)
          const customDataRef = doc(db, 'user_custom_data', user.uid);
          const customSnap = await getDoc(customDataRef);
          if (customSnap.exists()) {
            const cd = customSnap.data();
            if (cd.majorItems) setMajorItems(cd.majorItems);
            if (cd.paoItems) setPaoItems(cd.paoItems);
            if (cd.shapePegs) setShapePegs(cd.shapePegs);
            if (cd.bodyPegs) setBodyPegs(cd.bodyPegs);
            if (cd.peopleCards) setPeopleCards(cd.peopleCards);
            if (cd.abstractShapes) setAbstractShapes(cd.abstractShapes);
            if (cd.academicPoints) setAcademicPoints(cd.academicPoints);
            if (cd.majorDigits) setMajorDigits(cd.majorDigits);
          } else {
            // First time: upload local memory database to Firestore
            await setDoc(customDataRef, {
              userId: user.uid,
              majorItems,
              paoItems,
              shapePegs,
              bodyPegs,
              peopleCards,
              abstractShapes,
              academicPoints,
              majorDigits,
              updatedAt: Date.now(),
            });
          }

          // Refresh leaderboard
          loadLeaderboard();
        } catch (err) {
          console.error('Error loading user Firestore data:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const liveUsers = await fetchLeaderboard(10);
      if (liveUsers.length > 0) {
        // Merge with benchmark champions
        const combined = [...liveUsers, ...BENCHMARK_LEADERBOARD]
          .filter((v, i, a) => a.findIndex((t) => t.uid === v.uid) === i)
          .sort((a, b) => b.points - a.points);
        setLeaderboard(combined);
      }
    } catch (e) {
      console.warn('Leaderboard fetch issue:', e);
    }
  };

  const loginWithGoogle = async () => {
    try {
      await firebaseGoogleSignIn();
    } catch (err) {
      console.error(err);
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut();
      setCurrentUser(null);
      setProfile(DEFAULT_OFFLINE_PROFILE);
    } catch (err) {
      console.error(err);
    }
  };

  // Gamification helpers
  const earnPoints = useCallback(
    (amount: number, reason?: string) => {
      setProfile((prev) => {
        const newPoints = prev.points + amount;
        const { level, title } = calculateLevel(newPoints);
        const newExercises = prev.exercisesCompleted + 1;

        // Check for badge unlocks
        const updatedBadges = [...prev.badges];
        if (!updatedBadges.includes('צעד ראשון בהיפוקמפוס') && newExercises >= 1) {
          updatedBadges.push('צעד ראשון בהיפוקמפוס');
        }
        if (!updatedBadges.includes('גרנד-מאסטר בינלאומי') && newPoints >= 1000) {
          updatedBadges.push('גרנד-מאסטר בינלאומי');
        }

        const updated: UserProfileData = {
          ...prev,
          points: newPoints,
          level,
          levelTitle: title,
          exercisesCompleted: newExercises,
          badges: updatedBadges,
        };

        if (currentUser) {
          saveUserProfile(updated);
        }
        return updated;
      });
    },
    [currentUser]
  );

  const unlockBadge = useCallback(
    (badgeTitle: string) => {
      setProfile((prev) => {
        if (prev.badges.includes(badgeTitle)) return prev;
        const updated: UserProfileData = {
          ...prev,
          badges: [...prev.badges, badgeTitle],
          points: prev.points + 40, // Bonus for badge
        };
        if (currentUser) {
          saveUserProfile(updated);
        }
        return updated;
      });
    },
    [currentUser]
  );

  const completeDailyChallenge = useCallback(
    (challengeId: string, reward: number) => {
      setDailyChallenge((prev) => ({ ...prev, completed: true }));
      earnPoints(reward, 'השלמת אתגר יומי');

      setProfile((prev) => {
        const todayStr = new Date().toISOString().split('T')[0];
        const isConsecutive = prev.lastChallengeDate !== todayStr;
        const newStreak = isConsecutive ? prev.dailyStreak + 1 : prev.dailyStreak;

        const updatedBadges = [...prev.badges];
        if (newStreak >= 3 && !updatedBadges.includes('להבת ההתמדה (Streak)')) {
          updatedBadges.push('להבת ההתמדה (Streak)');
        }

        const updated: UserProfileData = {
          ...prev,
          dailyStreak: newStreak,
          lastChallengeDate: todayStr,
          badges: updatedBadges,
        };
        if (currentUser) {
          saveUserProfile(updated);
        }
        return updated;
      });
    },
    [earnPoints, currentUser]
  );

  // Palaces mutations
  const addMemoryPalace = async (
    name: string,
    description: string,
    category: 'home' | 'work' | 'campus' | 'outdoor' | 'custom'
  ) => {
    const palaceId = `palace-${Date.now()}`;
    const newPalace: MemoryPalace = {
      id: palaceId,
      name,
      description,
      icon: category === 'home' ? 'Home' : category === 'campus' ? 'GraduationCap' : 'Building',
      category,
      isPermanent: true,
      loci: [],
    };

    setPalaces((prev) => [...prev, newPalace]);
    earnPoints(30, 'יצירת ארמון זיכרון');

    if (currentUser) {
      try {
        await setDoc(doc(db, 'palaces', `${currentUser.uid}_${palaceId}`), {
          ...newPalace,
          userId: currentUser.uid,
          createdAt: Date.now(),
        });
      } catch (err) {
        console.error('Error saving palace to Firestore:', err);
      }
    }
    return newPalace;
  };

  const deletePalace = async (palaceId: string) => {
    setPalaces((prev) => prev.filter((p) => p.id !== palaceId));
    if (currentUser) {
      try {
        await deleteDoc(doc(db, 'palaces', `${currentUser.uid}_${palaceId}`));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const addPalaceLocus = async (
    palaceId: string,
    title: string,
    roomName: string,
    positionDescription: string,
    storedContent?: string,
    mnemonicScene?: string
  ) => {
    let updatedLociCount = 0;
    setPalaces((prev) =>
      prev.map((palace) => {
        if (palace.id !== palaceId) return palace;
        const newStep = palace.loci.length + 1;
        const newLocus = {
          id: `locus-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          stepNumber: newStep,
          roomName,
          title,
          positionDescription,
          storedContent,
          mnemonicScene,
        };
        const nextLoci = [...palace.loci, newLocus];
        updatedLociCount = nextLoci.length;

        // Check palace architect badge
        if (nextLoci.length >= 5) {
          unlockBadge('ארכיטקט ארמונות');
        }

        const updatedPalace = { ...palace, loci: nextLoci };

        // Save to Firestore
        if (currentUser) {
          setDoc(
            doc(db, 'palaces', `${currentUser.uid}_${palaceId}`),
            { ...updatedPalace, userId: currentUser.uid, updatedAt: Date.now() },
            { merge: true }
          );
        }

        return updatedPalace;
      })
    );

    earnPoints(15, 'הוספת תחנה לארמון');
  };

  const updatePalaceLocus = (palaceId: string, locusId: string, updates: any) => {
    setPalaces((prev) =>
      prev.map((palace) => {
        if (palace.id !== palaceId) return palace;
        const updatedPalace = {
          ...palace,
          loci: palace.loci.map((loc) => (loc.id === locusId ? { ...loc, ...updates } : loc)),
        };

        if (currentUser) {
          setDoc(
            doc(db, 'palaces', `${currentUser.uid}_${palaceId}`),
            { ...updatedPalace, userId: currentUser.uid, updatedAt: Date.now() },
            { merge: true }
          );
        }

        return updatedPalace;
      })
    );
  };

  const togglePalaceLocusReady = (palaceId: string, locusId: string, explicitState?: boolean) => {
    setPalaces((prev) =>
      prev.map((palace) => {
        if (palace.id !== palaceId) return palace;
        const updatedPalace = {
          ...palace,
          loci: palace.loci.map((loc) => {
            if (loc.id !== locusId) return loc;
            const nextState = explicitState !== undefined ? explicitState : !loc.is_ready_for_practice;
            return { ...loc, is_ready_for_practice: nextState };
          }),
        };

        if (currentUser) {
          setDoc(
            doc(db, 'palaces', `${currentUser.uid}_${palaceId}`),
            { ...updatedPalace, userId: currentUser.uid, updatedAt: Date.now() },
            { merge: true }
          );
        }

        return updatedPalace;
      })
    );
  };

  const setAllPalaceLociReady = (palaceId: string, ready: boolean) => {
    setPalaces((prev) =>
      prev.map((palace) => {
        if (palace.id !== palaceId) return palace;
        const updatedPalace = {
          ...palace,
          loci: palace.loci.map((loc) => ({ ...loc, is_ready_for_practice: ready })),
        };

        if (currentUser) {
          setDoc(
            doc(db, 'palaces', `${currentUser.uid}_${palaceId}`),
            { ...updatedPalace, userId: currentUser.uid, updatedAt: Date.now() },
            { merge: true }
          );
        }

        return updatedPalace;
      })
    );
  };

  const deletePalaceLocus = (palaceId: string, locusId: string) => {
    setPalaces((prev) =>
      prev.map((palace) => {
        if (palace.id !== palaceId) return palace;
        const nextLoci = palace.loci
          .filter((loc) => loc.id !== locusId)
          .map((loc, idx) => ({ ...loc, stepNumber: idx + 1 }));

        const updatedPalace = { ...palace, loci: nextLoci };

        if (currentUser) {
          setDoc(
            doc(db, 'palaces', `${currentUser.uid}_${palaceId}`),
            { ...updatedPalace, userId: currentUser.uid, updatedAt: Date.now() },
            { merge: true }
          );
        }

        return updatedPalace;
      })
    );
  };

  // Personal Associations mutations
  const addPersonalAssociation = async (
    targetSubject: string,
    storedNumberOrFact: string,
    encodedMnemonic: string,
    methodUsed: 'major' | 'pao' | 'palace' | 'pegs' | 'link'
  ) => {
    const id = `pca-${Date.now()}`;
    const newItem: PersonalContactAssociation = {
      id,
      targetSubject,
      storedNumberOrFact,
      encodedMnemonic,
      methodUsed,
      createdAt: Date.now(),
      successCount: 0,
      failCount: 0,
    };
    setPersonalAssociations((prev) => {
      const next = [newItem, ...prev];
      if (next.length >= 4) {
        unlockBadge('מאסטר האסוציאציות');
      }
      return next;
    });

    earnPoints(25, 'קידוד אסוציאציה אישית');

    if (currentUser) {
      try {
        await setDoc(doc(db, 'personal_associations', `${currentUser.uid}_${id}`), {
          ...newItem,
          userId: currentUser.uid,
        });
      } catch (err) {
        console.error('Error saving association to Firestore:', err);
      }
    }
    return newItem;
  };

  const deletePersonalAssociation = async (id: string) => {
    setPersonalAssociations((prev) => prev.filter((item) => item.id !== id));
    if (currentUser) {
      try {
        await deleteDoc(doc(db, 'personal_associations', `${currentUser.uid}_${id}`));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const updatePersonalAssociation = (id: string, updates: Partial<PersonalContactAssociation>) => {
    setPersonalAssociations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  // Test Results
  const addTestResult = async (result: Omit<TestResult, 'id' | 'timestamp'>) => {
    const id = `test-${Date.now()}`;
    const newResult: TestResult = {
      id,
      timestamp: Date.now(),
      ...result,
    };
    setTestResults((prev) => [newResult, ...prev]);

    // Points calculation based on score
    const pointsGained = Math.round((result.score / 100) * 35);
    earnPoints(pointsGained, 'מבחן שליפה פעילה');

    if (result.score >= 95) {
      unlockBadge('דיוק פנומנלי בשפה חופשית');
    }

    if (currentUser) {
      try {
        await setDoc(doc(db, 'test_results', `${currentUser.uid}_${id}`), {
          ...newResult,
          userId: currentUser.uid,
        });
      } catch (err) {
        console.error('Error saving test result to Firestore:', err);
      }
    }
    return newResult;
  };

  // AI Feedback Generation
  const generateFeedbackAnalysis = async () => {
    setIsAnalyzingFeedback(true);
    try {
      const stats = {
        totalTests: testResults.length,
        avgScore:
          testResults.length > 0
            ? Math.round(testResults.reduce((a, b) => a + b.score, 0) / testResults.length)
            : 85,
        personalAssociationsCount: personalAssociations.length,
        palacesCount: palaces.length,
        totalLoci: palaces.reduce((acc, p) => acc + p.loci.length, 0),
        points: profile.points,
      };

      const res = await fetch('/api/gemini/analyze-performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testHistory: testResults.slice(0, 15),
          stats,
          userLevel: profile.levelTitle,
          badges: profile.badges,
        }),
      });

      const data = await res.json();
      const report: AIFeedbackReport = {
        id: `feedback-${Date.now()}`,
        createdAt: Date.now(),
        executiveSummary: data.executiveSummary,
        strengths: data.strengths || [],
        weaknesses: data.weaknesses || [],
        recommendations: data.recommendations || [],
        cognitiveScores: data.cognitiveScores || {
          spatialNavigation: 80,
          kineticEncoding: 85,
          phoneticDecoding: 78,
          activeRecallSpeed: 82,
          longTermRetention: 75,
        },
        nextTrainingPlan: data.nextTrainingPlan,
      };

      setFeedbackReports((prev) => [report, ...prev]);

      if (currentUser) {
        try {
          await setDoc(doc(db, 'ai_feedbacks', `${currentUser.uid}_${report.id}`), {
            ...report,
            userId: currentUser.uid,
          });
        } catch (err) {
          console.error('Error saving feedback to Firestore:', err);
        }
      }
    } catch (err) {
      console.error('Feedback analysis error:', err);
    } finally {
      setIsAnalyzingFeedback(false);
    }
  };

  // Major Digits & System Updates
  const updateMajorDigit = (
    digit: number,
    consonants: string,
    defaultWord: string,
    imageHint: string
  ) => {
    setMajorDigits((prev) =>
      prev.map((d) =>
        d.number === digit
          ? {
              ...d,
              consonants,
              userConsonants: consonants,
              defaultWord,
              userWord: defaultWord,
              imageHint,
              userImageHint: imageHint,
            }
          : d
      )
    );
    earnPoints(15, `התאמת ספרת יסוד ${digit} ועיצוריה`);
  };

  const resetMajorDigit = (digit: number) => {
    const original = DEFAULT_MAJOR_DIGITS.find((d) => d.number === digit);
    if (!original) return;
    setMajorDigits((prev) => prev.map((d) => (d.number === digit ? { ...original } : d)));
  };

  const recalculateMajor00_99FromDigits = (customDigits?: MajorItem[]) => {
    const activeDigits = customDigits && customDigits.length > 0 ? customDigits : majorDigits;
    setMajorItems((prev) =>
      prev.map((item) => {
        const num = item.number;
        let newConsonants = '';
        let newWord = item.userWord || item.defaultWord;
        let newHint = item.userImageHint || item.imageHint;
        let newNumberStr = item.numberStr;

        // Numbers 0 to 9 are single digits (1, 2, 3...) without prepending 0 or consonant 'ס'
        if (num >= 0 && num <= 9) {
          const singleDigitObj =
            activeDigits.find((d) => d.number === num) ||
            DEFAULT_MAJOR_DIGITS.find((d) => d.number === num);
          const singleCons = singleDigitObj
            ? singleDigitObj.userConsonants || singleDigitObj.consonants
            : '';
          newConsonants = singleCons;
          newNumberStr = `${num}`;
          // For single digits, naturally use their direct word & visual hint (סוס, לב, פה, כוס וכו')
          if (singleDigitObj) {
            newWord = singleDigitObj.userWord || singleDigitObj.defaultWord;
            newHint = singleDigitObj.userImageHint || singleDigitObj.imageHint;
          }
        } else if (num >= 10 && num <= 99) {
          const tens = Math.floor(num / 10);
          const units = num % 10;
          const tensDigit =
            activeDigits.find((d) => d.number === tens) ||
            DEFAULT_MAJOR_DIGITS.find((d) => d.number === tens);
          const unitsDigit =
            activeDigits.find((d) => d.number === units) ||
            DEFAULT_MAJOR_DIGITS.find((d) => d.number === units);

          const defaultTensObj = DEFAULT_MAJOR_DIGITS.find((d) => d.number === tens);
          const defaultUnitsObj = DEFAULT_MAJOR_DIGITS.find((d) => d.number === units);

          const tensCons = tensDigit ? tensDigit.userConsonants || tensDigit.consonants : '';
          const unitsCons = unitsDigit ? unitsDigit.userConsonants || unitsDigit.consonants : '';
          newConsonants = tensCons && unitsCons ? `${tensCons} + ${unitsCons}` : tensCons || unitsCons || '';
          newNumberStr = `${num}`;

          const default00_99Item = DEFAULT_MAJOR_00_99.find((d) => d.number === num);
          const isStandardConsonants =
            defaultTensObj &&
            defaultUnitsObj &&
            tensCons === defaultTensObj.consonants &&
            unitsCons === defaultUnitsObj.consonants;

          if (isStandardConsonants && default00_99Item) {
            newWord = default00_99Item.defaultWord;
            newHint = default00_99Item.imageHint;
          } else {
            // Generate a creative mnemonic Hebrew word and visual kinetic hint based on the letters!
            const generated = generateWordForConsonants(tensCons, unitsCons, num);
            newWord = generated.word;
            newHint = generated.hint;
          }
        } else {
          const s = item.numberStr || String(num);
          const parts = s
            .split('')
            .map((ch) => {
              const digit = parseInt(ch, 10);
              if (isNaN(digit)) return '';
              const digitObj =
                activeDigits.find((d) => d.number === digit) ||
                DEFAULT_MAJOR_DIGITS.find((d) => d.number === digit);
              return digitObj ? digitObj.userConsonants || digitObj.consonants : '';
            })
            .filter(Boolean);
          newConsonants = parts.join(' + ');
        }

        return {
          ...item,
          numberStr: newNumberStr,
          consonants: newConsonants,
          userConsonants: newConsonants,
          defaultWord: newWord,
          userWord: newWord,
          imageHint: newHint,
          userImageHint: newHint,
        };
      })
    );
    earnPoints(25, 'החלת אותיות הספרות ומילים חדשות על רשימת 00-99');
  };

  const updateMajorItem = (
    number: number,
    updates: {
      userWord?: string;
      userConsonants?: string;
      userImageHint?: string;
      customNotes?: string;
      is_ready_for_practice?: boolean;
    }
  ) => {
    setMajorItems((prev) =>
      prev.map((item) => (item.number === number ? { ...item, ...updates } : item))
    );
    if (updates.userWord || updates.userImageHint) {
      earnPoints(10, 'התאמת אסוציאציית Major אישית');
    }
  };

  const toggleMajorReady = (number: number, explicitState?: boolean) => {
    setMajorItems((prev) =>
      prev.map((item) => {
        if (item.number !== number) return item;
        const nextState = explicitState !== undefined ? explicitState : !item.is_ready_for_practice;
        return { ...item, is_ready_for_practice: nextState };
      })
    );
  };

  const setAllMajorReady = (ready: boolean, numbers?: number[]) => {
    setMajorItems((prev) =>
      prev.map((item) => {
        if (!numbers || numbers.includes(item.number)) {
          return { ...item, is_ready_for_practice: ready };
        }
        return item;
      })
    );
  };

  const resetMajorItem = (number: number) => {
    const original = DEFAULT_MAJOR_00_99.find((item) => item.number === number);
    if (!original) return;
    setMajorItems((prev) => prev.map((item) => (item.number === number ? { ...original } : item)));
  };

  const updatePAOItem = (
    number: number,
    updates: { userPerson?: string; userAction?: string; userObject?: string; is_ready_for_practice?: boolean }
  ) => {
    setPaoItems((prev) => {
      const exists = prev.some((p) => p.number === number);
      if (exists) {
        return prev.map((p) => (p.number === number ? { ...p, ...updates } : p));
      } else {
        const numStr = number < 10 ? `0${number}` : `${number}`;
        return [
          ...prev,
          {
            number,
            numberStr: numStr,
            person: updates.userPerson || '',
            action: updates.userAction || '',
            object: updates.userObject || '',
            ...updates,
          },
        ].sort((a, b) => a.number - b.number);
      }
    });
    if (updates.userPerson || updates.userAction || updates.userObject) {
      earnPoints(15, 'התאמת שלשת PAO אישית');
    }
  };

  const togglePAOReady = (number: number, explicitState?: boolean) => {
    setPaoItems((prev) =>
      prev.map((item) => {
        if (item.number !== number) return item;
        const nextState = explicitState !== undefined ? explicitState : !item.is_ready_for_practice;
        return { ...item, is_ready_for_practice: nextState };
      })
    );
  };

  const setAllPAOReady = (ready: boolean, numbers?: number[]) => {
    setPaoItems((prev) =>
      prev.map((item) => {
        if (!numbers || numbers.includes(item.number)) {
          return { ...item, is_ready_for_practice: ready };
        }
        return item;
      })
    );
  };

  const resetPAOItem = (number: number) => {
    const original = DEFAULT_PAO_ITEMS.find((p) => p.number === number);
    if (!original) return;
    setPaoItems((prev) => prev.map((p) => (p.number === number ? { ...original } : p)));
  };

  const updateBodyPeg = (
    index: number,
    updates: { userObject?: string; userBodyPart?: string; userKineticTip?: string }
  ) => {
    setBodyPegs((prev) =>
      prev.map((bp) => (bp.index === index ? { ...bp, ...updates } : bp))
    );
    earnPoints(5, 'התאמת מתלה גוף אישי');
  };

  const resetBodyPeg = (index: number) => {
    const original = DEFAULT_BODY_PEGS.find((p) => p.index === index);
    if (!original) return;
    setBodyPegs((prev) => prev.map((bp) => (bp.index === index ? { ...original } : bp)));
  };

  const updateShapePeg = (
    number: number,
    updates: { userObject?: string; userShapeName?: string; userKineticTip?: string }
  ) => {
    setShapePegs((prev) =>
      prev.map((sp) => (sp.number === number ? { ...sp, ...updates } : sp))
    );
    earnPoints(5, 'התאמת מתלה צורה אישי');
  };

  const resetShapePeg = (number: number) => {
    const original = DEFAULT_NUMBER_SHAPE_PEGS.find((p) => p.number === number);
    if (!original) return;
    setShapePegs((prev) => prev.map((sp) => (sp.number === number ? { ...original } : sp)));
  };

  const addMajorItem = (item: MajorItem) => {
    setMajorItems((prev) => {
      const exists = prev.some((x) => x.number === item.number);
      if (exists) {
        return prev.map((x) => (x.number === item.number ? item : x));
      }
      return [...prev, item].sort((a, b) => a.number - b.number);
    });
    earnPoints(15, `הוספת מספר Major חדש (${item.numberStr})`);
  };

  const deleteMajorItem = (number: number) => {
    setMajorItems((prev) => prev.filter((item) => item.number !== number));
  };

  const addPAOItem = (item: PAOItem) => {
    setPaoItems((prev) => {
      const exists = prev.some((x) => x.number === item.number);
      if (exists) {
        return prev.map((x) => (x.number === item.number ? item : x));
      }
      return [...prev, item].sort((a, b) => a.number - b.number);
    });
    earnPoints(15, `הוספת שלשת PAO (${item.numberStr})`);
  };

  const deletePAOItem = (number: number) => {
    setPaoItems((prev) => prev.filter((item) => item.number !== number));
  };

  const addShapePeg = (item: PegShapeItem) => {
    setShapePegs((prev) => {
      const exists = prev.some((x) => x.number === item.number);
      if (exists) {
        return prev.map((x) => (x.number === item.number ? item : x));
      }
      return [...prev, item].sort((a, b) => a.number - b.number);
    });
    earnPoints(10, `הוספת מתלה צורה (${item.number})`);
  };

  const deleteShapePeg = (number: number) => {
    setShapePegs((prev) => prev.filter((item) => item.number !== number));
  };

  const addBodyPeg = (item: BodyPegItem) => {
    setBodyPegs((prev) => {
      const exists = prev.some((x) => x.index === item.index);
      if (exists) {
        return prev.map((x) => (x.index === item.index ? item : x));
      }
      return [...prev, item].sort((a, b) => a.index - b.index);
    });
    earnPoints(10, `הוספת מתלה גוף (${item.index})`);
  };

  const deleteBodyPeg = (index: number) => {
    setBodyPegs((prev) => prev.filter((item) => item.index !== index));
  };

  const addPersonFaceCard = (person: Omit<PersonFaceCard, 'id'>) => {
    const newPerson: PersonFaceCard = {
      id: `person-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ...person,
    };
    setPeopleCards((prev) => [newPerson, ...prev]);
    earnPoints(20, 'הוספת שם ופנים');
    return newPerson;
  };

  const updatePersonFaceCard = (id: string, updates: Partial<PersonFaceCard>) => {
    setPeopleCards((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    if (updates.name || updates.morphologicalAnchor || updates.mnemonicScene) {
      earnPoints(10, 'עדכון כרטיס שם ופנים');
    }
  };

  const togglePersonReady = (id: string, explicitState?: boolean) => {
    setPeopleCards((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const nextState = explicitState !== undefined ? explicitState : !p.is_ready_for_practice;
        return { ...p, is_ready_for_practice: nextState };
      })
    );
  };

  const setAllPeopleReady = (ready: boolean) => {
    setPeopleCards((prev) => prev.map((p) => ({ ...p, is_ready_for_practice: ready })));
  };

  const togglePersonalAssociationReady = (id: string, explicitState?: boolean) => {
    setPersonalAssociations((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const nextState = explicitState !== undefined ? explicitState : !a.is_ready_for_practice;
        return { ...a, is_ready_for_practice: nextState };
      })
    );
  };

  const toggleShapePegReady = (number: number, explicitState?: boolean) => {
    setShapePegs((prev) =>
      prev.map((sp) => {
        if (sp.number !== number) return sp;
        const nextState = explicitState !== undefined ? explicitState : !sp.is_ready_for_practice;
        return { ...sp, is_ready_for_practice: nextState };
      })
    );
  };

  const toggleBodyPegReady = (index: number, explicitState?: boolean) => {
    setBodyPegs((prev) =>
      prev.map((bp) => {
        if (bp.index !== index) return bp;
        const nextState = explicitState !== undefined ? explicitState : !bp.is_ready_for_practice;
        return { ...bp, is_ready_for_practice: nextState };
      })
    );
  };

  const deletePersonFaceCard = (id: string) => {
    setPeopleCards((prev) => prev.filter((p) => p.id !== id));
  };

  const resetPersonFaceCards = () => {
    setPeopleCards(DEFAULT_PEOPLE_CARDS);
  };

  const addAbstractShape = (shape: Omit<AbstractShapeCard, 'id'>) => {
    const newShape: AbstractShapeCard = {
      id: `shape-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ...shape,
    };
    setAbstractShapes((prev) => [newShape, ...prev]);
    earnPoints(20, 'הוספת צורה/מרקם');
    return newShape;
  };

  const updateAbstractShape = (id: string, updates: Partial<AbstractShapeCard>) => {
    setAbstractShapes((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    earnPoints(10, 'עדכון צורה ומרקם');
  };

  const deleteAbstractShape = (id: string) => {
    setAbstractShapes((prev) => prev.filter((s) => s.id !== id));
  };

  const resetAbstractShapes = () => {
    setAbstractShapes(DEFAULT_ABSTRACT_SHAPES);
  };

  const addAcademicPoint = (point: Omit<AcademicKeyPoint, 'id'>) => {
    const newPoint: AcademicKeyPoint = {
      id: `academic-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ...point,
    };
    setAcademicPoints((prev) => [newPoint, ...prev]);
    earnPoints(25, 'הוספת מושג אקדמי');
    return newPoint;
  };

  const updateAcademicPoint = (id: string, updates: Partial<AcademicKeyPoint>) => {
    setAcademicPoints((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    earnPoints(10, 'עדכון מושג אקדמי');
  };

  const deleteAcademicPoint = (id: string) => {
    setAcademicPoints((prev) => prev.filter((p) => p.id !== id));
  };

  const resetAcademicPoints = () => {
    setAcademicPoints(DEFAULT_ACADEMIC_POINTS);
  };

  const addChatMessage = (role: 'user' | 'assistant', content: string) => {
    const msg: MentorChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      role,
      content,
      timestamp: Date.now(),
    };
    setChatMessages((prev) => [...prev, msg]);
    return msg;
  };

  const resetToDefaults = () => {
    if (window.confirm('האם אתה בטוח שברצונך לאפס את כל הנתונים לברירת המחדל? פעולה זו תמחק שינויים אישיים.')) {
      setMajorDigits(DEFAULT_MAJOR_DIGITS);
      setMajorItems(DEFAULT_MAJOR_00_99);
      setPaoItems(DEFAULT_PAO_ITEMS);
      setShapePegs(DEFAULT_NUMBER_SHAPE_PEGS);
      setBodyPegs(DEFAULT_BODY_PEGS);
      setPalaces(DEFAULT_PALACES);
      setPeopleCards(DEFAULT_PEOPLE_CARDS);
      setAbstractShapes(DEFAULT_ABSTRACT_SHAPES);
      setAcademicPoints(DEFAULT_ACADEMIC_POINTS);
      setPersonalAssociations(DEFAULT_PERSONAL_ASSOCIATIONS);
      setTestResults([]);
      setFeedbackReports([]);
      setProfile(DEFAULT_OFFLINE_PROFILE);
      localStorage.clear();
    }
  };

  const syncAllToFirestore = async (): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) {
      return { success: false, message: 'עליך להתחבר עם חשבון Google כדי לסנכרן נתונים לענן' };
    }
    try {
      // 1. Sync User Profile
      await saveUserProfile(profile);

      // 2. Sync Palaces
      for (const p of palaces) {
        await setDoc(doc(db, 'palaces', `${currentUser.uid}_${p.id}`), {
          ...p,
          userId: currentUser.uid,
          updatedAt: Date.now(),
        });
      }

      // 3. Sync Personal Associations
      for (const a of personalAssociations) {
        await setDoc(doc(db, 'personal_associations', `${currentUser.uid}_${a.id}`), {
          ...a,
          userId: currentUser.uid,
        });
      }

      // 4. Sync Custom Memory Data (Major, PAO, Pegs, Cards, Academic)
      await setDoc(doc(db, 'user_custom_data', currentUser.uid), {
        userId: currentUser.uid,
        majorItems,
        paoItems,
        shapePegs,
        bodyPegs,
        peopleCards,
        abstractShapes,
        academicPoints,
        majorDigits,
        updatedAt: Date.now(),
      });

      return { success: true, message: 'כל הנתונים, הארמונות והשלשות סונכרנו בהצלחה לענן Firestore!' };
    } catch (err: any) {
      console.error('Manual sync error:', err);
      return { success: false, message: `שגיאה בסנכרון: ${err?.message || err}` };
    }
  };

  return {
    // Auth & Profile
    currentUser,
    isAuthLoading,
    profile,
    leaderboard,
    dailyChallenge,
    feedbackReports,
    isAnalyzingFeedback,
    loginWithGoogle,
    logout,
    syncAllToFirestore,
    earnPoints,
    unlockBadge,
    completeDailyChallenge,
    generateFeedbackAnalysis,

    // Data lists
    majorDigits,
    majorItems,
    paoItems,
    shapePegs,
    bodyPegs,
    palaces,
    peopleCards,
    abstractShapes,
    academicPoints,
    personalAssociations,
    testResults,
    chatMessages,

    // Actions
    updateMajorDigit,
    resetMajorDigit,
    recalculateMajor00_99FromDigits,
    addMajorItem,
    updateMajorItem,
    deleteMajorItem,
    resetMajorItem,
    toggleMajorReady,
    setAllMajorReady,
    addPAOItem,
    updatePAOItem,
    deletePAOItem,
    resetPAOItem,
    togglePAOReady,
    setAllPAOReady,
    addBodyPeg,
    updateBodyPeg,
    deleteBodyPeg,
    resetBodyPeg,
    toggleBodyPegReady,
    addShapePeg,
    updateShapePeg,
    deleteShapePeg,
    resetShapePeg,
    toggleShapePegReady,
    addPersonalAssociation,
    updatePersonalAssociation,
    deletePersonalAssociation,
    togglePersonalAssociationReady,
    addMemoryPalace,
    deletePalace,
    addPalaceLocus,
    updatePalaceLocus,
    deletePalaceLocus,
    togglePalaceLocusReady,
    setAllPalaceLociReady,
    addPersonFaceCard,
    updatePersonFaceCard,
    deletePersonFaceCard,
    resetPersonFaceCards,
    togglePersonReady,
    setAllPeopleReady,
    addAbstractShape,
    updateAbstractShape,
    deleteAbstractShape,
    resetAbstractShapes,
    addAcademicPoint,
    updateAcademicPoint,
    deleteAcademicPoint,
    resetAcademicPoints,
    addTestResult,
    addChatMessage,
    resetToDefaults,
  };
}
