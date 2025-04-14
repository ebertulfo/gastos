"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CountryCodeCombobox } from "@/components/ui/country-code-select";
import { CurrencyCodeCombobox } from "@/components/ui/currency-code-select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import useProtectedRoute from "@/hooks/useProtectedRoute";
import { Loader2, User, AtSign, MapPin, DollarSign, BotIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Form validation schema
const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters long" }),
  email: z.string().email({ message: "Please enter a valid email address" }).optional(),
  country: z.string().min(2, { message: "Please select your country" }),
  currency: z.string().min(1, { message: "Please select your currency" }),
  telegram_id: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  useProtectedRoute();
  const { toast } = useToast();
  const { user, updateLoggedInUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Initialize form with default values
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: user?.email || "",
      country: "",
      currency: "",
      telegram_id: "",
    },
  });

  // Fetch user profile data from Supabase
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          // Update form fields with profile data
          form.setValue("name", data.full_name || "");
          form.setValue("email", user.email || "");
          form.setValue("country", data.country || "");
          form.setValue("currency", data.currency || "");
          form.setValue("telegram_id", data.telegram_id || "");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast({
          title: "Error",
          description: "Failed to load your profile information.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user, form, toast]);

  // Handle form submission
  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to update your profile",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      
      // Update the user's profile in Supabase
      const { error } = await supabase
        .from("user_profiles")
        .upsert({
          id: user.id,
          full_name: data.name,
          country: data.country,
          currency: data.currency,
          telegram_id: data.telegram_id || null,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }

      // Update the user object in AuthContext with the new data
      if (user) {
        updateLoggedInUser({
          ...user,
          currency: data.currency,
        });
      }

      toast({
        title: "Success",
        description: "Your profile has been updated successfully!",
      });

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Your Information</CardTitle>
          <CardDescription>
            Update your personal information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2 text-muted-foreground" />
                        <Input {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <AtSign className="w-4 h-4 mr-2 text-muted-foreground" />
                        <Input {...field} readOnly disabled className="bg-muted" />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Email address cannot be changed
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                          <CountryCodeCombobox {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-2 text-muted-foreground" />
                          <CurrencyCodeCombobox {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="telegram_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telegram ID</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <BotIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                        <Input {...field} placeholder="Your Telegram ID (optional)" />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Connect your Telegram account to use our expense tracking bot
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <CardFooter className="flex justify-end px-0 pb-0">
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {submitting ? "Saving Changes..." : "Save Changes"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}