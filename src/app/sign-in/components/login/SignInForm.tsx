"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { signInWithPhone } from "@/lib/firebase/auth";
import { ConfirmationResult, RecaptchaVerifier, getAuth } from "firebase/auth";

const SignInForm: React.FC = () => {
  // const [activeTab, setActiveTab] = useState<"email" | "emailLink" | "phone">(
  //   "emailLink"
  // );
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState("");
  // const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState<number | null>(null);
  // const [emailSent, setEmailSent] = useState<boolean>(false);
  // const [countryCode, setCountryCode] = useState("+1"); // Default country code

  useEffect(() => {
    if (user) {
      // Redirect logged-in users to the dashboard
      router.push("/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    if (resendCooldown && resendCooldown > 0) {
      const timer = setInterval(() => {
        setResendCooldown((prev) => (prev ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [resendCooldown]);

  // const handleTabChange = (tab: "emailLink" | "phone") => {
  //   setActiveTab(tab);
  // };

  // const handleSendSignInLink = async () => {
  //   try {
  //     setLoading(true);
  //     const isOk = await sendSignInLink(email);
  //     if (isOk) {
  //       setEmailSent(true);
  //       setResendCooldown(30); // Set a cooldown of 30 seconds for resending the link
  //       toast({
  //         title: "Link Sent",
  //         description:
  //           "Please check your email for the sign-in link (including spam).",
  //       });
  //     } else {
  //       toast({
  //         title: "Error",
  //         description: "Failed to send the sign-in link.",
  //       });
  //     }
  //   } catch (error) {
  //     console.error("Error sending sign-in link:", error);
  //     toast({
  //       title: "Error",
  //       description: "An unexpected error occurred.",
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const handleResendSignInLink = async () => {
  //   if (resendCooldown && resendCooldown > 0) return;
  //   await handleSendSignInLink();
  // };

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
          callback: () => {
            // reCAPTCHA solved - proceed with sign-in
          },
        }
      );

      // Sign in using phone number and reCAPTCHA
      const result = await signInWithPhone(phoneNumber, appVerifier); // Include country code
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
        console.error("Error verifying code:", error);
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
      <Card className="w-[320px]">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center mb-4 text-xs font-extralight">
            Please enter your phone number and we will send you a verification
            code.
          </div>
          <div className="flex flex-col items-center">
            <div className="flex mb-4 w-full">
              {/* <CountryCodeCombobox
                value={countryCode}
                onChange={(e) => setCountryCode(e)}
              /> */}
              <Input
                type="tel"
                placeholder="+6589898989"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="flex-1"
              />
            </div>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default SignInForm;
