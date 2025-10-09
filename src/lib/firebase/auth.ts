import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  getAuth,
  signInWithEmailLink,
  sendSignInLinkToEmail,
} from "firebase/auth";

import { auth } from "./firebase";

// Function to send a sign-in link to email
export async function sendSignInLink(email: string) {
  const auth = getAuth();

  const actionCodeSettings = {
    url: window.location.origin + "/expenses",
    handleCodeInApp: true,
  };

  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem("emailForSignIn", email);
    return true;
  } catch (error) {
    console.error("Error sending sign-in link", error);
    return false;
  }
}

// Function to complete the sign-in using the link
export async function completeSignInWithEmailLink(url: string) {
  const auth = getAuth();
  const email = window.localStorage.getItem("emailForSignIn");
  if (!email) {
    throw new Error("No email found for sign-in");
  }

  try {
    const result = await signInWithEmailLink(auth, email, url);
    window.localStorage.removeItem("emailForSignIn");
    return result.user;
  } catch (error) {
    console.error("Error completing sign-in with email link", error);
    return null;
  }
}

// Phone Sign-In
export async function signInWithPhone(
  phoneNumber: string,
  appVerifier: RecaptchaVerifier
) {
  try {
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      appVerifier
    );
    return confirmationResult;
  } catch (error) {
    console.error("Error signing in with phone number", error);
    return null;
  }
}

// Sign Out
export async function signOut() {
  try {
    await auth.signOut();
    return true;
  } catch (error) {
    console.error("Error signing out", error);
    return false;
  }
}
