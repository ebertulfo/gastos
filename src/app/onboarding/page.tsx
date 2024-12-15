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
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

export default function Onboarding() {
  const form = useForm({
    defaultValues: {
      name: localStorage.getItem("name") || "",
      country: localStorage.getItem("country") || "",
      currency: localStorage.getItem("currency") || "",
    },
  });

  const [step, setStep] = useState(0);

  useEffect(() => {
    const country = localStorage.getItem("country");
    const currency = localStorage.getItem("currency");

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
    form.setValue(field, value);
    localStorage.setItem(field, value);
  };

  const onSubmit = (data: any) => {
    // Process the form data
    console.log(data);
    localStorage.setItem("name", data.name);
    localStorage.setItem("country", data.country);
    localStorage.setItem("currency", data.currency);
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const stepVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
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
                  className="text-2xl lg:text-8xl mb-3"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  Hello!
                </motion.h2>
                <motion.h1
                  className="text-4xl lg:text-8xl mb-6"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1 }}
                >
                  Welcome to a simple way of tracking your spending.
                </motion.h1>
                <motion.h2
                  className="text-3xl mb-3 text-gray-700"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 3 }}
                >
                  But first, some details about you to make your experience here
                  better.
                </motion.h2>
                <motion.p
                  className="text-xl mb-6"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 4 }}
                >
                  Get started by providing some basic information.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.3, delay: 4 }}
                >
                  <Button
                    type="button"
                    className="text-xl"
                    size={"lg"}
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
                    <FormLabel className="text-2xl">
                      What should we call you?
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="text-xl h-12"
                        onChange={(e) =>
                          handleFieldChange("name", e.target.value)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                    <Button
                      type="button"
                      size={"lg"}
                      className="text-xl"
                      onClick={nextStep}
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
                    <FormLabel className="text-2xl">
                      Where are you from?
                    </FormLabel>
                    <FormControl>
                      <CountryCodeCombobox
                        {...field}
                        className="text-xl h-12"
                        onChange={(value) =>
                          handleFieldChange("country", value)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                    <div className="flex justify-between">
                      <Button
                        type="button"
                        size={"lg"}
                        className="text-xl"
                        onClick={prevStep}
                      >
                        Previous
                      </Button>
                      <Button
                        type="button"
                        size={"lg"}
                        className="text-xl"
                        onClick={nextStep}
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
                    <FormLabel className="text-2xl">
                      What currency are you using?
                    </FormLabel>
                    <FormControl>
                      <CurrencyCodeCombobox
                        {...field}
                        className="text-xl h-12"
                        onChange={(value) =>
                          handleFieldChange("currency", value)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                    <div className="flex justify-between">
                      <Button
                        type="button"
                        size={"lg"}
                        className="text-xl"
                        onClick={prevStep}
                      >
                        Previous
                      </Button>
                      <Button type="submit" size={"lg"} className="text-xl">
                        Submit
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
