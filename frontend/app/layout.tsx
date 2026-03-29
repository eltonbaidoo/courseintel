import type { Metadata } from "next";
import {
  Inter,
  Playfair_Display,
  Roboto,
  Roboto_Condensed,
  Roboto_Slab,
} from "next/font/google";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ToastProvider } from "@/components/ui/ToastProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const roboto = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
  display: "swap",
});

const robotoCondensed = Roboto_Condensed({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto-condensed",
  display: "swap",
});

const robotoSlab = Roboto_Slab({
  weight: ["400", "500", "700", "800"],
  subsets: ["latin"],
  variable: "--font-roboto-slab",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CourseIntel: Know your course.",
  description: "A multi-agent academic intelligence engine for students.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfair.variable} ${roboto.variable} ${robotoCondensed.variable} ${robotoSlab.variable} font-sans antialiased`}
      >
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
