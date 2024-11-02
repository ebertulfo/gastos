import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  getAuth,
  signInWithEmailLink,
  sendSignInLinkToEmail,
} from "firebase/auth";

import { APIResponse } from "@/types";
import { auth } from "./firebase";

// Google Sign-In
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();

  try {
    const userCreds = await signInWithPopup(auth, provider);
    const idToken = await userCreds.user.getIdToken();

    const response = await fetch("/api/auth/sign-in", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
    });
    const resBody = (await response.json()) as unknown as APIResponse<string>;
    if (response.ok && resBody.success) {
      return true;
    } else return false;
  } catch (error) {
    console.error("Error signing in with Google", error);
    return false;
  }
}

// Function to send a sign-in link to email
export async function sendSignInLink(email: string) {
  const auth = getAuth();

  const actionCodeSettings = {
    // URL to redirect back to. Can be your app's home page or a specific path.
    url: "http://localhost:3000/dashboard",
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
    return result.user; // Return the user object
  } catch (error) {
    console.error("Error completing sign-in with email link", error);
    return null;
  }
}

// Email Sign-In
export async function signInWithEmail(email: string, password: string) {
  try {
    const userCreds = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await userCreds.user.getIdToken();

    const response = await fetch("/api/auth/sign-in", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
    });
    const resBody = (await response.json()) as unknown as APIResponse<string>;
    if (response.ok && resBody.success) {
      return true;
    } else return false;
  } catch (error) {
    console.error("Error signing in with email and password", error);
    return false;
  }
}

// Phone Sign-In
export async function signInWithPhone(
  phoneNumber: string,
  appVerifier: RecaptchaVerifier
) {
  console.log("@@@ SOKPA SA OBLO");
  try {
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      appVerifier
    );
    return confirmationResult; // This returns a confirmationResult that you use to verify the code.
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
