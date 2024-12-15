"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const SignInForm: React.FC = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState<number | null>(null);

  const sendMagicLink = async () => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`, // Redirect after login
        },
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
        });
      } else {
        toast({
          title: "Magic Link Sent",
          description: "Please check your email for the magic link to log in.",
        });
        setResendCooldown(30); // Start a cooldown before resending
      }
    } catch (error) {
      console.error("Error sending magic link:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendMagicLink = async () => {
    if (resendCooldown && resendCooldown > 0) return;
    await sendMagicLink();
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Card className="w-[320px]">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-4"
            />
            <Button
              onClick={sendMagicLink}
              className="w-full mb-4"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Magic Link"}
            </Button>
            <Button
              onClick={handleResendMagicLink}
              className="w-full"
              disabled={resendCooldown !== null && resendCooldown > 0}
            >
              {resendCooldown && resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : "Resend Magic Link"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignInForm;
