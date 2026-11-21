"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  RotateCcw,
  Star,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  FeedbackRecord,
  OpportunityTheme,
  WorkaroundMentioned,
} from "@/types/feedback";

interface VerbatimExplorerTabProps {
  records: FeedbackRecord[];
  initialThemeFilter?: OpportunityTheme | null;
  onClearInitialTheme?: () => void;
}

const ITEMS_PER_PAGE = 20;

const OPPORTUNITY_THEMES: OpportunityTheme[] = [
  "App & Booking Friction",
  "Offline / Local Habit Fallback",
  "Post-Service Maintenance & Reminder Gap",
  "Cross-Category Discovery Gap",
  "Trust & Predictability Anxiety",
  "Positive / No Clear Friction",
  "Service Quality / Partner Ops (Out of Scope)",
  "Pricing & Hidden Charges (Out of Scope)",
];

const WORKAROUNDS: WorkaroundMentioned[] = [
  "Local Technician",
  "Competitor App",
  "Maid / Neighbour / WhatsApp",
  "DIY",
  "None",
];

export function VerbatimExplorerTab({
  records,
  initialThemeFilter,
  onClearInitialTheme,
}: VerbatimExplorerTabProps) {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQueryType, setSelectedQueryType] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [selectedTheme, setSelectedTheme] = useState<string>(
    initialThemeFilter || "all"
  );
  const [selectedWorkaround, setSelectedWorkaround] = useState<string>("all");
  const [selectedSentiment, setSelectedSentiment] = useState<string>("all");
  const [selectedControllable, setSelectedControllable] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [lastInitialTheme, setLastInitialTheme] = useState<OpportunityTheme | null | undefined>(
    initialThemeFilter
  );

  // Synchronize when initialThemeFilter changes (standard React state-from-props pattern)
  if (initialThemeFilter && initialThemeFilter !== lastInitialTheme) {
    setLastInitialTheme(initialThemeFilter);
    setSelectedTheme(initialThemeFilter);
    setCurrentPage(1);
  }

  // Filtering Logic
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      // 1. Keyword Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesText = rec.text.toLowerCase().includes(q);
        const matchesSummary = rec.summary.toLowerCase().includes(q);
        const matchesCategory = rec.service_category.toLowerCase().includes(q);
        const matchesPainPoint = rec.pain_point.toLowerCase().includes(q);
        if (!matchesText && !matchesSummary && !matchesCategory && !matchesPainPoint) {
          return false;
        }
      }

      // 2. Query Type Filter
      if (selectedQueryType !== "all" && rec.query_type !== selectedQueryType) {
        return false;
      }

      // 3. Source Filter
      if (selectedSource !== "all" && rec.source !== selectedSource) {
        return false;
      }

      // 4. Opportunity Theme Filter
      if (selectedTheme !== "all" && rec.opportunity_theme !== selectedTheme) {
        return false;
      }

      // 5. Workaround Mentioned Filter
      if (selectedWorkaround !== "all" && rec.workaround_mentioned !== selectedWorkaround) {
        return false;
      }

      // 6. Sentiment Filter
      if (selectedSentiment !== "all" && rec.sentiment !== selectedSentiment) {
        return false;
      }

      // 7. Controllable Scope Filter
      if (selectedControllable === "true" && !rec.consumer_growth_controllable) {
        return false;
      }
      if (selectedControllable === "false" && rec.consumer_growth_controllable) {
        return false;
      }

      return true;
    });
  }, [
    records,
    searchQuery,
    selectedQueryType,
    selectedSource,
    selectedTheme,
    selectedWorkaround,
    selectedSentiment,
    selectedControllable,
  ]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedQueryType("all");
    setSelectedSource("all");
    setSelectedTheme("all");
    setSelectedWorkaround("all");
    setSelectedSentiment("all");
    setSelectedControllable("all");
    setCurrentPage(1);
    if (onClearInitialTheme) onClearInitialTheme();
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRecords.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRecords, currentPage]);

  const hasActiveFilters =
    searchQuery ||
    selectedQueryType !== "all" ||
    selectedSource !== "all" ||
    selectedTheme !== "all" ||
    selectedWorkaround !== "all" ||
    selectedSentiment !== "all" ||
    selectedControllable !== "all";

  return (
    <div className="space-y-5">
      {/* 1. Sticky / Persistent Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 space-y-3.5">
        {/* Search Input & Reset Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search feedback by keywords (e.g. 'electrician', 'switch', 'reminder', 'AC gas', 'maid')..."
              className="w-full text-xs text-slate-900 bg-slate-50/80 pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2.5 justify-between sm:justify-end">
            <div className="text-xs text-slate-600 font-medium">
              Showing <strong className="text-slate-900 font-bold">{filteredRecords.length}</strong> of{" "}
              {records.length} reviews
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          {/* Query Type */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Query Type
            </label>
            <select
              value={selectedQueryType}
              onChange={(e) => {
                setSelectedQueryType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Query Types</option>
              <option value="branded_uc">Urban Company (Branded)</option>
              <option value="non_branded_home_service">Cross-Industry (Proxy)</option>
            </select>
          </div>

          {/* Scope Controllable */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Scope Controllability
            </label>
            <select
              value={selectedControllable}
              onChange={(e) => {
                setSelectedControllable(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
            >
              <option value="all">All Scopes</option>
              <option value="true">In Scope (Product Controllable)</option>
              <option value="false">Out of Scope (Ops / Price)</option>
            </select>
          </div>

          {/* Opportunity Theme */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Opportunity Theme
            </label>
            <select
              value={selectedTheme}
              onChange={(e) => {
                setSelectedTheme(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Opportunity Themes</option>
              {OPPORTUNITY_THEMES.map((theme) => (
                <option key={theme} value={theme}>
                  {theme}
                </option>
              ))}
            </select>
          </div>

          {/* Workaround Mentioned */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Workaround Used
            </label>
            <select
              value={selectedWorkaround}
              onChange={(e) => {
                setSelectedWorkaround(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Workarounds</option>
              {WORKAROUNDS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          {/* Sentiment */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Sentiment
            </label>
            <select
              value={selectedSentiment}
              onChange={(e) => {
                setSelectedSentiment(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Sentiments</option>
              <option value="Positive">Positive</option>
              <option value="Neutral">Neutral</option>
              <option value="Negative">Negative</option>
            </select>
          </div>

          {/* Platform Source */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Channel Source
            </label>
            <select
              value={selectedSource}
              onChange={(e) => {
                setSelectedSource(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Channels</option>
              <option value="Play Store">Google Play Store</option>
              <option value="YouTube">YouTube</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Editorial Quote Cards List */}
      <div className="space-y-4">
        {paginatedRecords.length > 0 ? (
          paginatedRecords.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-3"
            >
              {/* Top Row: Meta Badges */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Record ID & Source */}
                  <span className="font-mono text-[11px] font-semibold text-slate-400">
                    #{item.id}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    {item.source}
                  </span>

                  {/* Branded vs Cross-Industry */}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                      item.query_type === "branded_uc"
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200/80"
                        : "bg-teal-50 text-teal-700 border-teal-200/80"
                    }`}
                  >
                    {item.query_type === "branded_uc" ? "Urban Company" : "Cross-Industry"}
                  </span>

                  {/* Rating / Upvote Pill */}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200/70">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                    <span>{item.rating_or_upvotes ? `${item.rating_or_upvotes}★` : "Social"}</span>
                  </span>

                  {/* Sentiment Pill */}
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      item.sentiment === "Positive"
                        ? "bg-emerald-50 text-emerald-700"
                        : item.sentiment === "Negative"
                        ? "bg-rose-50 text-rose-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {item.sentiment}
                  </span>
                </div>

                {/* Scope Indicator Badge */}
                <div>
                  {item.consumer_growth_controllable ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200/80">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                      In Scope (Product)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                      <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
                      Out of Scope
                    </span>
                  )}
                </div>
              </div>

              {/* Middle: Customer Verbatim Quote */}
              <div className="pt-1">
                <p className="text-xs sm:text-sm text-slate-800 font-normal leading-relaxed">
                  &ldquo;{item.text}&rdquo;
                </p>
              </div>

              {/* Highlighted AI Analytical Summary Box */}
              <div className="bg-slate-50/90 rounded-xl p-3 border border-slate-200/70 flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                    AI Analytical Insight:
                  </span>
                  <p className="text-xs text-slate-700 font-medium italic leading-relaxed">
                    &ldquo;{item.summary}&rdquo;
                  </p>
                </div>
              </div>

              {/* Footer: Tag Pills */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px]">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Opportunity Theme Tag */}
                  <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50/70 text-indigo-800 font-semibold border border-indigo-100">
                    Theme: {item.opportunity_theme}
                  </span>

                  {/* Service Category */}
                  <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-medium border border-slate-200">
                    Vertical: {item.service_category}
                  </span>

                  {/* Workaround */}
                  {item.workaround_mentioned !== "None" && (
                    <span className="px-2.5 py-0.5 rounded-lg bg-rose-50 text-rose-800 font-semibold border border-rose-200/80">
                      Workaround: {item.workaround_mentioned}
                    </span>
                  )}
                </div>

                <div className="text-[10px] text-slate-400">
                  {item.date ? `Date: ${item.date}` : ""}
                  {item.city_hint ? ` • City: ${item.city_hint}` : ""}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              No customer reviews match your active filters
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search keywords, broadening the opportunity themes, or resetting all filters.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Pagination Bar */}
      {totalPages > 1 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between text-xs">
          <div className="text-slate-500">
            Page <strong className="text-slate-900 font-bold">{currentPage}</strong> of{" "}
            <strong className="text-slate-900 font-bold">{totalPages}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
