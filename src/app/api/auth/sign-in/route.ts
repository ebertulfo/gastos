import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { APIResponse } from "@/types";
import {
  createSessionCookie,
  // verifySessionCookie,
} from "@/lib/firebase/firebase-admin";

export async function POST(request: NextRequest) {
  const reqBody = (await request.json()) as { idToken: string };
  const idToken = reqBody.idToken;

  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

  const sessionCookie = await createSessionCookie(idToken, { expiresIn });

  const cookiesObject = await cookies();
  cookiesObject.set("__session", sessionCookie, {
    maxAge: expiresIn,
    httpOnly: true,
    secure: true,
  });

  return NextResponse.json<APIResponse<string>>({
    success: true,
    data: "Signed in successfully.",
  });
}

// export async function GET(request: NextRequest) {
//   const session = cookies().get("session")?.value || "";

//   //Validate if the cookie exist in the request
//   if (!session) {
//     return NextResponse.json({ isLogged: false }, { status: 401 });
//   }

//   //Use Firebase Admin to validate the session cookie
//   // const decodedClaims = await verifySessionCookie(session, true);

//   if (!decodedClaims) {
//     return NextResponse.json({ isLogged: false }, { status: 401 });
//   }

//   return NextResponse.json({ isLogged: true }, { status: 200 });
// }
