"use client";
import { Button } from "@/components/ui/button";
import { CountryCodeCombobox } from "@/components/ui/country-code-select";
import { CurrencyCodeCombobox } from "@/components/ui/currency-code-select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";

// Form validation schema
const onboardingSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters long" }),
  country: z.string().min(2, { message: "Please select your country" }),
  currency: z.string().min(1, { message: "Please select your currency" }),
  telegram_id: z.string().optional(),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

export default function Onboarding() {
  const { toast } = useToast();
  const { user, updateLoggedInUser } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: "",
      country: "",
      currency: "",
      telegram_id: "",
    },
  });

  const [step, setStep] = useState(0);

  useEffect(() => {
    // Load any existing data from localStorage as a fallback
    const name = localStorage.getItem("name");
    const country = localStorage.getItem("country");
    const currency = localStorage.getItem("currency");
    const telegram_id = localStorage.getItem("telegram_id");

    if (name) form.setValue("name", name);
    if (country) form.setValue("country", country);
    if (currency) form.setValue("currency", currency);
    if (telegram_id) form.setValue("telegram_id", telegram_id);

    // If country and currency are not set, attempt to detect them
    if (!country || !currency) {
      // Attempt to detect the user's country and currency using ipapi
      const detectCountryAndCurrency = async () => {
        try {
          const response = await fetch("https://ipapi.co/json/");
          const data = await response.json();
          if (!country) {
            form.setValue("country", data.country_name);
            localStorage.setItem("country", data.country_name);
          }
          if (!currency) {
            form.setValue("currency", data.currency);
            localStorage.setItem("currency", data.currency);
          }
        } catch (error) {
          console.error("Failed to detect country and currency", error);
        }
      };

      detectCountryAndCurrency();
    }
  }, [form]);

  const handleFieldChange = (field: string, value: string) => {
    form.setValue(field as any, value);
    localStorage.setItem(field, value);
  };

  const onSubmit = async (data: OnboardingFormValues) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to complete onboarding",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      
      // Save form data to localStorage as backup
      localStorage.setItem("name", data.name);
      localStorage.setItem("country", data.country);
      localStorage.setItem("currency", data.currency);
      if (data.telegram_id) localStorage.setItem("telegram_id", data.telegram_id);
      
      // Update the user's profile in Supabase
      const { error } = await supabase
        .from("user_profiles")
        .upsert({
          id: user.id,
          full_name: data.name,
          country: data.country,
          currency: data.currency,
          telegram_id: data.telegram_id || null,
          is_onboarded: true,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }

      // Update the user object in context
      updateLoggedInUser({
        ...user,
        is_onboarded: true,
      });

      toast({
        title: "Success",
        description: "Your profile has been updated successfully!",
      });

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const stepVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-md">
          <motion.div
            key={step}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={stepVariants}
            transition={{ duration: 0.5 }}
          >
            {step === 0 && (
              <div className="space-y-6">
                <motion.h2
                  className="text-2xl font-bold mb-3"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  Hello!
                </motion.h2>
                <motion.h1
                  className="text-3xl font-bold mb-6"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  Welcome to a simple way of tracking your spending.
                </motion.h1>
                <motion.h2
                  className="text-lg mb-3 text-muted-foreground"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  But first, some details about you to make your experience here
                  better.
                </motion.h2>
                <motion.p
                  className="text-sm mb-6 text-muted-foreground"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.9 }}
                >
                  Get started by providing some basic information.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.2 }}
                >
                  <Button
                    type="button"
                    size="lg"
                    className="w-full"
                    onClick={nextStep}
                  >
                    Get Started
                  </Button>
                </motion.div>
              </div>
            )}
            {step === 1 && (
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormLabel className="text-xl">
                      What should we call you?
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="h-12"
                        placeholder="Your name"
                        onChange={(e) =>
                          handleFieldChange("name", e.target.value)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                    <Button
                      type="button"
                      size="lg"
                      className="w-full mt-4"
                      onClick={nextStep}
                      disabled={!form.getValues("name")}
                    >
                      Next
                    </Button>
                  </FormItem>
                )}
              />
            )}
            {step === 2 && (
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormLabel className="text-xl">
                      Where are you from?
                    </FormLabel>
                    <FormControl>
                      <CountryCodeCombobox
                        {...field}
                        className="h-12"
                        onChange={(value) =>
                          handleFieldChange("country", value)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                    <div className="flex justify-between gap-4 mt-4">
                      <Button
                        type="button"
                        size="lg"
                        variant="outline"
                        className="w-1/2"
                        onClick={prevStep}
                      >
                        Previous
                      </Button>
                      <Button
                        type="button"
                        size="lg"
                        className="w-1/2"
                        onClick={nextStep}
                        disabled={!form.getValues("country")}
                      >
                        Next
                      </Button>
                    </div>
                  </FormItem>
                )}
              />
            )}
            {step === 3 && (
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormLabel className="text-xl">
                      What currency do you use?
                    </FormLabel>
                    <FormControl>
                      <CurrencyCodeCombobox
                        {...field}
                        className="h-12"
                        onChange={(value) =>
                          handleFieldChange("currency", value)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                    <div className="flex justify-between gap-4 mt-4">
                      <Button
                        type="button"
                        size="lg"
                        variant="outline"
                        className="w-1/2"
                        onClick={prevStep}
                      >
                        Previous
                      </Button>
                      <Button
                        type="button"
                        size="lg"
                        className="w-1/2"
                        onClick={nextStep}
                        disabled={!form.getValues("currency")}
                      >
                        Next
                      </Button>
                    </div>
                  </FormItem>
                )}
              />
            )}
            {step === 4 && (
              <FormField
                control={form.control}
                name="telegram_id"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormLabel className="text-xl">
                      Telegram ID (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="h-12"
                        placeholder="Your Telegram ID (if you have one)"
                        onChange={(e) =>
                          handleFieldChange("telegram_id", e.target.value)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-muted-foreground">
                      Connect your Telegram account to log expenses via our Telegram bot.
                      You can set this up later too.
                    </p>
                    <div className="flex justify-between gap-4 mt-4">
                      <Button
                        type="button"
                        size="lg"
                        variant="outline"
                        className="w-1/2"
                        onClick={prevStep}
                      >
                        Previous
                      </Button>
                      <Button 
                        type="submit" 
                        size="lg" 
                        className="w-1/2"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        {submitting ? "Saving..." : "Complete"}
                      </Button>
                    </div>
                  </FormItem>
                )}
              />
            )}
          </motion.div>
        </form>
      </Form>
    </div>
  );
}
