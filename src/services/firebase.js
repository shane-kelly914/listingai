import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBjTs3nW5RA4JxYpRtkX1UhRlfSqzUfHuk',
  authDomain: 'listingai-49c77.firebaseapp.com',
  projectId: 'listingai-49c77',
  storageBucket: 'listingai-49c77.firebasestorage.app',
  messagingSenderId: '402740663103',
  appId: '1:402740663103:web:bb0091105e7cdecaddb98a',
  measurementId: 'G-793LGHHSJR',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };

// User data management
export async function createUser(uid, email, name) {
  try {
    await setDoc(doc(db, 'users', uid), {
      email,
      name,
      usageCount: 0,
      isPro: false,
      promoCode: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function getUserData(uid) {
  try {
    const docSnap = await getDoc(doc(db, 'users', uid));
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
}

export async function updateUsageCount(uid) {
  try {
    await updateDoc(doc(db, 'users', uid), {
      usageCount: increment(1),
      lastUsed: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating usage count:', error);
    throw error;
  }
}

export async function updateUserProStatus(uid, isPro) {
  try {
    await updateDoc(doc(db, 'users', uid), {
      isPro,
    });
  } catch (error) {
    console.error('Error updating pro status:', error);
    throw error;
  }
}

export async function updateUserPromoCode(uid, hasPromo) {
  try {
    await updateDoc(doc(db, 'users', uid), {
      promoCode: hasPromo,
    });
  } catch (error) {
    console.error('Error updating promo code:', error);
    throw error;
  }
}

export async function signUpUser(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
}

export async function signInUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
}

export async function signOutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}
