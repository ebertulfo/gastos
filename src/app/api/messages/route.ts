import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Check if this is a Telegram request or a web request
    if (body.telegram_user_id) {
      // Redirect to Telegram endpoint
      const response = await fetch(`${req.nextUrl.origin}/api/messages/telegram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } else if (body.user_id) {
      // Redirect to Web endpoint
      const response = await fetch(`${req.nextUrl.origin}/api/messages/web`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } else {
      // If neither telegram_user_id nor user_id is present
      return NextResponse.json(
        { error: "Missing user identifier (telegram_user_id or user_id)" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in message routing:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
