"use client";

import React, { useState } from "react";
import feedbackData from "@/data/analyzed_insights.json";
import { FeedbackRecord, OpportunityTheme } from "@/types/feedback";
import { Header, TabKey } from "@/components/Header";
import { OpportunitySizingTab } from "@/components/OpportunitySizingTab";
import { LiveClassifierTab } from "@/components/LiveClassifierTab";
import { VerbatimExplorerTab } from "@/components/VerbatimExplorerTab";

export default function Home() {
  const records = feedbackData as FeedbackRecord[];

  const [activeTab, setActiveTab] = useState<TabKey>("sizing");
  const [selectedThemeFilter, setSelectedThemeFilter] = useState<OpportunityTheme | null>(null);

  const totalCount = records.length;
  const brandedCount = records.filter((r) => r.query_type === "branded_uc").length;
  const nonBrandedCount = records.filter((r) => r.query_type === "non_branded_home_service").length;

  const handleSelectThemeFromChart = (theme: OpportunityTheme) => {
    setSelectedThemeFilter(theme);
    setActiveTab("explorer");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Sticky Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        totalRecords={totalCount}
        brandedCount={brandedCount}
        nonBrandedCount={nonBrandedCount}
      />

      {/* Main Content Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === "sizing" && (
          <OpportunitySizingTab
            records={records}
            onSelectThemeFilter={handleSelectThemeFromChart}
          />
        )}

        {activeTab === "classifier" && <LiveClassifierTab />}

        {activeTab === "explorer" && (
          <VerbatimExplorerTab
            records={records}
            initialThemeFilter={selectedThemeFilter}
            onClearInitialTheme={() => setSelectedThemeFilter(null)}
          />
        )}
      </main>

      {/* Sleek Executive Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">
              Urban Company 90-Day Repeat Opportunity Discovery Engine
            </span>
            <span>•</span>
            <span>Deliverable 1</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span>493 Classified Records</span>
            <span>•</span>
            <span>Google GenAI SDK (gemini-3.1-flash-lite)</span>
            <span>•</span>
            <span className="text-emerald-700 font-medium">Ready for Vercel Deployment</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
