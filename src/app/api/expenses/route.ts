// src/app/api/expenses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { ExpenseSchema, Expense, ExpenseCategory } from "@/schemas/expense";
import { ExpenseService } from "@/services/expenses";

async function authenticate(req: NextRequest): Promise<NextResponse | null> {
  const API_KEY = process.env.API_KEY; // Make sure to use your actual environment variable here
  const apiKey = req.headers.get("x-api-key");
  if (apiKey !== API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

async function getFirebaseUserId(
  telegramUserId: string
): Promise<string | null> {
  const firestore = await initializeFirestore();
  const userMappingsRef = firestore.collection("userMappings");
  const mappingSnapshot = await userMappingsRef
    .where("telegramUserId", "==", telegramUserId)
    .get();
  if (mappingSnapshot.empty) {
    return null;
  }
  return mappingSnapshot.docs[0].data().firebaseUserId;
}
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
export async function GET(req: NextRequest): Promise<NextResponse> {
  const firestore = await initializeFirestore();
  const expenseService = new ExpenseService(firestore);
  console.log("@@@ REQUEST TO EXPENSE API", req.method, req.url);
  try {
    const authError = await authenticate(req);
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const telegramUserId = searchParams.get("telegramUserId");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const category = searchParams.get("category") || null;
    console.log("@@@ QUERY PARAMS", {
      telegramUserId,
      startDate,
      endDate,
      category,
    });
    if (!telegramUserId) {
      return NextResponse.json(
        { error: "Missing Telegram user ID" },
        { status: 400 }
      );
    }

    const firebaseUserId = await getFirebaseUserId(telegramUserId);
    if (!firebaseUserId) {
      return NextResponse.json(
        { error: "No mapping found for Telegram user ID" },
        { status: 404 }
      );
    }

    const expenses = expenseService.get(
      firebaseUserId,
      startDate,
      endDate,
      category as ExpenseCategory
    );
    console.log("@@@ EXPENSESssss", expenses);

    return NextResponse.json(expenses, { status: 200 });
  } catch (error) {
    console.log("@@@ POTANGINA MO", JSON.stringify(error));
    console.log("@@@ erorr", error);
    console.error("Error handling GET request:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const firestore = await initializeFirestore();
  const expenseService = new ExpenseService(firestore);
  console.log("@@@ REQUEST TO EXPENSE API", req.method, req.url);
  try {
    const authError = await authenticate(req);
    if (authError) return authError;

    const body: Expense = await req.json();
    console.log("@@@ BODY", body);
    const parseResult = ExpenseSchema.safeParse(body);
    console.log("@@@ PARSE RESULT", parseResult);
    if (!parseResult.success) {
      console.log("@@@ PARSE ERROR", parseResult.error.errors);
      return NextResponse.json(
        {
          error: "Invalid expense data",
          details: parseResult.error.errors,
        },
        { status: 400 }
      );
    }
    const telegramUserId = parseResult.data.telegramUserId;

    if (!telegramUserId) {
      return NextResponse.json(
        { error: "Missing Telegram user ID" },
        { status: 400 }
      );
    }

    const firebaseUserId = await getFirebaseUserId(telegramUserId);
    if (!firebaseUserId) {
      return NextResponse.json(
        { error: "No mapping found for Telegram user ID" },
        { status: 404 }
      );
    }

    const { amount, category, date, description } = parseResult.data;
    const newExpense = {
      amount,
      category,
      date,
      description,
      userId: firebaseUserId,
      createdAt: new Date().toISOString(),
    };
    console.log("@@@ NEW EXPENSE", newExpense);
    expenseService.create(newExpense);
    const docRef = await expenseService.create(newExpense);
    return NextResponse.json({ id: docRef.id, ...newExpense }, { status: 201 });
  } catch (error) {
    console.error("Error handling POST request:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  const firestore = await initializeFirestore();
  const expenseService = new ExpenseService(firestore);
  console.log("@@@ REQUEST TO EXPENSE API", req.method, req.url);
  try {
    const authError = await authenticate(req);
    if (authError) return authError;

    const body: Expense & { id: string } = await req.json();
    const { id, ...updatedData } = body;

    const parseResult = ExpenseSchema.safeParse(updatedData);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid expense data",
          details: parseResult.error.errors,
        },
        { status: 400 }
      );
    }

    const expensesRef = await expenseService.update(id, parseResult.data);
    return NextResponse.json(expensesRef, { status: 200 });
  } catch (error) {
    console.error("Error handling PUT request:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const firestore = await initializeFirestore();
  const expenseService = new ExpenseService(firestore);
  console.log("@@@ REQUEST TO EXPENSE API", req.method, req.url);
  try {
    const authError = await authenticate(req);
    if (authError) return authError;

    const body: { id: string } = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing expense ID" },
        { status: 400 }
      );
    }

    await expenseService.delete(id);
    return NextResponse.json(
      { message: "Expense deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error handling DELETE request:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
