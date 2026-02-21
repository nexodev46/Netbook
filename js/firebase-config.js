import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBihMnWutSutWAiMP1_cgktBTo5mlJyN6c",
  authDomain: "netbook-e9f3f.firebaseapp.com",
  projectId: "netbook-e9f3f",
  storageBucket: "netbook-e9f3f.firebasestorage.app",
  messagingSenderId: "530328595246",
  appId: "1:530328595246:web:2c88cc28472b3c929ee8bf",
  measurementId: "G-25FY1BVHHX"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app); // Importante para tu perfil