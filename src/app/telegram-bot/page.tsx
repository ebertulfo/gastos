"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useProtectedRoute from "@/hooks/useProtectedRoute";
import { useState } from "react";

export default function TelegramBotPage() {
  const { user } = useProtectedRoute();
  console.log("@@@ SOKPA", user);
  const [isLinked, setIsLinked] = useState(user?.telegramLinked);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch("/api/verify-telegram-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, userId: user?.uid }),
    });
    const data = await response.json();

    if (data.success) {
      setMessage("Your account has been successfully linked!");
      setIsLinked(true); // Update user context (this won't trigger a re-render but reflects state)
    } else {
      setMessage("Invalid or expired code. Please try again.");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>
            {isLinked ? "Your Bot is Connected" : "Link Your Telegram Account"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLinked ? (
            <>
              <p>Your bot is now connected and ready to use!</p>
              <p>
                Start chatting here:{" "}
                <a
                  href={`https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}`}
                  className="text-blue-500"
                >
                  @{process.env.NEXT_PUBLIC_BOT_USERNAME}
                </a>
              </p>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Label htmlFor="code">
                Enter the code sent to you on Telegram:
              </Label>
              <Input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
              <Button type="submit" className="w-full mt-4">
                Submit
              </Button>
              {message && <p className="mt-4 text-center">{message}</p>}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
