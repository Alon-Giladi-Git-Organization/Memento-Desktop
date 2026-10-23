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
import { DEFAULT_CONNECTING_LETTERS } from '../lib/hebrewLogicValidator';
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
  onAuthStateChanged,
  FirebaseUser,
  cleanForFirestore,
} from '../lib/firebase';
import {
  isNetworkOnline,
  performFullBidirectionalSync,
  seedAllDefaultsToFirestore,
  seedUserBranchFromDefaults,
  ensureUserBranchExists,
  startRealtimeCloudSync,
  mergeWithRemoteItems,
} from '../lib/cloudDbSync';

const STORAGE_KEYS = {
  CONNECTING_LETTERS: 'mem_connecting_letters_v1',
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
  LAST_SYNC: 'mem_last_cloud_sync_v1',
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

  // Network & Sync State (Local-first & Cloud Sync)
  const [isOnline, setIsOnline] = useState<boolean>(() => isNetworkOnline());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      return saved ? Number(saved) : null;
    } catch {
      return null;
    }
  });
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);

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

  // Connecting Letters (אותיות מקשרות ללא ערך מספרי)
  const [connectingLetters, setConnectingLetters] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONNECTING_LETTERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return DEFAULT_CONNECTING_LETTERS;
    } catch {
      return DEFAULT_CONNECTING_LETTERS;
    }
  });

  // 1. Major System
  const [majorItems, setMajorItems] = useState<MajorItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MAJOR);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter(
            (x: any) => typeof x?.number === 'number' && !isNaN(x.number) && isFinite(x.number) && x.numberStr !== 'NaN' && x.id !== 'NaN'
          );
          if (valid.length > 0) return valid;
        }
      }
      return DEFAULT_MAJOR_00_99;
    } catch {
      return DEFAULT_MAJOR_00_99;
    }
  });

  // 2. PAO Items
  const [paoItems, setPaoItems] = useState<PAOItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PAO);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter(
            (x: any) => typeof x?.number === 'number' && !isNaN(x.number) && isFinite(x.number) && x.numberStr !== 'NaN' && x.id !== 'NaN'
          );
          if (valid.length > 0) return valid;
        }
      }
      return DEFAULT_PAO_ITEMS;
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
    localStorage.setItem(STORAGE_KEYS.CONNECTING_LETTERS, JSON.stringify(connectingLetters));
  }, [connectingLetters]);

  useEffect(() => {
    const valid = majorItems.filter((x) => typeof x?.number === 'number' && !isNaN(x.number) && isFinite(x.number) && x.numberStr !== 'NaN');
    localStorage.setItem(STORAGE_KEYS.MAJOR, JSON.stringify(valid));
  }, [majorItems]);

  useEffect(() => {
    const valid = paoItems.filter((x) => typeof x?.number === 'number' && !isNaN(x.number) && isFinite(x.number) && x.numberStr !== 'NaN');
    try {
      localStorage.setItem(STORAGE_KEYS.PAO, JSON.stringify(valid));
    } catch (e) {
      console.warn('LocalStorage quota warning for PAO:', e);
    }
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

  // Network State Listener (Offline / Online detection)
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatusMessage('חיבור לאינטרנט זוהה - מבצע סנכרון דו-כיווני...');
      syncAllToFirestore(false);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatusMessage('מצב אופליין: עובד ללא אינטרנט. כל הנתונים נשמרים במכשיר.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial background sync check on startup if online
    if (isNetworkOnline()) {
      const timer = setTimeout(() => {
        syncAllToFirestore(false);
      }, 1200);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Multi-tenant Firestore Helpers for Rowy table compatibility:
  // Saves documents tagged with composite IDs (${userId}_${rawId}), userId, userEmail, and isDefault.
  const saveFirestoreDoc = useCallback(
    async (collectionName: string, rawId: string, itemData: any) => {
      if (!isNetworkOnline()) return;
      const docId = currentUser ? `${currentUser.uid}_${rawId}` : rawId;
      const payload = cleanForFirestore({
        ...itemData,
        id: docId,
        rawId,
        userId: currentUser?.uid || 'system_default',
        userEmail: currentUser?.email || '',
        isDefault: !currentUser,
        updatedAt: itemData.updatedAt || Date.now(),
      });
      try {
        await setDoc(doc(db, collectionName, docId), payload, { merge: true });
        console.log(`[Firestore DB] Document ${collectionName}/${docId} permanently saved successfully.`);
      } catch (err) {
        console.error(`[Firestore DB] Error saving ${collectionName}/${docId} to Firestore:`, err);
      }
    },
    [currentUser]
  );

  const deleteFirestoreDoc = useCallback(
    (collectionName: string, rawId: string) => {
      if (!isNetworkOnline()) return;
      const docId = currentUser ? `${currentUser.uid}_${rawId}` : rawId;
      deleteDoc(doc(db, collectionName, docId)).catch(() => {});
    },
    [currentUser]
  );

  // Continuous Real-Time Firestore Sync (onSnapshot)
  // Automatically mirrors edits from Rowy / Firebase Console directly into the active UI
  // When currentUser is logged in, listens only to that user's isolated branch
  useEffect(() => {
    // Purge any rogue NaN documents in Firestore pao_items and major_items
    try {
      deleteDoc(doc(db, 'pao_items', 'NaN')).catch(() => {});
      deleteDoc(doc(db, 'pao_items', 'nan')).catch(() => {});
      deleteDoc(doc(db, 'major_items', 'NaN')).catch(() => {});
      deleteDoc(doc(db, 'major_items', 'nan')).catch(() => {});
    } catch {
      // ignore
    }

    const unsubscribeRealtime = startRealtimeCloudSync(
      {
        onMajorItems: (items) => {
          setMajorItems((prev) =>
            mergeWithRemoteItems(prev, items, (i) => {
              const n = typeof i.number === 'number' && !isNaN(i.number) ? i.number : parseInt(String(i.numberStr || ''), 10);
              if (isNaN(n) || n < 0 || n > 99) return '';
              return (n < 10 ? `0${n}` : `${n}`).padStart(2, '0');
            })
          );
        },
        onPaoItems: (items) => {
          setPaoItems((prev) =>
            mergeWithRemoteItems(prev, items, (i) => {
              const n = typeof i.number === 'number' && !isNaN(i.number) ? i.number : parseInt(String(i.numberStr || ''), 10);
              if (isNaN(n) || n < 0 || n > 99) return '';
              return (n < 10 ? `0${n}` : `${n}`).padStart(2, '0');
            })
          );
        },
        onBodyPegs: (items) => {
          setBodyPegs((prev) => mergeWithRemoteItems(prev, items, (i) => String(i.index)));
        },
        onShapePegs: (items) => {
          setShapePegs((prev) => mergeWithRemoteItems(prev, items, (i) => String(i.number)));
        },
        onPalaces: (items) => {
          setPalaces((prev) => mergeWithRemoteItems(prev, items, (i) => i.id));
        },
        onPersonalAssociations: (items) => {
          setPersonalAssociations((prev) => mergeWithRemoteItems(prev, items, (i) => i.id));
        },
        onPeopleCards: (items) => {
          setPeopleCards((prev) => mergeWithRemoteItems(prev, items, (i) => i.id));
        },
        onAbstractShapes: (items) => {
          setAbstractShapes((prev) => mergeWithRemoteItems(prev, items, (i) => i.id));
        },
        onAcademicPoints: (items) => {
          setAcademicPoints((prev) => mergeWithRemoteItems(prev, items, (i) => i.id));
        },
      },
      currentUser?.uid
    );

    return () => {
      unsubscribeRealtime();
    };
  }, [currentUser?.uid]);

  // Auth Listener and Firestore Sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);

      if (user) {
        try {
          const userProf = await getOrInitUserProfile(user);
          setProfile(userProf);

          // Check if user has their own database branch in Firestore.
          // If this is a new user, automatically provisions their isolated branch populated with default data!
          setSyncStatusMessage('מאתחל ענף נתונים אישי בענן...');
          await ensureUserBranchExists(user.uid, user.email, {
            majorItems,
            paoItems,
            bodyPegs,
            shapePegs,
            palaces,
            peopleCards,
            abstractShapes,
            academicPoints,
            personalAssociations,
          });

          // Sync user branch
          syncAllToFirestore(false);
          loadLeaderboard();
        } catch (err) {
          console.error('Error in auth user profile initialization:', err);
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
      updatedAt: Date.now(),
    };

    setPalaces((prev) => [...prev, newPalace]);
    earnPoints(30, 'יצירת ארמון זיכרון');

    saveFirestoreDoc('palaces', palaceId, newPalace);
    return newPalace;
  };

  const deletePalace = async (palaceId: string) => {
    setPalaces((prev) => prev.filter((p) => p.id !== palaceId));
    deleteFirestoreDoc('palaces', palaceId);
  };

  const addPalaceLocus = async (
    palaceId: string,
    title: string,
    roomName: string,
    positionDescription: string,
    storedContent?: string,
    mnemonicScene?: string
  ) => {
    const now = Date.now();
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
          updatedAt: now,
        };
        const nextLoci = [...palace.loci, newLocus];

        // Check palace architect badge
        if (nextLoci.length >= 5) {
          unlockBadge('ארכיטקט ארמונות');
        }

        const updatedPalace = { ...palace, loci: nextLoci, updatedAt: now };
        saveFirestoreDoc('palaces', palaceId, updatedPalace);
        return updatedPalace;
      })
    );

    earnPoints(15, 'הוספת תחנה לארמון');
  };

  const updatePalaceLocus = (palaceId: string, locusId: string, updates: any) => {
    const now = Date.now();
    setPalaces((prev) =>
      prev.map((palace) => {
        if (palace.id !== palaceId) return palace;
        const updatedPalace = {
          ...palace,
          loci: palace.loci.map((loc) => (loc.id === locusId ? { ...loc, ...updates, updatedAt: now } : loc)),
          updatedAt: now,
        };
        saveFirestoreDoc('palaces', palaceId, updatedPalace);
        return updatedPalace;
      })
    );
  };

  const togglePalaceLocusReady = (palaceId: string, locusId: string, explicitState?: boolean) => {
    const now = Date.now();
    setPalaces((prev) =>
      prev.map((palace) => {
        if (palace.id !== palaceId) return palace;
        const updatedPalace = {
          ...palace,
          loci: palace.loci.map((loc) => {
            if (loc.id !== locusId) return loc;
            const nextState = explicitState !== undefined ? explicitState : !loc.is_ready_for_practice;
            return { ...loc, is_ready_for_practice: nextState, updatedAt: now };
          }),
          updatedAt: now,
        };
        saveFirestoreDoc('palaces', palaceId, updatedPalace);
        return updatedPalace;
      })
    );
  };

  const setAllPalaceLociReady = (palaceId: string, ready: boolean) => {
    const now = Date.now();
    setPalaces((prev) =>
      prev.map((palace) => {
        if (palace.id !== palaceId) return palace;
        const updatedPalace = {
          ...palace,
          loci: palace.loci.map((loc) => ({ ...loc, is_ready_for_practice: ready, updatedAt: now })),
          updatedAt: now,
        };
        saveFirestoreDoc('palaces', palaceId, updatedPalace);
        return updatedPalace;
      })
    );
  };

  const deletePalaceLocus = (palaceId: string, locusId: string) => {
    const now = Date.now();
    setPalaces((prev) =>
      prev.map((palace) => {
        if (palace.id !== palaceId) return palace;
        const nextLoci = palace.loci
          .filter((loc) => loc.id !== locusId)
          .map((loc, idx) => ({ ...loc, stepNumber: idx + 1 }));

        const updatedPalace = { ...palace, loci: nextLoci, updatedAt: now };
        saveFirestoreDoc('palaces', palaceId, updatedPalace);
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
    const now = Date.now();
    const newItem: PersonalContactAssociation = {
      id,
      targetSubject,
      storedNumberOrFact,
      encodedMnemonic,
      methodUsed,
      createdAt: now,
      updatedAt: now,
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
    saveFirestoreDoc('personal_associations', id, newItem);
    return newItem;
  };

  const deletePersonalAssociation = async (id: string) => {
    setPersonalAssociations((prev) => prev.filter((item) => item.id !== id));
    deleteFirestoreDoc('personal_associations', id);
  };

  const updatePersonalAssociation = (id: string, updates: Partial<PersonalContactAssociation>) => {
    const now = Date.now();
    let updatedItem: PersonalContactAssociation | null = null;
    setPersonalAssociations((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          updatedItem = { ...item, ...updates, updatedAt: now };
          return updatedItem;
        }
        return item;
      })
    );
    if (updatedItem) {
      saveFirestoreDoc('personal_associations', id, updatedItem);
    }
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
    const now = Date.now();
    let updatedItem: MajorItem | null = null;
    setMajorDigits((prev) =>
      prev.map((d) => {
        if (d.number === digit) {
          updatedItem = {
            ...d,
            consonants,
            defaultWord,
            imageHint,
            updatedAt: now,
          };
          return updatedItem;
        }
        return d;
      })
    );
    earnPoints(15, `התאמת ספרת יסוד ${digit} ועיצוריה`);
    if (updatedItem && isNetworkOnline()) {
      setDoc(doc(db, 'major_digits', String(digit)), updatedItem, { merge: true }).catch(() => {});
    }
  };

  const resetMajorDigit = (digit: number) => {
    const original = DEFAULT_MAJOR_DIGITS.find((d) => d.number === digit);
    if (!original) return;
    const now = Date.now();
    const updated = { ...original, updatedAt: now };
    setMajorDigits((prev) => prev.map((d) => (d.number === digit ? updated : d)));
    if (isNetworkOnline()) {
      setDoc(doc(db, 'major_digits', String(digit)), updated, { merge: true }).catch(() => {});
    }
  };

  const updateConnectingLetters = (letters: string[]) => {
    const cleaned = Array.from(new Set(letters.filter(Boolean)));
    setConnectingLetters(cleaned);
    try {
      localStorage.setItem(STORAGE_KEYS.CONNECTING_LETTERS, JSON.stringify(cleaned));
    } catch {}
    earnPoints(10, 'עדכון אותיות מקשרות');
    if (isNetworkOnline()) {
      setDoc(doc(db, 'app_settings', 'logic_rules'), { connectingLetters: cleaned, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
  };

  const recalculateMajor00_99FromDigits = (customDigits?: MajorItem[]) => {
    const activeDigits = customDigits && customDigits.length > 0 ? customDigits : majorDigits;
    setMajorItems((prev) =>
      prev.map((item) => {
        const num = item.number;
        let newConsonants = '';
        let newWord = item.defaultWord;
        let newHint = item.imageHint;
        let newNumberStr = item.numberStr;

        // Numbers 0 to 9 are single digits (1, 2, 3...) without prepending 0 or consonant 'ס'
        if (num >= 0 && num <= 9) {
          const singleDigitObj =
            activeDigits.find((d) => d.number === num) ||
            DEFAULT_MAJOR_DIGITS.find((d) => d.number === num);
          const singleCons = singleDigitObj ? singleDigitObj.consonants : '';
          newConsonants = singleCons;
          newNumberStr = `${num}`;
          // For single digits, naturally use their direct word & visual hint (סוס, לב, פה, כוס וכו')
          if (singleDigitObj) {
            newWord = singleDigitObj.defaultWord;
            newHint = singleDigitObj.imageHint;
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

          const tensCons = tensDigit ? tensDigit.consonants : '';
          const unitsCons = unitsDigit ? unitsDigit.consonants : '';
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
              return digitObj ? digitObj.consonants : '';
            })
            .filter(Boolean);
          newConsonants = parts.join(' + ');
        }

        return {
          ...item,
          numberStr: newNumberStr,
          consonants: newConsonants,
          defaultWord: newWord,
          imageHint: newHint,
        };
      })
    );
    earnPoints(25, 'החלת אותיות הספרות ומילים חדשות על רשימת 00-99');
  };

  const updateMajorItem = (
    number: number,
    updates: {
      defaultWord?: string;
      consonants?: string;
      imageHint?: string;
      customNotes?: string;
      is_ready_for_practice?: boolean;
    }
  ) => {
    const now = Date.now();
    const existing = majorItems.find((item) => item.number === number);
    const numStr = number < 10 ? `0${number}` : `${number}`;
    const updatedItem: MajorItem = {
      ...(existing || { number, numberStr: numStr, consonants: '', defaultWord: '', imageHint: '' }),
      ...updates,
      updatedAt: now,
    };

    setMajorItems((prev) => prev.map((item) => (item.number === number ? updatedItem : item)));

    if (updates.defaultWord || updates.imageHint) {
      earnPoints(10, 'התאמת אסוציאציית Major אישית');
    }

    const docId = numStr.padStart(2, '0');
    saveFirestoreDoc('major_items', docId, updatedItem);

    // Bi-directional sync: if defaultWord was updated for numbers 0-99, sync to PAO object and reset scene!
    if (updates.defaultWord !== undefined && number >= 0 && number <= 99) {
      const newWord = updates.defaultWord.trim();
      const RESET_SCENE_NOTICE = 'עודכן החפץ עבור שלשת PAO זו, וצריך ליצור סצנה חדשה';
      const paoExisting = paoItems.find((p) => p.number === number);
      const paoNumStr = (number < 10 ? `0${number}` : `${number}`).padStart(2, '0');
      const updatedPao: PAOItem = {
        ...(paoExisting || { number, numberStr: paoNumStr, person: '', action: '', object: '' }),
        number,
        numberStr: paoNumStr,
        object: newWord,
        scene: RESET_SCENE_NOTICE,
        updatedAt: now,
      };

      setPaoItems((prev) => {
        const filtered = prev.filter((p) => typeof p?.number === 'number' && !isNaN(p.number) && p.numberStr !== 'NaN');
        const exists = filtered.some((p) => p.number === number);
        if (exists) {
          return filtered.map((p) => (p.number === number ? updatedPao : p));
        }
        return [...filtered, updatedPao].sort((a, b) => a.number - b.number);
      });

      saveFirestoreDoc('pao_items', paoNumStr, updatedPao);
    }
  };

  const toggleMajorReady = (number: number, explicitState?: boolean) => {
    const now = Date.now();
    const existing = majorItems.find((item) => item.number === number);
    const numStr = number < 10 ? `0${number}` : `${number}`;
    const nextState = explicitState !== undefined ? explicitState : !(existing?.is_ready_for_practice);
    const updatedItem: MajorItem = {
      ...(existing || { number, numberStr: numStr, consonants: '', defaultWord: '', imageHint: '' }),
      is_ready_for_practice: nextState,
      updatedAt: now,
    };

    setMajorItems((prev) => prev.map((item) => (item.number === number ? updatedItem : item)));

    const docId = numStr.padStart(2, '0');
    saveFirestoreDoc('major_items', docId, updatedItem);
  };

  const setAllMajorReady = (ready: boolean, numbers?: number[]) => {
    const now = Date.now();
    setMajorItems((prev) =>
      prev.map((item) => {
        if (!numbers || numbers.includes(item.number)) {
          const updated = { ...item, is_ready_for_practice: ready, updatedAt: now };
          const docId = String(item.number).padStart(2, '0');
          saveFirestoreDoc('major_items', docId, updated);
          return updated;
        }
        return item;
      })
    );
  };

  const resetMajorItem = (number: number) => {
    const original = DEFAULT_MAJOR_00_99.find((item) => item.number === number);
    if (!original) return;
    const now = Date.now();
    const updated = { ...original, updatedAt: now };
    setMajorItems((prev) => prev.map((item) => (item.number === number ? updated : item)));
    const docId = String(number).padStart(2, '0');
    saveFirestoreDoc('major_items', docId, updated);

    // Also sync to PAO object and reset scene
    if (number >= 0 && number <= 99 && original.defaultWord) {
      const RESET_SCENE_NOTICE = 'עודכן החפץ עבור שלשת PAO זו, וצריך ליצור סצנה חדשה';
      const paoExisting = paoItems.find((p) => p.number === number);
      const paoNumStr = (number < 10 ? `0${number}` : `${number}`).padStart(2, '0');
      const updatedPao: PAOItem = {
        ...(paoExisting || { number, numberStr: paoNumStr, person: '', action: '', object: '' }),
        number,
        numberStr: paoNumStr,
        object: original.defaultWord,
        scene: RESET_SCENE_NOTICE,
        updatedAt: now,
      };
      setPaoItems((prev) => prev.map((p) => (p.number === number ? updatedPao : p)));
      saveFirestoreDoc('pao_items', paoNumStr, updatedPao);
    }
  };

  const updatePAOItem = (
    number: number,
    updates: {
      person?: string;
      action?: string;
      object?: string;
      scene?: string;
      imageUrl?: string;
      is_ready_for_practice?: boolean;
    }
  ) => {
    if (typeof number !== 'number' || isNaN(number) || !isFinite(number) || number < 0 || number > 99) {
      console.warn('Rejected invalid updatePAOItem call with number:', number);
      return;
    }
    const num = Math.floor(Math.abs(number));
    const now = Date.now();
    const existing = paoItems.find((p) => p.number === num);
    const numStr = (num < 10 ? `0${num}` : `${num}`).padStart(2, '0');
    const RESET_SCENE_NOTICE = 'עודכן החפץ עבור שלשת PAO זו, וצריך ליצור סצנה חדשה';

    let finalScene = updates.scene !== undefined ? updates.scene : existing?.scene;
    const objectChanged =
      updates.object !== undefined && updates.object.trim() !== (existing?.object || '').trim();

    // If object was updated/changed, reset scene if user didn't enter a new custom scene
    if (objectChanged) {
      const isNewSceneProvided =
        updates.scene !== undefined &&
        updates.scene.trim() !== '' &&
        updates.scene.trim() !== (existing?.scene || '').trim();
      if (!isNewSceneProvided) {
        finalScene = RESET_SCENE_NOTICE;
      }
    }

    const updatedItem: PAOItem = {
      ...(existing || { number: num, numberStr: numStr, person: '', action: '', object: '' }),
      ...updates,
      scene: finalScene,
      number: num,
      numberStr: numStr,
      updatedAt: now,
    };

    setPaoItems((prev) => {
      const filtered = prev.filter((p) => typeof p?.number === 'number' && !isNaN(p.number) && p.numberStr !== 'NaN');
      const exists = filtered.some((p) => p.number === num);
      if (exists) {
        return filtered.map((p) => (p.number === num ? updatedItem : p));
      }
      return [...filtered, updatedItem].sort((a, b) => a.number - b.number);
    });

    if (updates.person || updates.action || updates.object || updates.scene || updates.imageUrl) {
      earnPoints(15, 'התאמת שלשת PAO אישית');
    }

    const docId = numStr;
    saveFirestoreDoc('pao_items', docId, updatedItem);

    // Bi-directional sync: If object changed, update MAJOR defaultWord for this number!
    if (objectChanged && updates.object !== undefined && num >= 0 && num <= 99) {
      const newObjWord = updates.object.trim();
      const majorExisting = majorItems.find((m) => m.number === num);
      const updatedMajor: MajorItem = {
        ...(majorExisting || { number: num, numberStr: numStr, consonants: '', defaultWord: '', imageHint: '' }),
        number: num,
        numberStr: numStr,
        defaultWord: newObjWord,
        updatedAt: now,
      };

      setMajorItems((prev) => {
        const exists = prev.some((m) => m.number === num);
        if (exists) {
          return prev.map((m) => (m.number === num ? updatedMajor : m));
        }
        return [...prev, updatedMajor].sort((a, b) => a.number - b.number);
      });

      saveFirestoreDoc('major_items', numStr, updatedMajor);
    }
  };

  const togglePAOReady = (number: number, explicitState?: boolean) => {
    if (typeof number !== 'number' || isNaN(number) || !isFinite(number) || number < 0 || number > 99) {
      console.warn('Rejected invalid togglePAOReady call with number:', number);
      return;
    }
    const num = Math.floor(Math.abs(number));
    const now = Date.now();
    const existing = paoItems.find((p) => p.number === num);
    const numStr = (num < 10 ? `0${num}` : `${num}`).padStart(2, '0');
    const nextState = explicitState !== undefined ? explicitState : !(existing?.is_ready_for_practice);
    const updatedItem: PAOItem = {
      ...(existing || { number: num, numberStr: numStr, person: '', action: '', object: '' }),
      number: num,
      numberStr: numStr,
      is_ready_for_practice: nextState,
      updatedAt: now,
    };

    setPaoItems((prev) =>
      prev
        .filter((item) => typeof item?.number === 'number' && !isNaN(item.number) && item.numberStr !== 'NaN')
        .map((item) => (item.number === num ? updatedItem : item))
    );

    const docId = numStr;
    saveFirestoreDoc('pao_items', docId, updatedItem);
  };

  const setAllPAOReady = (ready: boolean, numbers?: number[]) => {
    const now = Date.now();
    setPaoItems((prev) =>
      prev
        .filter((item) => typeof item?.number === 'number' && !isNaN(item.number) && item.numberStr !== 'NaN')
        .map((item) => {
          if (!numbers || numbers.includes(item.number)) {
            const num = item.number;
            const numStr = (num < 10 ? `0${num}` : `${num}`).padStart(2, '0');
            const updated = { ...item, number: num, numberStr: numStr, is_ready_for_practice: ready, updatedAt: now };
            const docId = numStr;
            saveFirestoreDoc('pao_items', docId, updated);
            return updated;
          }
          return item;
        })
    );
  };

  const updateBodyPeg = (
    index: number,
    updates: { defaultObject?: string; bodyPartHebrew?: string; kineticTip?: string; is_ready_for_practice?: boolean }
  ) => {
    const now = Date.now();
    const existing = bodyPegs.find((bp) => bp.index === index);
    const updatedItem: BodyPegItem = {
      ...(existing || { index, bodyPartHebrew: '', defaultObject: '', kineticTip: '' }),
      ...updates,
      updatedAt: now,
    };

    setBodyPegs((prev) => prev.map((bp) => (bp.index === index ? updatedItem : bp)));
    earnPoints(5, 'התאמת מתלה גוף אישי');

    saveFirestoreDoc('body_pegs', String(index), updatedItem);
  };

  const resetBodyPeg = (index: number) => {
    const original = DEFAULT_BODY_PEGS.find((p) => p.index === index);
    if (!original) return;
    const now = Date.now();
    const updated = { ...original, updatedAt: now };
    setBodyPegs((prev) => prev.map((bp) => (bp.index === index ? updated : bp)));
    saveFirestoreDoc('body_pegs', String(index), updated);
  };

  const updateShapePeg = (
    number: number,
    updates: { defaultObject?: string; shapeName?: string; kineticTip?: string; is_ready_for_practice?: boolean }
  ) => {
    const now = Date.now();
    const existing = shapePegs.find((sp) => sp.number === number);
    const updatedItem: PegShapeItem = {
      ...(existing || { number, shapeName: '', defaultObject: '', visualMetaphor: '', kineticTip: '' }),
      ...updates,
      updatedAt: now,
    };

    setShapePegs((prev) => prev.map((sp) => (sp.number === number ? updatedItem : sp)));
    earnPoints(5, 'התאמת מתלה צורה אישי');

    saveFirestoreDoc('shape_pegs', String(number), updatedItem);
  };

  const resetShapePeg = (number: number) => {
    const original = DEFAULT_NUMBER_SHAPE_PEGS.find((p) => p.number === number);
    if (!original) return;
    const now = Date.now();
    const updated = { ...original, updatedAt: now };
    setShapePegs((prev) => prev.map((sp) => (sp.number === number ? updated : sp)));
    saveFirestoreDoc('shape_pegs', String(number), updated);
  };

  const addMajorItem = (item: MajorItem) => {
    const now = Date.now();
    const withTime = { ...item, updatedAt: now };
    setMajorItems((prev) => {
      const exists = prev.some((x) => x.number === item.number);
      if (exists) {
        return prev.map((x) => (x.number === item.number ? withTime : x));
      }
      return [...prev, withTime].sort((a, b) => a.number - b.number);
    });
    earnPoints(15, `הוספת מספר Major חדש (${item.numberStr})`);
    saveFirestoreDoc('major_items', item.numberStr.padStart(2, '0'), withTime);

    // Sync defaultWord to PAO object and reset scene
    if (item.defaultWord && item.number >= 0 && item.number <= 99) {
      const RESET_SCENE_NOTICE = 'עודכן החפץ עבור שלשת PAO זו, וצריך ליצור סצנה חדשה';
      const num = item.number;
      const numStr = (num < 10 ? `0${num}` : `${num}`).padStart(2, '0');
      const paoExisting = paoItems.find((p) => p.number === num);
      const updatedPao: PAOItem = {
        ...(paoExisting || { number: num, numberStr: numStr, person: '', action: '', object: '' }),
        number: num,
        numberStr: numStr,
        object: item.defaultWord.trim(),
        scene: RESET_SCENE_NOTICE,
        updatedAt: now,
      };
      setPaoItems((prev) => {
        const exists = prev.some((x) => x.number === num);
        if (exists) return prev.map((x) => (x.number === num ? updatedPao : x));
        return [...prev, updatedPao].sort((a, b) => a.number - b.number);
      });
      saveFirestoreDoc('pao_items', numStr, updatedPao);
    }
  };

  const deleteMajorItem = (number: number) => {
    setMajorItems((prev) => prev.filter((item) => item.number !== number));
    deleteFirestoreDoc('major_items', String(number).padStart(2, '0'));
  };

  const addPAOItem = (item: PAOItem) => {
    if (typeof item?.number !== 'number' || isNaN(item.number) || !isFinite(item.number) || item.number < 0 || item.number > 99) {
      console.warn('Rejected invalid addPAOItem:', item);
      return;
    }
    const num = Math.floor(Math.abs(item.number));
    const numStr = (num < 10 ? `0${num}` : `${num}`).padStart(2, '0');
    const now = Date.now();
    const withTime = { ...item, number: num, numberStr: numStr, updatedAt: now };
    setPaoItems((prev) => {
      const filtered = prev.filter((p) => typeof p?.number === 'number' && !isNaN(p.number) && p.numberStr !== 'NaN');
      const exists = filtered.some((x) => x.number === num);
      if (exists) {
        return filtered.map((x) => (x.number === num ? withTime : x));
      }
      return [...filtered, withTime].sort((a, b) => a.number - b.number);
    });
    earnPoints(15, `הוספת שלשת PAO (${numStr})`);
    saveFirestoreDoc('pao_items', numStr, withTime);

    // Sync object to Major
    if (item.object && num >= 0 && num <= 99) {
      const majorExisting = majorItems.find((m) => m.number === num);
      const updatedMajor: MajorItem = {
        ...(majorExisting || { number: num, numberStr: numStr, consonants: '', defaultWord: '', imageHint: '' }),
        defaultWord: item.object.trim(),
        updatedAt: now,
      };
      setMajorItems((prev) => {
        const exists = prev.some((x) => x.number === num);
        if (exists) return prev.map((x) => (x.number === num ? updatedMajor : x));
        return [...prev, updatedMajor].sort((a, b) => a.number - b.number);
      });
      saveFirestoreDoc('major_items', numStr, updatedMajor);
    }
  };

  const deletePAOItem = (number: number) => {
    if (typeof number !== 'number' || isNaN(number) || !isFinite(number)) return;
    const num = Math.floor(Math.abs(number));
    const numStr = (num < 10 ? `0${num}` : `${num}`).padStart(2, '0');
    setPaoItems((prev) => prev.filter((item) => item.number !== num && item.numberStr !== numStr));
    deleteFirestoreDoc('pao_items', numStr);
  };

  const resetPAOItem = (number: number) => {
    if (typeof number !== 'number' || isNaN(number) || !isFinite(number)) return;
    const num = Math.floor(Math.abs(number));
    const original = DEFAULT_PAO_ITEMS.find((p) => p.number === num);
    if (!original) return;
    const numStr = (num < 10 ? `0${num}` : `${num}`).padStart(2, '0');
    const now = Date.now();
    const RESET_SCENE_NOTICE = 'עודכן החפץ עבור שלשת PAO זו, וצריך ליצור סצנה חדשה';
    const withTime = { ...original, number: num, numberStr: numStr, scene: RESET_SCENE_NOTICE, updatedAt: now };
    setPaoItems((prev) => prev.map((p) => (p.number === num ? withTime : p)));
    saveFirestoreDoc('pao_items', numStr, withTime);

    // Also sync object to Major defaultWord
    if (original.object && num >= 0 && num <= 99) {
      const majorExisting = majorItems.find((m) => m.number === num);
      const updatedMajor: MajorItem = {
        ...(majorExisting || { number: num, numberStr: numStr, consonants: '', defaultWord: '', imageHint: '' }),
        number: num,
        numberStr: numStr,
        defaultWord: original.object,
        updatedAt: now,
      };
      setMajorItems((prev) => prev.map((m) => (m.number === num ? updatedMajor : m)));
      saveFirestoreDoc('major_items', numStr, updatedMajor);
    }
  };

  const syncMajorAndPAOObjects = (direction: 'majorToPao' | 'paoToMajor') => {
    const now = Date.now();
    const RESET_SCENE_NOTICE = 'עודכן החפץ עבור שלשת PAO זו, וצריך ליצור סצנה חדשה';

    if (direction === 'majorToPao') {
      setPaoItems((prev) => {
        return prev.map((p) => {
          const m = majorItems.find((item) => item.number === p.number);
          if (m && m.defaultWord) {
            const hasChanged = p.object !== m.defaultWord;
            const updatedPao: PAOItem = {
              ...p,
              object: m.defaultWord,
              scene: hasChanged ? RESET_SCENE_NOTICE : p.scene,
              updatedAt: now,
            };
            const docId = p.numberStr.padStart(2, '0');
            saveFirestoreDoc('pao_items', docId, updatedPao);
            return updatedPao;
          }
          return p;
        });
      });
      earnPoints(20, 'סנכרון חפצים מ-Major ל-PAO ואיפוס סצנות');
    } else {
      setMajorItems((prev) => {
        return prev.map((m) => {
          const p = paoItems.find((item) => item.number === m.number);
          if (p && p.object) {
            const updatedMajor: MajorItem = {
              ...m,
              defaultWord: p.object,
              updatedAt: now,
            };
            const docId = m.numberStr.padStart(2, '0');
            saveFirestoreDoc('major_items', docId, updatedMajor);
            return updatedMajor;
          }
          return m;
        });
      });
      earnPoints(20, 'סנכרון חפצים מ-PAO ל-Major');
    }
  };

  const addShapePeg = (item: PegShapeItem) => {
    const now = Date.now();
    const withTime = { ...item, updatedAt: now };
    setShapePegs((prev) => {
      const exists = prev.some((x) => x.number === item.number);
      if (exists) {
        return prev.map((x) => (x.number === item.number ? withTime : x));
      }
      return [...prev, withTime].sort((a, b) => a.number - b.number);
    });
    earnPoints(10, `הוספת מתלה צורה (${item.number})`);
    saveFirestoreDoc('shape_pegs', String(item.number), withTime);
  };

  const deleteShapePeg = (number: number) => {
    setShapePegs((prev) => prev.filter((item) => item.number !== number));
    deleteFirestoreDoc('shape_pegs', String(number));
  };

  const addBodyPeg = (item: BodyPegItem) => {
    const now = Date.now();
    const withTime = { ...item, updatedAt: now };
    setBodyPegs((prev) => {
      const exists = prev.some((x) => x.index === item.index);
      if (exists) {
        return prev.map((x) => (x.index === item.index ? withTime : x));
      }
      return [...prev, withTime].sort((a, b) => a.index - b.index);
    });
    earnPoints(10, `הוספת מתלה גוף (${item.index})`);
    saveFirestoreDoc('body_pegs', String(item.index), withTime);
  };

  const deleteBodyPeg = (index: number) => {
    setBodyPegs((prev) => prev.filter((item) => item.index !== index));
    deleteFirestoreDoc('body_pegs', String(index));
  };

  const addPersonFaceCard = (person: Omit<PersonFaceCard, 'id'>) => {
    const now = Date.now();
    const newPerson: PersonFaceCard = {
      id: `person-${now}-${Math.random().toString(36).substr(2, 4)}`,
      ...person,
      updatedAt: now,
    };
    setPeopleCards((prev) => [newPerson, ...prev]);
    earnPoints(20, 'הוספת שם ופנים');
    saveFirestoreDoc('people_cards', newPerson.id, newPerson);
    return newPerson;
  };

  const updatePersonFaceCard = (id: string, updates: Partial<PersonFaceCard>) => {
    const now = Date.now();
    setPeopleCards((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: now } : p)));
    if (updates.name || updates.morphologicalAnchor || updates.mnemonicScene) {
      earnPoints(10, 'עדכון כרטיס שם ופנים');
    }
    saveFirestoreDoc('people_cards', id, { ...updates, updatedAt: now });
  };

  const togglePersonReady = (id: string, explicitState?: boolean) => {
    const now = Date.now();
    let nextState = false;
    setPeopleCards((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        nextState = explicitState !== undefined ? explicitState : !p.is_ready_for_practice;
        return { ...p, is_ready_for_practice: nextState, updatedAt: now };
      })
    );
    saveFirestoreDoc('people_cards', id, { is_ready_for_practice: nextState, updatedAt: now });
  };

  const setAllPeopleReady = (ready: boolean) => {
    const now = Date.now();
    setPeopleCards((prev) =>
      prev.map((p) => {
        const updated = { ...p, is_ready_for_practice: ready, updatedAt: now };
        saveFirestoreDoc('people_cards', p.id, { is_ready_for_practice: ready, updatedAt: now });
        return updated;
      })
    );
  };

  const togglePersonalAssociationReady = (id: string, explicitState?: boolean) => {
    const now = Date.now();
    let nextState = false;
    setPersonalAssociations((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        nextState = explicitState !== undefined ? explicitState : !a.is_ready_for_practice;
        return { ...a, is_ready_for_practice: nextState, updatedAt: now };
      })
    );
    saveFirestoreDoc('personal_associations', id, { is_ready_for_practice: nextState, updatedAt: now });
  };

  const toggleShapePegReady = (number: number, explicitState?: boolean) => {
    const now = Date.now();
    let nextState = false;
    setShapePegs((prev) =>
      prev.map((sp) => {
        if (sp.number !== number) return sp;
        nextState = explicitState !== undefined ? explicitState : !sp.is_ready_for_practice;
        return { ...sp, is_ready_for_practice: nextState, updatedAt: now };
      })
    );
    saveFirestoreDoc('shape_pegs', String(number), { is_ready_for_practice: nextState, updatedAt: now });
  };

  const setAllShapePegsReady = (ready: boolean) => {
    const now = Date.now();
    setShapePegs((prev) =>
      prev.map((sp) => {
        const updated = { ...sp, is_ready_for_practice: ready, updatedAt: now };
        saveFirestoreDoc('shape_pegs', String(sp.number), { is_ready_for_practice: ready, updatedAt: now });
        return updated;
      })
    );
  };

  const toggleBodyPegReady = (index: number, explicitState?: boolean) => {
    const now = Date.now();
    let nextState = false;
    setBodyPegs((prev) =>
      prev.map((bp) => {
        if (bp.index !== index) return bp;
        nextState = explicitState !== undefined ? explicitState : !bp.is_ready_for_practice;
        return { ...bp, is_ready_for_practice: nextState, updatedAt: now };
      })
    );
    saveFirestoreDoc('body_pegs', String(index), { is_ready_for_practice: nextState, updatedAt: now });
  };

  const setAllBodyPegsReady = (ready: boolean) => {
    const now = Date.now();
    setBodyPegs((prev) =>
      prev.map((bp) => {
        const updated = { ...bp, is_ready_for_practice: ready, updatedAt: now };
        saveFirestoreDoc('body_pegs', String(bp.index), { is_ready_for_practice: ready, updatedAt: now });
        return updated;
      })
    );
  };

  const deletePersonFaceCard = (id: string) => {
    setPeopleCards((prev) => prev.filter((p) => p.id !== id));
    deleteFirestoreDoc('people_cards', id);
  };

  const resetPersonFaceCards = () => {
    setPeopleCards(DEFAULT_PEOPLE_CARDS);
  };

  const addAbstractShape = (shape: Omit<AbstractShapeCard, 'id'>) => {
    const now = Date.now();
    const newShape: AbstractShapeCard = {
      id: `shape-${now}-${Math.random().toString(36).substr(2, 4)}`,
      ...shape,
      updatedAt: now,
    };
    setAbstractShapes((prev) => [newShape, ...prev]);
    earnPoints(20, 'הוספת צורה/מרקם');
    saveFirestoreDoc('abstract_shapes', newShape.id, newShape);
    return newShape;
  };

  const updateAbstractShape = (id: string, updates: Partial<AbstractShapeCard>) => {
    const now = Date.now();
    setAbstractShapes((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates, updatedAt: now } : s)));
    earnPoints(10, 'עדכון צורה ומרקם');
    saveFirestoreDoc('abstract_shapes', id, { ...updates, updatedAt: now });
  };

  const deleteAbstractShape = (id: string) => {
    setAbstractShapes((prev) => prev.filter((s) => s.id !== id));
    deleteFirestoreDoc('abstract_shapes', id);
  };

  const resetAbstractShapes = () => {
    setAbstractShapes(DEFAULT_ABSTRACT_SHAPES);
  };

  const addAcademicPoint = (point: Omit<AcademicKeyPoint, 'id'>) => {
    const now = Date.now();
    const newPoint: AcademicKeyPoint = {
      id: `academic-${now}-${Math.random().toString(36).substr(2, 4)}`,
      ...point,
      updatedAt: now,
    };
    setAcademicPoints((prev) => [newPoint, ...prev]);
    earnPoints(25, 'הוספת מושג אקדמי');
    saveFirestoreDoc('academic_points', newPoint.id, newPoint);
    return newPoint;
  };

  const updateAcademicPoint = (id: string, updates: Partial<AcademicKeyPoint>) => {
    const now = Date.now();
    setAcademicPoints((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: now } : p)));
    earnPoints(10, 'עדכון מושג אקדמי');
    saveFirestoreDoc('academic_points', id, { ...updates, updatedAt: now });
  };

  const deleteAcademicPoint = (id: string) => {
    setAcademicPoints((prev) => prev.filter((p) => p.id !== id));
    deleteFirestoreDoc('academic_points', id);
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

  const syncAllToFirestore = async (isManual = true): Promise<{ success: boolean; message: string }> => {
    if (!isNetworkOnline()) {
      const msg = 'מצב אופליין: כל השינויים נשמרים במכשיר ויסונכרנו אוטומטית כשתתחבר לרשת.';
      setSyncStatusMessage(msg);
      return { success: true, message: msg };
    }

    setIsSyncing(true);
    setSyncStatusMessage('מבצע סנכרון דו-כיווני מול Firestore...');
    try {
      // 1. Sync User Profile if authenticated
      if (currentUser) {
        await saveUserProfile({
          ...profile,
          uid: currentUser.uid,
          email: currentUser.email || profile.email,
          displayName: currentUser.displayName || profile.displayName,
        });
      }

      // 2. Perform Full Bidirectional Sync with Last-Write-Wins and multi-tenant partitioning
      const res = await performFullBidirectionalSync({
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
      }, currentUser?.uid, currentUser?.email || undefined);

      if (res.success && res.mergedData) {
        setMajorDigits(res.mergedData.majorDigits);
        setMajorItems(res.mergedData.majorItems);
        setPaoItems(res.mergedData.paoItems);
        setShapePegs(res.mergedData.shapePegs);
        setBodyPegs(res.mergedData.bodyPegs);
        setPalaces(res.mergedData.palaces);
        setPeopleCards(res.mergedData.peopleCards);
        setAbstractShapes(res.mergedData.abstractShapes);
        setAcademicPoints(res.mergedData.academicPoints);
        setPersonalAssociations(res.mergedData.personalAssociations);

        const now = Date.now();
        setLastSyncTime(now);
        localStorage.setItem(STORAGE_KEYS.LAST_SYNC, String(now));
      }

      setSyncStatusMessage(res.message);
      return { success: res.success, message: res.message };
    } catch (err: any) {
      console.error('Bidirectional sync error:', err);
      const errMsg = `שגיאה בסנכרון לענן: ${err?.message || err}`;
      setSyncStatusMessage(errMsg);
      return { success: false, message: errMsg };
    } finally {
      setIsSyncing(false);
    }
  };

  const seedCloudTables = async (): Promise<{ success: boolean; message: string }> => {
    if (!isNetworkOnline()) {
      return { success: false, message: 'אין חיבור לרשת לצורך אכלוס טבלאות ענן.' };
    }
    setIsSyncing(true);
    setSyncStatusMessage('מאתחל ומאכלס טבלאות ב-Firestore...');
    try {
      const res = await seedAllDefaultsToFirestore();
      if (res.success) {
        await syncAllToFirestore(false);
      }
      return res;
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    // Network & Sync
    isOnline,
    isSyncing,
    lastSyncTime,
    syncStatusMessage,
    syncAllToFirestore,
    seedCloudTables,

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
    earnPoints,
    unlockBadge,
    completeDailyChallenge,
    generateFeedbackAnalysis,

    // Data lists
    majorDigits,
    connectingLetters,
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
    updateConnectingLetters,
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
    syncMajorAndPAOObjects,
    addBodyPeg,
    updateBodyPeg,
    deleteBodyPeg,
    resetBodyPeg,
    toggleBodyPegReady,
    setAllBodyPegsReady,
    addShapePeg,
    updateShapePeg,
    deleteShapePeg,
    resetShapePeg,
    toggleShapePegReady,
    setAllShapePegsReady,
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
