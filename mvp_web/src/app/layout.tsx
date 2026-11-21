import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UC Case Study | Deliverable 3 - Solution MVP",
  description: "Functional MVP prototype for Urban Company: Guaranteed Pre-Authorized Rate Card, Certified Part Verification, and Instant AI Triage.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-black text-white font-bold text-lg shadow-sm">
                UC
              </span>
              <div>
                <h1 className="text-base font-bold leading-none text-slate-900">Urban Company Case Study</h1>
                <span className="text-xs text-indigo-600 font-semibold">Deliverable 3: Solution MVP Prototype</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 border border-indigo-200">
                ● Live MVP Environment
              </span>
            </div>
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
          Urban Company Product Case Study • Solution Prototype Deliverable
        </footer>
      </body>
    </html>
  );
}
