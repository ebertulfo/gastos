import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";

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

const firestore = getFirestore();

export async function handler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let reqBody;
    let telegramUserId;
    if (req.method === "GET") {
      telegramUserId = searchParams.get("telegramUserId");
    } else if (req.method === "POST") {
      reqBody = await req.json();
      telegramUserId = reqBody.telegramUserId;
    }

    if (req.method === "GET") {
      // Redirect to the authentication page
      const redirectUrl = `${process.env.APP_URL}/sign-in?telegramUserId=${telegramUserId}`;
      return NextResponse.redirect(redirectUrl);
    }

    if (req.method === "POST") {
      // Assuming the user is authenticated successfully
      const { firebaseUserId, telegramUserId } = reqBody;
      if (!firebaseUserId) {
        return NextResponse.json(
          { error: "Missing Firebase user ID" },
          { status: 400 }
        );
      }

      // Save the mapping between telegramUserId and firebaseUserId
      await firestore
        .collection("userMappings")
        .add({ telegramUserId, firebaseUserId });

      // Send a Telegram message to notify the user
      const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
      if (TELEGRAM_BOT_TOKEN) {
        const message =
          "Your account has been successfully linked! You can now use the Telegram bot to manage your expenses.";
        const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

        await fetch(telegramApiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: telegramUserId,
            text: message,
          }),
        });
      }
      return NextResponse.json(
        { message: "User linked successfully" },
        { status: 201 }
      );
    }

    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  } catch (error) {
    console.error("Error handling authentication request:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export const GET = handler;
export const POST = handler;
