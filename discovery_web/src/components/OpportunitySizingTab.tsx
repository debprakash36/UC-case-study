"use client";

import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Filter,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  Target,
  Wrench,
  Users,
  Compass,
} from "lucide-react";
import { FeedbackRecord, OpportunityTheme } from "@/types/feedback";

interface OpportunitySizingTabProps {
  records: FeedbackRecord[];
  onSelectThemeFilter: (theme: OpportunityTheme) => void;
}

export function OpportunitySizingTab({
  records,
  onSelectThemeFilter,
}: OpportunitySizingTabProps) {
  // Controls
  const [excludeBadExperiences, setExcludeBadExperiences] = useState(false);
  const [consumerControllableOnly, setConsumerControllableOnly] = useState(true);
  const [methodologyExpanded, setMethodologyExpanded] = useState(true);

  // Dynamic Filtering
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      // 1. Negativity Bias Control: Exclude 1-2 star / Negative sentiment / Out-of-scope service failure
      if (excludeBadExperiences) {
        if (rec.rating_or_upvotes && rec.rating_or_upvotes <= 2) return false;
        if (rec.sentiment === "Negative") return false;
        if (rec.opportunity_theme === "Service Quality / Partner Ops (Out of Scope)") return false;
      }

      // 2. Scope Filter: Consumer Growth Controllable Only
      if (consumerControllableOnly) {
        if (!rec.consumer_growth_controllable) return false;
      }

      return true;
    });
  }, [records, excludeBadExperiences, consumerControllableOnly]);

  // KPIs
  const totalCount = records.length;
  const filteredCount = filteredRecords.length;
  const filteredPct = totalCount > 0 ? ((filteredCount / totalCount) * 100).toFixed(1) : "0";

  const brandedCount = useMemo(
    () => filteredRecords.filter((r) => r.query_type === "branded_uc").length,
    [filteredRecords]
  );
  const nonBrandedCount = useMemo(
    () => filteredRecords.filter((r) => r.query_type === "non_branded_home_service").length,
    [filteredRecords]
  );

  // Top Actionable Theme
  const themeCounts = useMemo(() => {
    const map: Record<string, { branded: number; nonBranded: number; total: number }> = {};
    for (const r of filteredRecords) {
      if (!map[r.opportunity_theme]) {
        map[r.opportunity_theme] = { branded: 0, nonBranded: 0, total: 0 };
      }
      if (r.query_type === "branded_uc") {
        map[r.opportunity_theme].branded += 1;
      } else {
        map[r.opportunity_theme].nonBranded += 1;
      }
      map[r.opportunity_theme].total += 1;
    }
    return Object.entries(map)
      .map(([theme, counts]) => ({
        theme: theme as OpportunityTheme,
        branded: counts.branded,
        nonBranded: counts.nonBranded,
        total: counts.total,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredRecords]);

  const topTheme = themeCounts.length > 0 ? themeCounts[0] : null;

  // Workaround Counts
  const workaroundData = useMemo(() => {
    const map: Record<string, { branded: number; nonBranded: number; total: number }> = {};
    for (const r of filteredRecords) {
      if (r.workaround_mentioned === "None") continue; // Focus on explicit workarounds
      if (!map[r.workaround_mentioned]) {
        map[r.workaround_mentioned] = { branded: 0, nonBranded: 0, total: 0 };
      }
      if (r.query_type === "branded_uc") {
        map[r.workaround_mentioned].branded += 1;
      } else {
        map[r.workaround_mentioned].nonBranded += 1;
      }
      map[r.workaround_mentioned].total += 1;
    }
    return Object.entries(map)
      .map(([workaround, counts]) => ({
        workaround,
        branded: counts.branded,
        nonBranded: counts.nonBranded,
        total: counts.total,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredRecords]);

  const topWorkaround = workaroundData.length > 0 ? workaroundData[0] : null;

  // Service Category x Sentiment Stacked Data
  const serviceSentimentData = useMemo(() => {
    const map: Record<string, { Positive: number; Neutral: number; Negative: number }> = {};
    for (const r of filteredRecords) {
      if (!map[r.service_category]) {
        map[r.service_category] = { Positive: 0, Neutral: 0, Negative: 0 };
      }
      map[r.service_category][r.sentiment] =
        (map[r.service_category][r.sentiment] || 0) + 1;
    }
    return Object.entries(map)
      .map(([category, counts]) => ({
        category,
        Positive: counts.Positive,
        Neutral: counts.Neutral,
        Negative: counts.Negative,
        total: counts.Positive + counts.Neutral + counts.Negative,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [filteredRecords]);

  return (
    <div className="space-y-6">
      {/* 1. Interactive Bias & Scope Control Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Discovery Scope & Bias Calibration Bar
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Dynamic Recalculation
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Isolate consumer product levers from partner operational failures and price complaints.
              </p>
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
            {/* Toggle 1: Negativity Bias Control */}
            <label className="flex items-center gap-2.5 cursor-pointer bg-slate-50 hover:bg-slate-100/80 px-3.5 py-2 rounded-xl border border-slate-200/80 transition-all select-none">
              <input
                type="checkbox"
                checked={excludeBadExperiences}
                onChange={(e) => setExcludeBadExperiences(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 relative" />
              <div>
                <span className="text-slate-900 font-semibold block">
                  Exclude Bad Experiences
                </span>
                <span className="text-[10px] text-slate-500 font-normal">
                  Negativity Bias Control (3★+ or Neutral/Positive)
                </span>
              </div>
            </label>

            {/* Toggle 2: Scope Filter */}
            <label className="flex items-center gap-2.5 cursor-pointer bg-slate-50 hover:bg-slate-100/80 px-3.5 py-2 rounded-xl border border-slate-200/80 transition-all select-none">
              <input
                type="checkbox"
                checked={consumerControllableOnly}
                onChange={(e) => setConsumerControllableOnly(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600 relative" />
              <div>
                <span className="text-slate-900 font-semibold block">
                  Consumer Growth Controllable Only
                </span>
                <span className="text-[10px] text-teal-700 font-normal">
                  Hides Partner Ops & Price Complaints
                </span>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* 2. Methodology & Silent Churn Callout Banner (Collapsible) */}
      <div className="bg-gradient-to-r from-indigo-50/70 via-slate-50 to-teal-50/60 rounded-2xl border border-indigo-100/80 p-4 shadow-sm transition-all">
        <button
          type="button"
          onClick={() => setMethodologyExpanded(!methodologyExpanded)}
          className="w-full flex items-center justify-between text-left focus:outline-none"
        >
          <div className="flex items-center gap-2.5">
            <Compass className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            <div>
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                Methodology & Verification Framework
              </span>
              <span className="text-xs text-slate-600 font-medium">
                Addressing Negativity Bias & Silent Churn in Repeat-Booking Discovery
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-indigo-700 font-medium px-2.5 py-1 rounded-lg bg-white/70 border border-indigo-200/60">
            <span>{methodologyExpanded ? "Hide Details" : "Learn More"}</span>
            {methodologyExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </button>

        {methodologyExpanded && (
          <div className="mt-3.5 pt-3 border-t border-indigo-100/70 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
            <div className="space-y-1.5 bg-white/70 p-3 rounded-xl border border-indigo-100/50">
              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                1. Tackling Negativity Bias
              </span>
              <p className="leading-relaxed">
                App Store reviews skew heavily toward extreme service failures. Our toggle isolates
                users who experienced <strong>good craftsmanship</strong> yet still churned due to
                in-app friction, missing reminder cadences, or habit fallback to local offline workers.
              </p>
            </div>
            <div className="space-y-1.5 bg-white/70 p-3 rounded-xl border border-teal-100/50">
              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-teal-600" />
                2. Silent Churn Proxy (Cross-Industry Baseline)
              </span>
              <p className="leading-relaxed">
                Silent churners rarely leave reviews on UC when they switch. We ingested 246 cross-industry
                home service discussions to capture real customer behavior when they rely on
                <strong> local technicians, society WhatsApp groups, or DIY</strong> outside Urban Company.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Active Cohort Records</span>
            <Target className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {filteredCount}
              <span className="text-xs font-medium text-slate-500 ml-1.5">
                / {totalCount} ({filteredPct}%)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {consumerControllableOnly
                ? "Controllable by product features"
                : "All records under current bias setting"}
            </p>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Dataset Split</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {brandedCount} <span className="text-xs font-normal text-slate-400">vs</span>{" "}
              {nonBrandedCount}
            </div>
            <div className="flex items-center gap-2 mt-1 text-[11px]">
              <span className="text-indigo-600 font-medium">UC Branded</span>
              <span className="text-slate-300">•</span>
              <span className="text-teal-600 font-medium">Cross-Industry</span>
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Top Actionable Theme</span>
            <Sparkles className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2.5">
            <div className="text-base font-bold text-slate-900 leading-snug line-clamp-1">
              {topTheme ? topTheme.theme : "N/A"}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {topTheme
                ? `${topTheme.total} citations (${((topTheme.total / (filteredCount || 1)) * 100).toFixed(0)}% of cohort)`
                : "No matching theme"}
            </p>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Primary Churn Workaround</span>
            <Wrench className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2.5">
            <div className="text-base font-bold text-slate-900 leading-snug">
              {topWorkaround ? topWorkaround.workaround : "Direct Platform Friction"}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {topWorkaround
                ? `${topWorkaround.total} direct customer mentions`
                : "No substitute mentioned"}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Chart Section 1: Horizontal Bar Chart - Opportunity Themes */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Opportunity Themes & Repeat Churn Triggers
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                Click any bar to explore quotes
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Rank-ordered friction themes preventing users from rebooking within 90 days.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 text-slate-600">
              <span className="w-3 h-3 rounded bg-indigo-600 inline-block" />
              Urban Company
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-600">
              <span className="w-3 h-3 rounded bg-teal-500 inline-block" />
              Cross-Industry Benchmark
            </span>
          </div>
        </div>

        <div className="h-80 sm:h-96 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={themeCounts}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 160, bottom: 10 }}
              onClick={(state) => {
                const s = state as { activePayload?: Array<{ payload: { theme: OpportunityTheme } }> };
                if (s && s.activePayload && s.activePayload.length > 0) {
                  const clickedTheme = s.activePayload[0].payload.theme;
                  onSelectThemeFilter(clickedTheme);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
              <XAxis type="number" stroke="#64748B" fontSize={11} />
              <YAxis
                type="category"
                dataKey="theme"
                stroke="#334155"
                fontSize={11}
                tickLine={false}
                width={150}
              />
              <Tooltip content={<CustomOpportunityTooltip />} />
              <Bar
                dataKey="branded"
                name="Urban Company"
                fill="#4F46E5"
                stackId="theme"
                radius={[0, 0, 0, 0]}
                cursor="pointer"
              />
              <Bar
                dataKey="nonBranded"
                name="Cross-Industry"
                fill="#14B8A6"
                stackId="theme"
                radius={[0, 4, 4, 0]}
                cursor="pointer"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 text-right">
          <span className="text-[11px] text-indigo-600 font-medium inline-flex items-center gap-1 cursor-pointer hover:underline">
            Tip: Click any bar to jump to the Verbatim Explorer pre-filtered to that friction theme
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* 5. Chart Section 2: Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Offline Workarounds */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Offline & Substitute Workarounds Mentioned
            </h3>
            <p className="text-xs text-slate-500">
              Where customers divert their spend when they don&apos;t rebook on Urban Company.
            </p>
          </div>

          <div className="h-64 mt-4">
            {workaroundData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={workaroundData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="workaround"
                    stroke="#64748B"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip content={<CustomWorkaroundTooltip />} />
                  <Bar
                    dataKey="branded"
                    name="Urban Company"
                    fill="#4F46E5"
                    stackId="workaround"
                  />
                  <Bar
                    dataKey="nonBranded"
                    name="Cross-Industry"
                    fill="#0D9488"
                    stackId="workaround"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No specific offline workarounds mentioned in the active filtered cohort.
              </div>
            )}
          </div>
        </div>

        {/* Service Category Breakdown by Sentiment */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Service Verticals × Customer Sentiment
            </h3>
            <p className="text-xs text-slate-500">
              Repeat friction distribution across high-frequency home service categories.
            </p>
          </div>

          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={serviceSentimentData}
                margin={{ top: 10, right: 20, left: 0, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="category"
                  stroke="#64748B"
                  fontSize={10}
                  tickLine={false}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip content={<CustomSentimentTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 11, paddingBottom: 8 }}
                />
                <Bar
                  dataKey="Positive"
                  name="Positive"
                  fill="#10B981"
                  stackId="sentiment"
                />
                <Bar
                  dataKey="Neutral"
                  name="Neutral"
                  fill="#94A3B8"
                  stackId="sentiment"
                />
                <Bar
                  dataKey="Negative"
                  name="Negative"
                  fill="#F43F5E"
                  stackId="sentiment"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TooltipEntry {
  dataKey?: string | number;
  value?: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}

// Custom Tooltips for Crisp Aesthetics
function CustomOpportunityTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const branded = Number(payload.find((p) => p.dataKey === "branded")?.value || 0);
    const nonBranded = Number(payload.find((p) => p.dataKey === "nonBranded")?.value || 0);
    const total = branded + nonBranded;

    return (
      <div className="bg-slate-900 text-white text-xs rounded-xl p-3 shadow-xl border border-slate-800 space-y-1.5 min-w-[200px]">
        <div className="font-semibold text-slate-100 border-b border-slate-800 pb-1">
          {label}
        </div>
        <div className="flex justify-between items-center text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            Urban Company:
          </span>
          <span className="font-bold text-white">{branded}</span>
        </div>
        <div className="flex justify-between items-center text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-400" />
            Cross-Industry:
          </span>
          <span className="font-bold text-white">{nonBranded}</span>
        </div>
        <div className="pt-1 border-t border-slate-800 flex justify-between items-center font-bold text-slate-200">
          <span>Total Records:</span>
          <span className="text-indigo-300">{total}</span>
        </div>
        <div className="text-[10px] text-slate-400 pt-0.5">Click to view all {total} verbatim quotes →</div>
      </div>
    );
  }
  return null;
}

function CustomWorkaroundTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const branded = Number(payload.find((p) => p.dataKey === "branded")?.value || 0);
    const nonBranded = Number(payload.find((p) => p.dataKey === "nonBranded")?.value || 0);
    const total = branded + nonBranded;

    return (
      <div className="bg-slate-900 text-white text-xs rounded-xl p-3 shadow-xl border border-slate-800 space-y-1 min-w-[180px]">
        <div className="font-semibold text-slate-100 border-b border-slate-800 pb-1">
          Workaround: {label}
        </div>
        <div className="flex justify-between text-slate-300">
          <span>Urban Company:</span>
          <span className="font-bold text-white">{branded}</span>
        </div>
        <div className="flex justify-between text-slate-300">
          <span>Cross-Industry:</span>
          <span className="font-bold text-white">{nonBranded}</span>
        </div>
        <div className="pt-1 border-t border-slate-800 flex justify-between font-bold text-teal-300">
          <span>Total Mentions:</span>
          <span>{total}</span>
        </div>
      </div>
    );
  }
  return null;
}

function CustomSentimentTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const pos = Number(payload.find((p) => p.dataKey === "Positive")?.value || 0);
    const neu = Number(payload.find((p) => p.dataKey === "Neutral")?.value || 0);
    const neg = Number(payload.find((p) => p.dataKey === "Negative")?.value || 0);
    const total = pos + neu + neg;

    return (
      <div className="bg-slate-900 text-white text-xs rounded-xl p-3 shadow-xl border border-slate-800 space-y-1 min-w-[180px]">
        <div className="font-semibold text-slate-100 border-b border-slate-800 pb-1">
          {label}
        </div>
        <div className="flex justify-between text-emerald-400">
          <span>Positive:</span>
          <span className="font-bold">{pos}</span>
        </div>
        <div className="flex justify-between text-slate-300">
          <span>Neutral:</span>
          <span className="font-bold">{neu}</span>
        </div>
        <div className="flex justify-between text-rose-400">
          <span>Negative:</span>
          <span className="font-bold">{neg}</span>
        </div>
        <div className="pt-1 border-t border-slate-800 flex justify-between font-bold text-slate-200">
          <span>Total:</span>
          <span>{total}</span>
        </div>
      </div>
    );
  }
  return null;
}
