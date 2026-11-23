"use client";

import React, { useState, useMemo } from "react";
import feedbackData from "@/data/analyzed_insights.json";
import { FeedbackRecord, OpportunityTheme } from "@/types/feedback";
import { Header, TabKey } from "@/components/Header";
import { ScopeCalibrationBar } from "@/components/ScopeCalibrationBar";
import { OpportunitySizingTab } from "@/components/OpportunitySizingTab";
import { LiveClassifierTab } from "@/components/LiveClassifierTab";
import { VerbatimExplorerTab } from "@/components/VerbatimExplorerTab";
import { UC_VERTICALS, mapToUcVertical } from "@/utils/ucVerticals";

export default function Home() {
  const rawRecords = feedbackData as FeedbackRecord[];

  const [activeTab, setActiveTab] = useState<TabKey>("sizing");
  const [selectedThemeFilter, setSelectedThemeFilter] = useState<OpportunityTheme | null>(null);
  const [drilldownKey, setDrilldownKey] = useState<number>(0);

  // Scope & Calibration States (Unified across Sizing & Verbatim Tabs)
  const [excludeBadExperiences, setExcludeBadExperiences] = useState(false);
  const [consumerControllableOnly, setConsumerControllableOnly] = useState(true);
  const [selectedVertical, setSelectedVertical] = useState<string>("All Services");

  // 1. Map all records with their UC vertical
  const annotatedRecords = useMemo(() => {
    return rawRecords.map((rec) => ({
      ...rec,
      uc_vertical: rec.uc_vertical || mapToUcVertical(rec),
    }));
  }, [rawRecords]);

  // 2. Base calibration scope (Toggles applied)
  const scopedRecords = useMemo(() => {
    return annotatedRecords.filter((rec) => {
      // Negativity Bias Control: Exclude 1-2 star / Negative sentiment / Out-of-scope service failure
      if (excludeBadExperiences) {
        if (rec.rating_or_upvotes && rec.rating_or_upvotes <= 2) return false;
        if (rec.sentiment === "Negative") return false;
        if (rec.opportunity_theme === "Service Quality / Partner Ops (Out of Scope)") return false;
      }

      // Scope Filter: Consumer Growth Controllable Only
      // When "Consumer Growth Controllable Only" is toggled ON, ALSO exclude any record mapped to "Insta Help (Out of Scope)" (in addition to out-of-scope opportunity themes)
      if (consumerControllableOnly) {
        if (!rec.consumer_growth_controllable) return false;
        if (rec.opportunity_theme.includes("(Out of Scope)")) return false;
        if (rec.uc_vertical === "Insta Help (Out of Scope)") return false;
      }

      return true;
    });
  }, [annotatedRecords, excludeBadExperiences, consumerControllableOnly]);

  // 3. Live counts per vertical within current scoped view (before vertical filter is applied)
  const verticalCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of UC_VERTICALS) {
      counts[v] = 0;
    }
    for (const rec of scopedRecords) {
      const v = rec.uc_vertical || "Platform & General";
      counts[v] = (counts[v] || 0) + 1;
    }
    return UC_VERTICALS
      .map((v) => ({ vertical: v, count: counts[v] || 0 }))
      .filter((v) => v.count > 0);
  }, [scopedRecords]);

  // 4. Finally apply selectedVertical
  const finalFilteredRecords = useMemo(() => {
    if (selectedVertical === "All Services") {
      return scopedRecords;
    }
    return scopedRecords.filter((rec) => rec.uc_vertical === selectedVertical);
  }, [scopedRecords, selectedVertical]);

  const totalCount = rawRecords.length;
  const brandedCount = rawRecords.filter((r) => r.query_type === "branded_uc").length;
  const nonBrandedCount = rawRecords.filter((r) => r.query_type === "non_branded_home_service").length;

  const handleSelectThemeFromChart = (theme: OpportunityTheme) => {
    setSelectedThemeFilter(theme);
    setDrilldownKey((k) => k + 1);
    setActiveTab("explorer");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
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
        {/* Global Discovery Scope & Bias Calibration Bar (Tabs 1 & 3 only) */}
        {activeTab !== "classifier" && (
          <ScopeCalibrationBar
            excludeBadExperiences={excludeBadExperiences}
            onToggleExcludeBadExperiences={setExcludeBadExperiences}
            consumerControllableOnly={consumerControllableOnly}
            onToggleConsumerControllableOnly={setConsumerControllableOnly}
            selectedVertical={selectedVertical}
            onSelectVertical={setSelectedVertical}
            verticalCounts={verticalCounts}
            totalScopedCount={scopedRecords.length}
          />
        )}

        {activeTab === "sizing" && (
          <OpportunitySizingTab
            records={finalFilteredRecords}
            totalBaseCount={totalCount}
            onSelectThemeFilter={handleSelectThemeFromChart}
          />
        )}

        {activeTab === "classifier" && <LiveClassifierTab />}

        {activeTab === "explorer" && (
          <VerbatimExplorerTab
            key={`explorer-${selectedThemeFilter || "all"}-${drilldownKey}-${selectedVertical}`}
            records={finalFilteredRecords}
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
