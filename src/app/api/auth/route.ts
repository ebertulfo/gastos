import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { cert, initializeApp, getApps, getApp } from "firebase-admin/app";
import { redirect } from "next/navigation";
async function initializeFirestore() {
  // Check if Firebase is already initialized, otherwise initialize it
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }

  return getFirestore(getApp()); // Get Firestore instance from the initialized app
}
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return new NextResponse("Missing token", { status: 400 });
  }

  const firestore = await initializeFirestore();
  const tokenDoc = await firestore.collection("authTokens").doc(token).get();

  if (!tokenDoc.exists) {
    return new NextResponse("Invalid or expired token", { status: 400 });
  }

  const tokenData = tokenDoc.data();
  console.log(tokenData);
  const { telegramUserId, expiresAt } = tokenData as {
    telegramUserId: string;
    expiresAt: FirebaseFirestore.Timestamp;
  };

  // Check if the token is expired
  if (expiresAt.toDate() < new Date()) {
    await firestore.collection("authTokens").doc(token).delete(); // Clean up expired token
    return new NextResponse("Token expired", { status: 400 });
  }

  // Link the Telegram user ID to the user’s account in Firestore
  // You’ll need to define where user data is stored and how to link them
  await firestore
    .collection("userMappings")
    .doc(telegramUserId.toString()) // Assuming `telegramUserId` maps directly; adjust as needed
    .set({ telegramLinked: true }, { merge: true });

  // Delete the token after successful linking
  await firestore.collection("authTokens").doc(token).delete();
  console.log(
    "@@@ REDIRECT!",
    new URL("/linked-successfully", process.env.APP_URL)
  );
  return redirect(`/linked-successfully`); // Redirect to a success page or message

  // return NextResponse.redirect(
  //   new URL("/linked-successfully", process.env.APP_URL)
  // ); // Redirect to a success page or message
}
