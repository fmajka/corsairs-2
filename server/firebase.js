// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { collection, getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCYKwBh3rWxcOFIuImAlsldIQoW0If9Css",
  authDomain: "korsarze-2.firebaseapp.com",
  projectId: "korsarze-2",
  storageBucket: "korsarze-2.appspot.com",
  messagingSenderId: "424491211394",
  appId: "1:424491211394:web:0add308e720f1798e4329b"
};

// Initialize Firebase
initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();
const statsRef = collection(db, "stats");

export { auth, db, statsRef };