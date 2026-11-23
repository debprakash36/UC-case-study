"use client";

import React from "react";
import { Filter, Layers, RotateCcw } from "lucide-react";
import { UcVertical } from "@/utils/ucVerticals";

interface ScopeCalibrationBarProps {
  excludeBadExperiences: boolean;
  onToggleExcludeBadExperiences: (val: boolean) => void;
  consumerControllableOnly: boolean;
  onToggleConsumerControllableOnly: (val: boolean) => void;
  selectedVertical: string;
  onSelectVertical: (vertical: string) => void;
  verticalCounts: Array<{ vertical: UcVertical; count: number }>;
  totalScopedCount: number;
}

export function ScopeCalibrationBar({
  excludeBadExperiences,
  onToggleExcludeBadExperiences,
  consumerControllableOnly,
  onToggleConsumerControllableOnly,
  selectedVertical,
  onSelectVertical,
  verticalCounts,
  totalScopedCount,
}: ScopeCalibrationBarProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 transition-all mb-6">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Header & Description */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl flex-shrink-0">
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
              Isolate consumer product levers from partner operational failures, pricing complaints, and out-of-scope services.
            </p>
          </div>
        </div>

        {/* Controls: Service Vertical Dropdown + Toggles */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-medium">
          {/* 1. UC Service Vertical Dropdown */}
          <div className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100/80 px-3.5 py-2 rounded-xl border border-slate-200/80 transition-all select-none">
            <Layers className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <div className="flex flex-col">
              <div className="flex items-center justify-between gap-1.5">
                <label
                  htmlFor="uc-vertical-dropdown"
                  className="text-[10px] font-bold uppercase tracking-wider text-slate-500"
                >
                  UC Service Vertical
                </label>
                {selectedVertical !== "All Services" && (
                  <button
                    type="button"
                    onClick={() => onSelectVertical("All Services")}
                    className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                    title="Reset to All Services"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    Reset
                  </button>
                )}
              </div>
              <select
                id="uc-vertical-dropdown"
                value={selectedVertical}
                onChange={(e) => onSelectVertical(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-900 focus:outline-none cursor-pointer pr-1"
              >
                <option value="All Services">
                  All Services ({totalScopedCount})
                </option>
                {verticalCounts.map((v) => (
                  <option key={v.vertical} value={v.vertical}>
                    {v.vertical} ({v.count})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Toggle: Negativity Bias Control */}
          <label className="flex items-center gap-2.5 cursor-pointer bg-slate-50 hover:bg-slate-100/80 px-3.5 py-2 rounded-xl border border-slate-200/80 transition-all select-none">
            <input
              type="checkbox"
              checked={excludeBadExperiences}
              onChange={(e) => onToggleExcludeBadExperiences(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 relative" />
            <div>
              <span className="text-slate-900 font-semibold block leading-tight">
                Exclude Bad Experiences
              </span>
              <span className="text-[10px] text-slate-500 font-normal">
                Negativity Bias Control (3★+ or Neutral/Positive)
              </span>
            </div>
          </label>

          {/* 3. Toggle: Consumer Growth Controllable Only */}
          <label className="flex items-center gap-2.5 cursor-pointer bg-slate-50 hover:bg-slate-100/80 px-3.5 py-2 rounded-xl border border-slate-200/80 transition-all select-none">
            <input
              type="checkbox"
              checked={consumerControllableOnly}
              onChange={(e) => onToggleConsumerControllableOnly(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600 relative" />
            <div>
              <span className="text-slate-900 font-semibold block leading-tight">
                Consumer Growth Controllable Only
              </span>
              <span className="text-[10px] text-teal-700 font-normal">
                Hides Partner Ops, Price & Insta Help
              </span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
