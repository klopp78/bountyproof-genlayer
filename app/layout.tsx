import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bountyproof-genlayer.galaxthoo.chatgpt.site"),
  title: "BountyProof for GenLayer",
  description:
    "A GenLayer-powered bounty and grant claim workflow with consensus-reviewed evidence.",
  openGraph: {
    title: "BountyProof for GenLayer",
    description:
      "Consensus-reviewed bug bounty and grant milestone award receipts.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "BountyProof for GenLayer social preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BountyProof for GenLayer",
    description:
      "Consensus-reviewed bug bounty and grant milestone award receipts.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
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
