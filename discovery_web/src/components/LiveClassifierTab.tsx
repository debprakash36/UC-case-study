"use client";

import React, { useState } from "react";
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Lightbulb,
} from "lucide-react";
import { Sentiment, ServiceCategory, OpportunityTheme, WorkaroundMentioned } from "@/types/feedback";

interface ClassificationResult {
  sentiment: Sentiment;
  service_category: ServiceCategory;
  pain_point: string;
  opportunity_theme: OpportunityTheme;
  workaround_mentioned: WorkaroundMentioned;
  consumer_growth_controllable: boolean;
  summary: string;
}

const SAMPLE_SCENARIOS = [
  {
    title: "1. Habit Fallback to Local Electrician",
    tag: "Offline Fallback",
    text: "Loved the UC electrical fitting last year, but yesterday when our main bedroom switch tripped I just called the local electrician bhaiya down the street because it was quicker and I didn't want to wait for an app slot.",
  },
  {
    title: "2. AC Gas-Refill High Price & Extra Inspection",
    tag: "Out of Scope (Pricing)",
    text: "AC cooling stopped completely. UC technician came on time, said gas leakage and quoted ₹3,200 for gas refill plus extra inspection charge. Extremely high pricing compared to local market! Disappointed with the rate hike.",
  },
  {
    title: "3. Forgetting Deep Clean Until Diwali",
    tag: "Maintenance Reminder Gap",
    text: "We only remember to book kitchen deep cleaning and sofa shampooing once a year right before Diwali or when relatives visit. Would be really helpful if the app automatically reminded us every 4 to 6 months with pre-saved preferences.",
  },
];

export function LiveClassifierTab() {
  const [inputText, setInputText] = useState(SAMPLE_SCENARIOS[0].text);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ClassificationResult | null>(null);

  const handleClassify = async (textToAnalyze?: string) => {
    const text = textToAnalyze || inputText;
    if (!text.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to classify text");
      }

      setResult(json.data);
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj?.message || "An unexpected error occurred during classification.");
    } finally {
      setLoading(false);
    }
  };

  const loadSample = (sample: typeof SAMPLE_SCENARIOS[0]) => {
    setInputText(sample.text);
    handleClassify(sample.text);
  };

  return (
    <div className="space-y-6">
      {/* Introduction Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 text-teal-700 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Live AI Classification & Scope Playground
              </h2>
              <p className="text-xs text-slate-500">
                Test how Gemini evaluates repeat-booking friction and isolates consumer-growth controllable levers in real time.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-medium px-3 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200 self-start sm:self-auto">
            Powered by gemini-3.1-flash-lite
          </span>
        </div>
      </div>

      {/* Split-Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Pane: Input & Scenarios (5 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
            <div>
              <label
                htmlFor="feedback-input"
                className="text-xs font-bold text-slate-900 tracking-tight block mb-1.5"
              >
                Customer Feedback / Review Text
              </label>
              <textarea
                id="feedback-input"
                rows={5}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type or paste any customer review, social post, or comment here..."
                className="w-full text-xs text-slate-800 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none leading-relaxed"
              />
            </div>

            {/* Try a Sample Pills */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Try a Guided Scenario:
              </span>
              <div className="space-y-1.5">
                {SAMPLE_SCENARIOS.map((sc, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => loadSample(sc)}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-semibold text-slate-800 group-hover:text-indigo-900 block">
                        {sc.title}
                      </span>
                      <span className="text-[10px] text-slate-500 line-clamp-1">
                        {sc.text}
                      </span>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-800 flex-shrink-0 ml-2">
                      {sc.tag}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              disabled={loading || !inputText.trim()}
              onClick={() => handleClassify()}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Classifying with Gemini AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze Customer Feedback</span>
                </>
              )}
            </button>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Diagnostic Result Card (7 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm min-h-[420px] flex flex-col justify-between">
            {result ? (
              <div className="space-y-4">
                {/* Result Header & In/Out-of-Scope Badge */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      AI Diagnostic Result
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                      Structured Classification Breakdown
                    </h3>
                  </div>

                  {result.consumer_growth_controllable && !result.opportunity_theme.includes("(Out of Scope)") ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200/80">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                      In Scope (Consumer Growth)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Out of Scope (Pricing / Ops)
                    </span>
                  )}
                </div>

                {/* Analytical Summary Box */}
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/70 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" />
                    1-Line Product Insight Summary
                  </span>
                  <p className="text-xs text-slate-800 font-medium leading-relaxed italic">
                    &ldquo;{result.summary}&rdquo;
                  </p>
                </div>

                {/* Grid of Diagnostic Pillars */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Opportunity Theme */}
                  <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-1">
                    <span className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wider">
                      Opportunity Theme
                    </span>
                    <span className="text-xs font-bold text-slate-900 block leading-tight">
                      {result.opportunity_theme}
                    </span>
                  </div>

                  {/* Workaround Detected */}
                  <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-1">
                    <span className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wider">
                      Workaround Detected
                    </span>
                    <span className="text-xs font-bold text-slate-900 block">
                      {result.workaround_mentioned === "None"
                        ? "None (Direct app interaction)"
                        : result.workaround_mentioned}
                    </span>
                  </div>

                  {/* Service Category */}
                  <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-1">
                    <span className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wider">
                      Service Category
                    </span>
                    <span className="text-xs font-bold text-slate-900 block">
                      {result.service_category}
                    </span>
                  </div>

                  {/* Sentiment & Specific Pain Point */}
                  <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-1">
                    <span className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wider">
                      Sentiment & Root Friction
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                          result.sentiment === "Positive"
                            ? "bg-emerald-50 text-emerald-700"
                            : result.sentiment === "Negative"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {result.sentiment}
                      </span>
                      <span className="text-xs text-slate-700 truncate font-medium">
                        {result.pain_point}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Scope Explanation Note */}
                <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-100 leading-relaxed">
                  {result.consumer_growth_controllable && !result.opportunity_theme.includes("(Out of Scope)") ? (
                    <span className="text-teal-800">
                      ✔ <strong>Controllable Scope Verified:</strong> This friction can be
                      addressed via customer-facing product enhancements (e.g., proactive
                      rebooking reminders, address UX, transparency check, cross-sell discovery)
                      without requiring field partner operational restructuring or discount subsidies.
                    </span>
                  ) : (
                    <span className="text-amber-800">
                      ⚠ <strong>Excluded from Consumer Growth Scope:</strong> This complaint
                      pertains to partner execution, craftsmanship, or pricing tariffs that cannot
                      be reliably solved solely through consumer UX mechanisms.
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 my-auto">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800">
                    Ready for Feedback Classification
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Select one of the 3 scenarios on the left or type your own review to see Gemini&apos;s live scope analysis and structured insights.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
