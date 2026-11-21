import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UC 90-Day Repeat Discovery Engine | Urban Company Product Analytics",
  description: "Executive product-analytics engine discovering 90-day repeat booking friction, silent churn, and consumer-growth opportunities across home services.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#F8FAFC] text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
