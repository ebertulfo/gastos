import { AuthProvider } from "@/contexts/AuthContext"; // Import the AuthProvider
import type { Metadata } from "next";
import localFont from "next/font/local";
import Navbar from "./components/NavBar";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {" "}
          {/* Wrap the entire app with AuthProvider */}
          <Navbar />
          <main className="w-[360px] md:w-[700px] lg:w-[960px] xl:w-[1200px] mx-[auto]">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
