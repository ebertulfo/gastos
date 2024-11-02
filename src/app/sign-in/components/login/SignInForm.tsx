"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  completeSignInWithEmailLink,
  sendSignInLink,
  signInWithPhone,
} from "@/lib/firebase/auth";
import {
  RecaptchaVerifier,
  getAuth,
  isSignInWithEmailLink,
} from "firebase/auth";

const SignInForm: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"email" | "emailLink" | "phone">(
    "emailLink"
  );
  const { user, updateLoggedInUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState<number | null>(null);
  const [emailSent, setEmailSent] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      const urlParams = new URLSearchParams(window.location.search);
      const telegramUserId = urlParams.get("telegramUserId");

      if (telegramUserId) {
        // Link Telegram user ID if already logged in
        linkTelegramAccount(user.uid, telegramUserId);
      } else {
        // Redirect logged-in users to the dashboard
        router.push("/dashboard");
      }
    }
  }, [user, router]);

  const linkTelegramAccount = async (
    firebaseUserId: string,
    telegramUserId: string
  ) => {
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firebaseUserId,
          telegramUserId,
        }),
      });
      console.log("@@@@ response", response);
      if (response.ok) {
        alert("pasok");
        toast({
          title: "Linked Successfully",
          description: "Your Telegram account has been linked successfully.",
        });
      } else {
        const errorData = await response.json();
        console.error("Failed to link Telegram account:", errorData.error);
        toast({
          title: "Linking Failed",
          description:
            "Could not link your Telegram account. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error linking Telegram account:", error);
      toast({
        title: "Linking Error",
        description: "An error occurred while linking your Telegram account.",
      });
    }
  };

  useEffect(() => {
    const auth = getAuth();
    if (isSignInWithEmailLink(auth, window.location.href)) {
      completeSignInWithEmailLink(window.location.href)
        .then((user) => {
          if (user) {
            updateLoggedInUser(user); // Update the context with the signed-in user
            toast({
              title: "Sign-in Successful",
              description: "You are now signed in.",
            });
            router.push("/dashboard");
          }
        })
        .catch((error) => {
          toast({
            title: "Error",
            description: "Failed to complete sign-in.",
          });
        });
    }
  }, []);

  useEffect(() => {
    const auth = getAuth();
    if (isSignInWithEmailLink(auth, window.location.href)) {
      completeSignInWithEmailLink(window.location.href)
        .then(async (user) => {
          if (user) {
            updateLoggedInUser(user); // Update the context with the signed-in user

            // Send a POST request to link the Telegram user ID
            const telegramUserId = new URLSearchParams(
              window.location.search
            ).get("telegramUserId");
            if (telegramUserId) {
              try {
                const response = await fetch("/api/auth", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    idToken: await user.getIdToken(),
                    firebaseUserId: user.uid,
                    telegramUserId,
                  }),
                });

                if (response.ok) {
                  toast({
                    title: "Sign-in Successful",
                    description:
                      "You are now signed in and linked to Telegram.",
                  });
                } else {
                  const errorData = await response.json();
                  console.error("Failed to link Telegram:", errorData.error);
                  toast({
                    title: "Warning",
                    description: "Signed in, but failed to link with Telegram.",
                  });
                }
              } catch (error) {
                console.error("Error linking Telegram ID:", error);
                toast({
                  title: "Warning",
                  description:
                    "Signed in, but an error occurred linking with Telegram.",
                });
              }
            } else {
              toast({
                title: "Sign-in Successful",
                description: "You are now signed in.",
              });
            }

            router.push("/dashboard");
          }
        })
        .catch((error) => {
          toast({
            title: "Error",
            description: "Failed to complete sign-in.",
          });
        });
    }
  }, [router, updateLoggedInUser, toast]);

  useEffect(() => {
    if (resendCooldown && resendCooldown > 0) {
      const timer = setInterval(() => {
        setResendCooldown((prev) => (prev ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [resendCooldown]);

  const handleTabChange = (tab: "emailLink" | "phone") => {
    setActiveTab(tab);
  };

  const handleSendSignInLink = async () => {
    try {
      setLoading(true);
      const isOk = await sendSignInLink(email);
      if (isOk) {
        setEmailSent(true);
        setResendCooldown(30); // Set a cooldown of 30 seconds for resending the link
        toast({
          title: "Link Sent",
          description:
            "Please check your email for the sign-in link (including spam).",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to send the sign-in link.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendSignInLink = async () => {
    if (resendCooldown && resendCooldown > 0) return;
    await handleSendSignInLink();
  };

  const sendVerificationCode = async () => {
    try {
      setLoading(true);
      const auth = getAuth(); // Get the Firebase Auth instance

      // Initialize RecaptchaVerifier with correct parameters
      const appVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container", // Target the reCAPTCHA container
        {
          size: "invisible", // Use an invisible reCAPTCHA
          callback: (response: any) => {
            // reCAPTCHA solved - proceed with sign-in
          },
        }
      );

      // Sign in using phone number and reCAPTCHA
      const result = await signInWithPhone(phoneNumber, appVerifier);
      if (result) {
        setConfirmationResult(result);
        toast({
          title: "Code Sent",
          description: "Verification code has been sent.",
        });
        // Set the resend cooldown (e.g., 30 seconds)
        setResendCooldown(30);
      } else {
        toast({
          title: "Error",
          description: "Failed to send verification code.",
        });
      }
    } catch (error) {
      console.error("Error while sending verification code", error);
      toast({
        title: "Error",
        description: "An error occurred while sending verification code.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async () => {
    await sendVerificationCode();
  };

  const handleResendCode = async () => {
    if (resendCooldown && resendCooldown > 0) return;
    await sendVerificationCode();
  };

  const handleVerification = async () => {
    if (confirmationResult) {
      try {
        setLoading(true);
        const userCreds = await confirmationResult.confirm(verificationCode);
        if (userCreds) {
          toast({
            title: "Sign-in Successful",
            description: "You are now signed in.",
          });
          router.push("/dashboard");
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Invalid verification code.",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center mb-4">
            <Button
              variant={activeTab === "emailLink" ? "default" : "outline"}
              onClick={() => handleTabChange("emailLink")}
              className="mr-2"
            >
              Email Link Sign In
            </Button>
            <Button
              variant={activeTab === "phone" ? "default" : "outline"}
              onClick={() => handleTabChange("phone")}
            >
              Phone Sign In
            </Button>
          </div>

          {activeTab === "emailLink" && (
            <div className="flex flex-col items-center">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mb-4"
              />
              <Button
                onClick={handleSendSignInLink}
                className="w-full"
                disabled={
                  loading ||
                  (emailSent && resendCooldown !== null && resendCooldown > 0)
                }
              >
                {loading ? "Sending..." : "Send Sign-In Link"}
              </Button>

              {emailSent && (
                <div className="mt-4 text-center">
                  <p>
                    Please check your email for the sign-in link (including
                    spam).
                  </p>
                  <Button
                    onClick={handleResendSignInLink}
                    className="mt-2"
                    disabled={resendCooldown !== null && resendCooldown > 0}
                  >
                    {resendCooldown && resendCooldown > 0
                      ? `Resend Link in ${resendCooldown}s`
                      : "Resend Sign-In Link"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeTab === "phone" && (
            <div className="flex flex-col items-center">
              <Input
                type="tel"
                placeholder="Phone Number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="mb-4"
              />
              <Button
                onClick={handlePhoneSubmit}
                className="w-full mb-4"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Verification Code"}
              </Button>
              <div id="recaptcha-container"></div>

              {confirmationResult && (
                <>
                  <Input
                    type="text"
                    placeholder="Verification Code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="mb-4"
                  />
                  <Button
                    onClick={handleVerification}
                    className="w-full mb-4"
                    disabled={loading}
                  >
                    {loading ? "Verifying..." : "Verify Code"}
                  </Button>
                  <Button
                    onClick={handleResendCode}
                    className="w-full"
                    disabled={resendCooldown !== null && resendCooldown > 0}
                  >
                    {resendCooldown && resendCooldown > 0
                      ? `Resend Code in ${resendCooldown}s`
                      : "Resend Verification Code"}
                  </Button>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SignInForm;
