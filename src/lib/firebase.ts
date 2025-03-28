import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { 
  getAuth, 
  browserLocalPersistence, 
  setPersistence, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";
import { firebaseConfig } from "./firebase.config";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Set persistence to LOCAL
setPersistence(auth, browserLocalPersistence);

// Fungsi untuk login admin
export const loginAdmin = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    throw error;
  }
};

// Daftar email admin yang diizinkan
export const ALLOWED_ADMIN_EMAILS = [
  "admin@kartacup.com",
  // Tambahkan email admin lain jika diperlukan
];

// Fungsi untuk membuat akun admin
export const createAdminAccount = async (email: string, password: string) => {
  try {
    // Validasi email admin
    if (!ALLOWED_ADMIN_EMAILS.includes(email)) {
      throw new Error("Email tidak diizinkan untuk membuat akun admin");
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Simpan data admin ke Firestore setelah berhasil login
    const adminRef = doc(collection(db, 'admins'), user.uid);
    await setDoc(adminRef, {
      email: user.email,
      role: 'admin',
      createdAt: new Date().toISOString()
    });

    return user;
  } catch (error: any) {
    throw error;
  }
};
