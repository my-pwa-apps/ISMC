import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { Toaster } from "react-hot-toast";

const segoeUI = Inter({ subsets: ["latin"] }); // Fallback font if Segoe UI unavailable

export const metadata: Metadata = {
  title: {
    default: "ISMC — Intune Settings Management Console",
    template: "%s | ISMC",
  },
  description:
    "Enterprise management console for Microsoft Intune policies — GPMC equivalent for modern device management.",
  robots: { index: false, follow: false }, // Admin tool — do not index
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={segoeUI.className}>
      <body>
        <QueryProvider>
          {children}
        </QueryProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: "Segoe UI, sans-serif",
              fontSize: "14px",
              borderRadius: "4px",
            },
          }}
        />
      </body>
    </html>
  );
}
