import type { Metadata } from "next";
import localFont from "next/font/local";
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
  title: "PSKO | Clinical Psychology Simulation Trainer",
  description:
    "PSKO helps psychology students practice clinical interviewing through AI-powered therapy simulations, guided prompts, and structured feedback.",
  applicationName: "PSKO",
  keywords: [
    "PSKO",
    "clinical psychology",
    "therapy simulation",
    "psychology students",
    "CBT training",
    "clinical interview practice",
  ],
  openGraph: {
    title: "PSKO | Clinical Psychology Simulation Trainer",
    description:
      "Practice clinical interviewing skills with realistic client simulations, therapeutic guidance, and competency-based feedback.",
    siteName: "PSKO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PSKO | Clinical Psychology Simulation Trainer",
    description:
      "AI-powered client simulations for psychology students learning clinical interviewing and therapeutic approaches.",
  },
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
        {children}
      </body>
    </html>
  );
}
