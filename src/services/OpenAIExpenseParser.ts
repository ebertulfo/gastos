import { IExpenseParser } from "@/interfaces/IExpenseParser";
import { OpenAIExpenseSchema } from "@/schemas/expense";
import { ParsedExpense } from "@/types/responses";
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
    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system" as const,
        content:
          "You assist in logging expenses. Extract the amount, category, date (optional), and description from the user input. If details are missing, respond asking for clarification.",
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
      response_format: zodResponseFormat(OpenAIExpenseSchema, "expense"),
    });

    return JSON.parse(completion.choices[0]?.message?.content || "{}");
  }
}
