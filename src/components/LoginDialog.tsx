"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";

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

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginDialog({ isOpen, onClose }: LoginDialogProps) {
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

      // Always set shouldCreateUser: true to ensure consistent behavior
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
          title: "Something went wrong",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Code sent",
          description: "Check your email for the verification code.",
        });
        setEmailSubmitted(true);
        startCooldown();
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast({
        title: "Something went wrong",
        description: "Couldn't send the code. Try again in a moment.",
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
          title: "Couldn't verify",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Signed in",
          description: "Welcome to Gastos!",
        });
        // Close the dialog after successful login
        onClose();
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast({
        title: "Something went wrong",
        description: "Couldn't verify the code. Try again in a moment.",
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
          title: "Something went wrong",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Code resent",
          description: "Check your email for the new code.",
        });
        startCooldown();
      }
    } catch (error) {
      console.error("Error resending OTP:", error);
      toast({
        title: "Something went wrong",
        description: "Couldn't resend the code. Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset form state when dialog is closed
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setEmailSubmitted(false);
      setEmail("");
      emailForm.reset();
      otpForm.reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign In</DialogTitle>
          <DialogDescription>
            {!emailSubmitted 
              ? "Sign in to use the expense tracking assistant."
              : `Enter the verification code sent to ${email}`
            }
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
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
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={onClose} type="button">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Sending..." : "Continue with Email"}
                  </Button>
                </div>
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
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setEmailSubmitted(false)} 
                      type="button"
                    >
                      Back
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Verifying..." : "Sign In"}
                    </Button>
                  </div>
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
              </div>
            </div>
          )}
          <div className="px-8 text-center text-sm text-muted-foreground">
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}