import { IIntentDetector } from "@/interfaces/IIntentDetector";
import OpenAI from "openai";

// src/services/OpenAIIntentDetector.ts
export class OpenAIIntentDetector implements IIntentDetector {
  constructor(private openai: OpenAI) {
    this.openai = openai;
  }

  async detectIntent(message: string): Promise<"log" | "query"> {
    const completion = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Determine if the user message is an 'expense logging' or an 'expense query'. Respond with 'log' for logging and 'query' for querying.",
        },
        { role: "user", content: message },
      ],
      max_tokens: 50,
    });

    return completion.choices[0]?.message?.content?.trim().toLowerCase() as
      | "log"
      | "query";
  }
}
