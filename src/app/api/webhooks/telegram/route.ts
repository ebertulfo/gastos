import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { Expense } from "@/schemas/expense";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const API_BASE_URL = process.env.API_BASE_URL!;
const API_KEY = process.env.API_KEY!;

export async function POST(req: NextRequest) {
  const update = await req.json();

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

  return NextResponse.json({ status: "Update handled" });
}

// Helper functions for each command
async function sendWelcomeMessage(chatId: number, telegramUserId: number) {
  const link = `${API_BASE_URL}/api/auth?telegramUserId=${telegramUserId}`;
  await sendMessage(
    chatId,
    `Welcome! Link your account [here](${link})`,
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
      { telegramUserId, title, amount: parseFloat(amount), category, date },
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
  // Check if the message contains a photo
  if (update.message.photo) {
    const fileId = update.message.photo.slice(-1)[0].file_id;
    try {
      await axios.post(
        `${API_BASE_URL}/api/messages`,
        { telegramUserId, fileId },
        { headers: { "x-api-key": API_KEY } }
      );
      await sendMessage(chatId, "Photo processed successfully!");
    } catch (error) {
      console.error("Error processing photo:", error);
      await sendMessage(chatId, "Failed to process photo.");
    }
  } else if (update.message.text) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/messages`,
        { telegramUserId, message: update.message.text },
        { headers: { "x-api-key": API_KEY } }
      );
      await sendMessage(
        chatId,
        response.data.reply || "Couldn't process your message."
      );
    } catch (error) {
      console.error("Error processing message:", error);
      await sendMessage(chatId, "Failed to process your message.");
    }
  }
}

// Function to send messages to Telegram
async function sendMessage(
  chatId: number,
  text: string,
  parseMode: string = "HTML"
) {
  await axios.post(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      chat_id: chatId,
      text,
      parse_mode: parseMode,
    }
  );
}
