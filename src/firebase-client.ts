import { initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken } from "firebase/auth";

initializeApp({
  apiKey: "AIzaSyCYAm0jW4KAeDaOn3fcFLBEjnQgypdEBHg",
  authDomain: "gcp-test2-209818.firebaseapp.com",
  projectId: "gcp-test2-209818",
  // storageBucket: "gcp-test2-209818.appspot.com",
  // messagingSenderId: "1086146178015",
  // appId: "1:1086146178015:web:9c5138be4fb11499ca326a",
  // measurementId: "G-QPHK1TD68Q",
});

export async function signIn(customToken: string) {
  const auth = getAuth();
  const userCredential = await signInWithCustomToken(auth, customToken);
  return userCredential.user;
}
