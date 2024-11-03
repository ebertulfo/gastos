import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import {
  Expense,
  ExpenseCategory,
  OpenAIExpenseSchema,
  QueryExpenseSchema,
} from "@/schemas/expense";
import { zodResponseFormat } from "openai/helpers/zod.mjs";
import OpenAI from "openai";
import { OpenAIExpenseParser } from "@/services/OpenAIExpenseParser";
import { ExpenseService } from "@/services/expenses";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { v4 as uuidv4 } from "uuid"; // for generating unique tokens

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const API_BASE_URL = process.env.API_BASE_URL!;
const API_KEY = process.env.API_KEY!;
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
  const update = await req.json();
  console.log("@@@ UPDATE", update);

  if (!update || !update.message) {
    return NextResponse.json(
      { error: "No message found in the update" },
      { status: 400 }
    );
  }

  const chatId = update.message.chat.id;
  const telegramUserId = update.message.from.id;
  const text = update.message.text;

  // Command handling
  if (!update.message.photo) {
    if (text.startsWith("/start")) {
      await sendWelcomeMessage(chatId, telegramUserId);
    } else if (text.startsWith("/addexpense")) {
      await handleAddExpense(chatId, telegramUserId, text);
    } else if (text.startsWith("/viewexpenses")) {
      await handleViewExpenses(chatId, telegramUserId);
    } else if (text.startsWith("/deleteexpense")) {
      await handleDeleteExpense(chatId, telegramUserId, text);
    } else {
      // General message handling
      await handleGeneralMessage(chatId, telegramUserId, update);
    }
  } else {
    // General message handling
    await handleGeneralMessage(chatId, telegramUserId, update);
  }

  return NextResponse.json({ status: "Update handled" });
}

// Helper functions for each command
async function sendWelcomeMessage(chatId: number, telegramUserId: number) {
  const oneTimeCode = uuidv4().slice(0, 6); // Generate a 6-character code

  // Save the code to Firestore with an expiration time
  const firestore = await initializeFirestore();
  await firestore
    .collection("authCodes")
    .doc(oneTimeCode)
    .set({
      telegramUserId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // Code valid for 15 minutes
    });

  // Send instructions to the user
  await sendMessage(
    chatId,
    `Welcome! To link your account, please enter the following code in the Gastos Web App:\n\n*${oneTimeCode}*\n\nVisit: ${process.env.APP_URL}/telegram-bot`,
    "Markdown"
  );
}

async function handleAddExpense(
  chatId: number,
  telegramUserId: number,
  text: string
) {
  const expenseDetails = text.replace("/addexpense ", "").split(",");
  if (expenseDetails.length < 4) {
    await sendMessage(
      chatId,
      "Please provide title, amount, category, and date (YYYY-MM-DD)."
    );
    return;
  }

  const [title, amount, category, date] = expenseDetails.map((d) => d.trim());
  try {
    await axios.post(
      `${API_BASE_URL}/api/expenses`,
      {
        telegramUserId,
        title,
        amount: parseFloat(amount),
        category,
        date: date.toString(),
      },
      { headers: { "x-api-key": API_KEY } }
    );
    await sendMessage(chatId, `Expense "${title}" added successfully!`);
  } catch (error) {
    console.error("Error adding expense:", error);
    await sendMessage(chatId, "Failed to add expense. Please try again.");
  }
}

async function handleViewExpenses(chatId: number, telegramUserId: number) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/expenses`, {
      params: { telegramUserId },
      headers: { "x-api-key": API_KEY },
    });
    const expenses = response.data;
    if (expenses.length > 0) {
      let message = "Your expenses:\n";
      expenses.forEach((expense: Expense, index: number) => {
        message += `${index + 1}. ${expense.description} - $${
          expense.amount
        } - ${expense.category} - ${expense.date}\n`;
      });
      await sendMessage(chatId, message);
    } else {
      await sendMessage(chatId, "No expenses found.");
    }
  } catch (error) {
    console.error("Error retrieving expenses:", error);
    await sendMessage(chatId, "An error occurred while retrieving expenses.");
  }
}

async function handleDeleteExpense(
  chatId: number,
  telegramUserId: number,
  text: string
) {
  const expenseId = text.replace("/deleteexpense ", "").trim();
  try {
    await axios.delete(`${API_BASE_URL}/api/expenses`, {
      data: { telegramUserId, id: expenseId },
      headers: { "x-api-key": API_KEY },
    });
    await sendMessage(chatId, `Expense ID ${expenseId} deleted successfully!`);
  } catch (error) {
    console.error("Error deleting expense:", error);
    await sendMessage(chatId, "Failed to delete expense.");
  }
}

async function handleGeneralMessage(
  chatId: number,
  telegramUserId: number,
  update: { message: { photo?: { file_id: string }[]; text?: string } }
) {
  const firestore = await initializeFirestore();
  const expenseService = new ExpenseService(firestore);
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const expenseParser = new OpenAIExpenseParser(openai);
  // Check if the message contains a photo
  let fileId;
  // If file is an image, automatically consider it as a log intent.
  let intent = "log";
  let fileBuffer;

  if (!update.message.photo && !update.message.text) {
    return await sendMessage(chatId, "Huh?");
  }

  if (!update.message.photo && update.message.text) {
    const intentCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Determine if the user message is an 'expense logging' or an 'expense query'. Respond with 'log' for logging and 'query' for querying.",
        },
        { role: "user", content: update.message.text },
      ],
      max_tokens: 10,
    });

    const intentContent = intentCompletion.choices[0]?.message?.content;
    if (!intentContent) {
      return await sendMessage(
        chatId,
        "I didn't understand your request. Could you clarify?"
      );
    }
    intent = intentContent.trim().toLowerCase();
  } else if (update.message.photo) {
    fileId = update.message.photo.slice(-1)[0].file_id;
    const fileResponse = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`
    );
    const fileInfo = await fileResponse.json();
    // Step 1: Determine Intent (Log Expense vs. Query Expense)
    console.log("@@@ FILE DATA", fileInfo);
    const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${fileInfo.result.file_path}`;
    console.log("@@@ FILE URL", fileUrl);

    const fileData = await fetch(fileUrl);
    fileBuffer = Buffer.from(await fileData.arrayBuffer());
    console.log("@@@ FILE DATA", fileData);
    if (!fileData.ok) {
      return await sendMessage(chatId, "Failed to fetch file from Telegram");
    }
  } else {
    return await sendMessage(
      chatId,
      "I didn't understand your request. Could you clarify?"
    );
  }

  // Step 2: Handle Expense Logging
  if (intent === "log") {
    let parsedContent = null;
    if (fileId && fileBuffer) {
      parsedContent = await expenseParser.parseExpense(fileBuffer);
    } else {
      parsedContent = await expenseParser.parseExpense(
        update.message.text || ""
      );
    }

    console.log("@@@ PARSED CONTENT", parsedContent);
    const parsedExpense = OpenAIExpenseSchema.safeParse(parsedContent).data;
    console.log("Parsed Expense:", parsedExpense);
    if (!parsedExpense?.amount || !parsedExpense?.description) {
      return await sendMessage(
        chatId,
        "Could you provide more details about this expense, like the category or date?"
      );
    }

    const expenseData: Expense = {
      ...parsedExpense,
      telegramUserId: String(telegramUserId),
      date: parsedExpense.date ? new Date(parsedExpense.date) : new Date(),
    };
    try {
      const newExpense = await expenseService.create(expenseData);
      return await sendMessage(
        chatId,
        `Logged your spending of $${newExpense.amount} on ${
          expenseData.category || "unspecified category"
        } with description: "${newExpense.description}".`
      );
    } catch (error) {
      console.error("Error handling POST request:", error);
      return await sendMessage(chatId, "Failed to log expense.");
    }
  }

  // Step 3: Handle Expense Querying
  if (intent === "query") {
    const queryCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You assist in querying expenses. Today is ${new Date()
            .toISOString()
            .slice(
              0,
              10
            )}. Extract the start_date and end_date for the query from the user's input. Only include a category if the user explicitly specifies one from Food, Transportation, Utilities, Entertainment, Clothing, or Others. **If the user does not mention a category, leave the field blank as "All"**`,
        },
        { role: "user", content: update.message.text || "" },
      ],
      response_format: zodResponseFormat(QueryExpenseSchema, "expense_query"),
    });

    console.log("@@@ QUERY COMPLETION", queryCompletion.choices[0]?.message);
    const parsedQuery = JSON.parse(
      queryCompletion.choices[0]?.message?.content || "{}"
    );
    const startDate =
      parsedQuery?.start_date || new Date().toISOString().slice(0, 8) + "01";
    const endDate = parsedQuery?.end_date || new Date().toISOString();
    const category = parsedQuery?.category || null;
    console.log("@@@ QUERY PARAMS", {
      telegramUserId,
      startDate,
      endDate,
      category,
    });
    if (!telegramUserId) {
      return await sendMessage(
        chatId,
        "You don't seem to be logged in yet. Please use the /start command to link your account."
      );
    }

    const firebaseUserId = await getFirebaseUserId(telegramUserId.toString());
    console.log("@@@ FIREBASE USER ID", firebaseUserId);
    if (!firebaseUserId) {
      console.log("@@@ NO MAPPING FOUND");
      return await sendMessage(
        chatId,
        "You don't seem to be linked to an account yet. Please use the /start command to link your account."
      );
    }

    const expenses = await expenseService.get(
      firebaseUserId,
      startDate,
      endDate,
      category as ExpenseCategory
    );
    console.log("@@@ EXPENSES", expenses);
    const totalAmount = expenses.reduce(
      (sum: number, expense: Expense) => sum + expense.amount,
      0
    );
    const reply = `Total spending from ${parsedQuery.start_date} to ${
      parsedQuery.end_date
    } ${
      parsedQuery.category !== "all categories"
        ? `on ${parsedQuery.category}`
        : ""
    } is $${totalAmount.toFixed(2)}.`;

    return await sendMessage(chatId, reply);
  }

  // If intent is neither "log" nor "query"
  await sendMessage(
    chatId,
    "I didn't understand your request. Could you clarify?"
  );
}

// Function to send messages to Telegram
async function sendMessage(
  chatId: number,
  text: string,
  parseMode: string = "HTML"
) {
  console.log("Sending message to chat ID:", chatId);
  console.log("Message:", text);
  console.log("Parse mode:", parseMode);
  try {
    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: chatId,
        text,
        parse_mode: parseMode,
      }
    );
  } catch (error: unknown) {
    console.error("Error sending message:", error);
  }
}

async function getFirebaseUserId(
  telegramUserId: string
): Promise<string | null> {
  const firestore = await initializeFirestore();
  const userProfilesRef = firestore.collection("userProfiles");
  const mappingSnapshot = await userProfilesRef
    .where("telegramUserId", "==", telegramUserId)
    .get();
  if (mappingSnapshot.empty) {
    return null;
  }
  return mappingSnapshot.docs[0].data().firebaseUserId;
}
