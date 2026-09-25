import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';

// Client Firebase configuration from provisioning
export const firebaseConfig = {
  projectId: "alonttsgemini",
  appId: "1:9826139997:web:73807cd49de5303f99f2b4",
  apiKey: "AIzaSyDQl8UvIv7uhwl4iQjWNuGOwsqaJa80B5A",
  authDomain: "alonttsgemini.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-170d8d0e-9782-4dda-8851-a50875919447",
  storageBucket: "alonttsgemini.firebasestorage.app",
  messagingSenderId: "9826139997",
  measurementId: "",
  oAuthClientId: "9826139997-duka51529ghj7s0frd5pc67abf235a3p.apps.googleusercontent.com",
  recaptchaSiteKey: ""
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
};

export const signOutUser = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign Out Error:', error);
    throw error;
  }
};

export interface UserProfileData {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  points: number;
  level: number;
  levelTitle: string;
  badges: string[];
  dailyStreak: number;
  lastChallengeDate: string | null;
  exercisesCompleted: number;
  updatedAt?: any;
}

export const getOrInitUserProfile = async (user: FirebaseUser): Promise<UserProfileData> => {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    return snap.data() as UserProfileData;
  } else {
    const newProfile: UserProfileData = {
      uid: user.uid,
      displayName: user.displayName || 'ספורטאי זיכרון',
      email: user.email,
      photoURL: user.photoURL,
      points: 50, // Welcome bonus
      level: 1,
      levelTitle: 'שוליית מנמוניקה',
      badges: ['צעד ראשון בהיפוקמפוס'],
      dailyStreak: 1,
      lastChallengeDate: new Date().toISOString().split('T')[0],
      exercisesCompleted: 0,
      updatedAt: serverTimestamp(),
    };
    await setDoc(userRef, newProfile);
    return newProfile;
  }
};

export const saveUserProfile = async (profile: UserProfileData) => {
  const userRef = doc(db, 'users', profile.uid);
  await setDoc(userRef, { ...profile, updatedAt: serverTimestamp() }, { merge: true });
};

export const fetchLeaderboard = async (limitCount = 10): Promise<UserProfileData[]> => {
  try {
    const usersCol = collection(db, 'users');
    const q = query(usersCol, orderBy('points', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    const users: UserProfileData[] = [];
    snap.forEach((doc) => {
      users.push(doc.data() as UserProfileData);
    });
    return users;
  } catch (err) {
    console.warn('Leaderboard query fallback:', err);
    return [];
  }
};
