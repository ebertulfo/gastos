import { IExpenseParser } from "@/interfaces/IExpenseParser";
import { IIntentDetector } from "@/interfaces/IIntentDetector";
import { OpenAIExpenseParser } from "@/services/OpenAIExpenseParser";
import { OpenAIIntentDetector } from "@/services/OpenAIIntentDetector";
import OpenAI from "openai";

// src/factories/serviceFactory.ts
export class ServiceFactory {
  static createIntentDetector(openai: OpenAI): IIntentDetector {
    return new OpenAIIntentDetector(openai);
  }

  static createExpenseParser(openai: OpenAI): IExpenseParser {
    return new OpenAIExpenseParser(openai);
  }
}
