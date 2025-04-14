import { IExpenseParser } from "@/interfaces/IExpenseParser";
import { z } from "zod";
import { OpenAIExpenseSchema, ParsedExpense } from "@/schemas/expense";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";

export class OpenAIExpenseParser implements IExpenseParser {
  constructor(private openai: OpenAI) {}

  private async getBase64Image(image: File | Buffer | string): Promise<string> {
    console.log("@@@ IMAGE TYPE", typeof image);
    if (typeof image === "string") {
      return image.replace(/^data:image\/\w+;base64,/, "");
    }

    if (image instanceof File) {
      const buffer = await image.arrayBuffer();
      return Buffer.from(buffer).toString("base64");
    }

    if (Buffer.isBuffer(image)) {
      return image.toString("base64");
    }

    throw new Error("Unsupported image format");
  }

  async parseExpense(input: string | File | Buffer): Promise<ParsedExpense> {
    // Create a modified schema for OpenAI without default values
    const openAIFriendlySchema = z.object({
      amount: z.number(),
      category: z.enum(["Food", "Transportation", "Utilities", "Entertainment", "Others"]),
      description: z.string().optional(),
      currency: z.string().optional(), // No default value
    });

    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system" as const,
        content:
          "You assist in logging expenses. Extract the amount, category, currency (in ISO 4217 format), and description from the user input. If details are missing, leave them as null.",
      },
    ];

    if (typeof input === "string") {
      messages.push({
        role: "user" as const,
        content: input,
      });
    } else {
      const base64Image = await this.getBase64Image(input);
      messages.push({
        role: "user" as const,
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
            },
          },
        ],
      });
    }

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0,
      max_tokens: 500,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      response_format: zodResponseFormat(openAIFriendlySchema, "expense"),
    });

    return JSON.parse(completion.choices[0]?.message?.content || "{}");
  }
}
