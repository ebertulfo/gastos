import "server-only";

import { cookies } from "next/headers";

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { SessionCookieOptions, getAuth } from "firebase-admin/auth";
import { auth as firebaseAuth } from "./firebase";

const serviceAccount = JSON.parse(
  process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT as string
);
export const firebaseApp =
  getApps().find((it) => it.name === "firebase-admin-app") ||
  initializeApp(
    {
      credential: cert(serviceAccount),
    },
    "firebase-admin-app"
  );
export const auth = getAuth(firebaseApp);

export async function isUserAuthenticated(
  session: string | undefined = undefined
) {
  const _session = session ?? (await getSession());
  if (!_session) return false;

  const isRevoked = await auth.verifySessionCookie(_session, true);
  return isRevoked;
}

export async function getCurrentUser() {
  try {
    const session = await getSession();
    const isAuth = await isUserAuthenticated(session);
    if (!isAuth) {
      return null;
    }

    const decodedIdToken = await auth.verifySessionCookie(session!);
    const currentUser = await auth.getUser(decodedIdToken.uid);

    return currentUser;
  } catch (e) {
    await firebaseAuth.signOut();
    const res = await fetch(`${process.env.APP_URL}/api/auth/sign-out`, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();
  }
}

async function getSession() {
  try {
    return cookies().get("__session")?.value;
  } catch (error) {
    return undefined;
  }
}

export async function createSessionCookie(
  idToken: string,
  sessionCookieOptions: SessionCookieOptions
) {
  return auth.createSessionCookie(idToken, sessionCookieOptions);
}

export async function revokeAllSessions(session: string) {
  const decodedIdToken = await auth.verifySessionCookie(session);

  return await auth.revokeRefreshTokens(decodedIdToken.sub);
}
