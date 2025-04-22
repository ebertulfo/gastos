"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useState } from "react";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Email schema validation
const emailSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

// OTP verification schema
const otpSchema = z.object({
  otp: z.string().min(6, { message: "OTP must be at least 6 characters" }),
});

type EmailFormValues = z.infer<typeof emailSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;

const SignInForm: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState<number | null>(null);

  // Email form
  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
    },
  });

  // OTP form
  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  // Start countdown for resend cooldown
  const startCooldown = () => {
    setResendCooldown(30);
    const interval = setInterval(() => {
      setResendCooldown((current) => {
        if (current === null || current <= 1) {
          clearInterval(interval);
          return null;
        }
        return current - 1;
      });
    }, 1000);
  };

  // Send OTP to email
  const sendOtp = async (values: EmailFormValues) => {
    try {
      setLoading(true);
      setEmail(values.email);

      // We'll use a simpler approach - always create the user if they don't exist
      const { error } = await supabase.auth.signInWithOtp({
        email: values.email,
        options: {
          shouldCreateUser: true,
          // Force OTP for both new and existing users (instead of confirmation links)
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "OTP Sent",
          description: "Please check your email for the verification code.",
        });
        setEmailSubmitted(true);
        startCooldown();
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP code
  const verifyOtp = async (values: OtpFormValues) => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.verifyOtp({
        email,
        token: values.otp,
        type: "email",
      });

      if (error) {
        toast({
          title: "Verification Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "You are now signed in!",
        });
        // Auth context will handle the redirect
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown && resendCooldown > 0) return;
    
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          // Force OTP for both new and existing users
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "OTP Resent",
          description: "Please check your email for the new verification code.",
        });
        startCooldown();
      }
    } catch (error) {
      console.error("Error resending OTP:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!emailSubmitted ? (
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(sendOtp)} className="space-y-4">
                <FormField
                  control={emailForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="name@example.com" {...field} type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Continue with Email"}
                </Button>
              </form>
            </Form>
          ) : (
            <div className="space-y-4">
              <Form {...otpForm}>
                <form onSubmit={otpForm.handleSubmit(verifyOtp)} className="space-y-4">
                  <FormField
                    control={otpForm.control}
                    name="otp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Verification Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter the 6-digit code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Verifying..." : "Verify and Sign In"}
                  </Button>
                </form>
              </Form>
              <div className="text-center mt-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Didn&apos;t receive the code?
                </p>
                <Button
                  variant="outline"
                  onClick={handleResendOtp}
                  disabled={resendCooldown !== null && resendCooldown > 0 || loading}
                  className="w-full"
                >
                  {resendCooldown && resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : "Resend Code"}
                </Button>
                <Button
                  variant="link"
                  onClick={() => setEmailSubmitted(false)}
                  className="w-full mt-2"
                >
                  Use a different email
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col">
          <p className="px-8 text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our{" "}
            <Link
              href="#"
              className="underline underline-offset-4 hover:text-primary"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="#"
              className="underline underline-offset-4 hover:text-primary"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignInForm;
