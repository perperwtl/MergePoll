import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "./language";

export const metadata: Metadata = {
  title: "MergePoll — Many ways to ask. One shared response.",
  description:
    "Ask freely. Find your shared questions. A live event Q&A and requests powered by semantic understanding.",
  icons: {
    icon: "/mergepoll-icon.svg",
    shortcut: "/mergepoll-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
