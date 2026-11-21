"use client";

import React from "react";
import { BarChart3, Sparkles, MessageSquareQuote, Database } from "lucide-react";

export type TabKey = "sizing" | "classifier" | "explorer";

interface HeaderProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  totalRecords: number;
  brandedCount: number;
  nonBrandedCount: number;
}

export function Header({
  activeTab,
  onSelectTab,
  totalRecords,
  brandedCount,
  nonBrandedCount,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3.5 gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-sm ring-1 ring-indigo-700/20">
              <Sparkles className="w-5 h-5 text-indigo-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-slate-900">
                  UC 90-Day Repeat Discovery Engine
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                  Urban Company Case Study
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Customer Friction, Silent Churn & 90-Day Repeat Opportunity Sizing
              </p>
            </div>
          </div>

          {/* Dataset Status Badge & Pill Tabs */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Live Dataset Pill */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100/90 text-slate-700 border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Database className="w-3.5 h-3.5 text-slate-500" />
              <span>
                <strong className="text-slate-900 font-semibold">{totalRecords}</strong> Rows
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-600">
                {brandedCount} Branded / {nonBrandedCount} Non-Branded
              </span>
            </div>

            {/* Navigation Tabs */}
            <nav className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-medium">
              <button
                type="button"
                onClick={() => onSelectTab("sizing")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "sizing"
                    ? "bg-white text-slate-900 font-semibold shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Opportunity Sizing</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab("classifier")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "classifier"
                    ? "bg-white text-slate-900 font-semibold shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Live Classifier</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab("explorer")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "explorer"
                    ? "bg-white text-slate-900 font-semibold shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <MessageSquareQuote className="w-3.5 h-3.5 text-amber-600" />
                <span>Verbatim Explorer</span>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
