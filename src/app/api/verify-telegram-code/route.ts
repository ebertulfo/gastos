import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { cert, getApps, initializeApp } from "firebase-admin/app";

async function initializeFirestore() {
  // Initialize Firebase Admin if not already initialized
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }

  return getFirestore();
}
export async function POST(req: NextRequest) {
  try {
    const { code, userId } = await req.json();
    if (!code) {
      return NextResponse.json(
        { success: false, message: "Code is required" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    const firestore = await initializeFirestore();
    const codeDoc = await firestore.collection("authCodes").doc(code).get();

    if (!codeDoc.exists) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired code" },
        { status: 400 }
      );
    }

    const { telegramUserId, expiresAt } = codeDoc.data() as {
      telegramUserId: string;
      expiresAt: FirebaseFirestore.Timestamp;
    };

    // Check if the code has expired
    if (expiresAt.toDate() < new Date()) {
      await firestore.collection("authCodes").doc(code).delete(); // Clean up expired code
      return NextResponse.json(
        { success: false, message: "Code expired" },
        { status: 400 }
      );
    }

    // Link the Telegram user ID to the user’s account in Firestore
    await firestore
      .collection("userMappings")
      .doc()
      .set(
        { firebaseUserId: userId, telegramUserId, telegramLinked: true },
        { merge: true }
      );

    // Delete the code after successful linking
    await firestore.collection("authCodes").doc(code).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error verifying code:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
