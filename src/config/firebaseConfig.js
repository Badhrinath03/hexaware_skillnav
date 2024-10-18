import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyAJXBS7upL472MmKR8M8c02D9fOl_J985s",
    authDomain: "skillnav-f48a3.firebaseapp.com",
    projectId: "skillnav-f48a3",
    storageBucket: "skillnav-f48a3.appspot.com",
    messagingSenderId: "128901735703",
    appId: "1:128901735703:web:6d687803761e5d20b00352",
    measurementId: "G-G3V9GWPDMZ",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app);

const signInWithProvider = async (provider, setUserRole, setIsAuthenticated, navigate) => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      setUserRole(userData.role);
      setIsAuthenticated(true);

      if (userData.role === 'admin') {
        navigate('/admin');
      } else if (userData.isFormFilled) {
        navigate('/user');
      } else {
        navigate('/user/candidate-form');
      }
    } else {
      const role = prompt("Please enter your role (admin/user):", "user");
      if (role !== "admin" && role !== "user") {
        alert("Invalid role. Please enter 'admin' or 'user' next time.");
        return;
      }

      const registrationDate = new Date().toISOString();
      await setDoc(userDocRef, { 
        role, 
        registrationDate,
        isFormFilled: false
      });

      setUserRole(role);
      setIsAuthenticated(true);

      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/user/candidate-form');
      }
    }
  } catch (error) {
    console.error("Error during sign-in:", error);
    alert("Error during sign-in: " + error.message);
  }
};

export { auth, googleProvider, githubProvider, signInWithProvider, db, storage };
