export interface IIntentDetector {
  detectIntent(message: string): Promise<"log" | "query">;
}
