"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, 
  CheckCircle2, 
  Wrench, 
  Smartphone, 
  Headphones, 
  ArrowRight, 
  RotateCcw,
  Sparkles,
  AlertCircle,
  FileCheck,
  ChevronRight
} from "lucide-react";

export default function MVPPage() {
  const [role, setRole] = useState<"customer" | "partner" | "ops">("customer");
  
  // Interactive Customer Flow State
  const [selectedService, setSelectedService] = useState("AC Deep Clean & Power Saver Service");
  const [selectedParts, setSelectedParts] = useState<string[]>(["run_cap"]);
  const [estimateApproved, setEstimateApproved] = useState(false);
  const [otpEntered, setOtpEntered] = useState(false);
  
  // Post-Service Review & AI Triage State
  const [reviewInput, setReviewInput] = useState("Technician fixed the capacitor quickly and explained the charges beforehand!");
  const [triageOutput, setTriageOutput] = useState<{ category: string; sentiment: string; urgency: string } | null>(null);

  const partPrices: Record<string, { name: string; price: number; warranty: string }> = {
    run_cap: { name: "Heavy Duty Run Capacitor (45µF)", price: 450, warranty: "60-Day UC Warranty" },
    filter: { name: "High-Density Antibacterial Air Filter", price: 350, warranty: "90-Day UC Warranty" },
    valve: { name: "Brass Service Flare Valve & Nut", price: 280, warranty: "180-Day UC Warranty" },
  };

  const basePrice = 599;
  const partsTotal = selectedParts.reduce((acc, p) => acc + (partPrices[p]?.price || 0), 0);
  const grandTotal = basePrice + (estimateApproved ? partsTotal : 0);

  const togglePart = (partKey: string) => {
    setSelectedParts(prev => 
      prev.includes(partKey) ? prev.filter(k => k !== partKey) : [...prev, partKey]
    );
  };

  const simulateAITriage = () => {
    const text = reviewInput.toLowerCase();
    let category = "Service Quality";
    let sentiment = "Positive";
    let urgency = "Low";

    if (text.includes("price") || text.includes("charge") || text.includes("cost") || text.includes("bill")) {
      category = "Pricing & Transparency";
    } else if (text.includes("late") || text.includes("time") || text.includes("delay")) {
      category = "Punctuality & Equipment";
    } else if (text.includes("support") || text.includes("refund")) {
      category = "Customer Support";
    }

    if (text.includes("terrible") || text.includes("bad") || text.includes("hidden") || text.includes("late") || text.includes("overcharged")) {
      sentiment = "Negative";
      urgency = "High";
    } else if (text.includes("okay") || text.includes("average")) {
      sentiment = "Neutral";
      urgency = "Medium";
    }

    setTriageOutput({ category, sentiment, urgency });
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 space-y-10">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-md bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 border border-indigo-200">
            Deliverable 3 MVP Prototype
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            UC TrustShield: Pre-Authorized Rate Lock & AI Triage
          </h1>
          <p className="text-sm text-slate-600">
            Eliminating on-site price surprises through guaranteed digital part estimates, companion technician barcode verification, and instant NLP dispute triage.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-start md:self-center">
          <button
            onClick={() => setRole("customer")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              role === "customer" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Smartphone className="h-4 w-4" />
            Customer App
          </button>
          <button
            onClick={() => setRole("partner")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              role === "partner" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Wrench className="h-4 w-4" />
            Partner Companion
          </button>
          <button
            onClick={() => setRole("ops")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              role === "ops" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Headphones className="h-4 w-4" />
            Ops & AI Triage
          </button>
        </div>
      </div>

      {/* Role 1: Customer View */}
      {role === "customer" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Booking & Estimate Panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Step 1 of 3</span>
                  <h3 className="text-lg font-bold text-slate-900">{selectedService}</h3>
                </div>
                <span className="text-sm font-bold text-slate-900">Base Fee: ₹{basePrice}</span>
              </div>

              {/* Digital Rate Card Lock */}
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      Standardized Rate Card: Required Replacement Parts
                    </h4>
                    <p className="text-xs text-slate-500">Only authorized OEM-certified parts at locked pre-negotiated rates.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {Object.entries(partPrices).map(([key, item]) => {
                    const isChecked = selectedParts.includes(key);
                    return (
                      <div
                        key={key}
                        onClick={() => togglePart(key)}
                        className={`flex items-center justify-between p-3.5 rounded-lg border cursor-pointer transition-all ${
                          isChecked 
                            ? "border-indigo-600 bg-indigo-50/40" 
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="h-4 w-4 text-indigo-600 rounded border-slate-300"
                          />
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                            <span className="text-xs font-medium text-emerald-600">{item.warranty}</span>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-slate-900">+₹{item.price}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Estimate Confirmation Action */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
                  <div className="text-xs text-slate-500">
                    {estimateApproved 
                      ? "✔ Rate lock confirmed. Technician cannot charge beyond this."
                      : "Please review and lock estimate to prevent on-site discrepancies."}
                  </div>
                  <button
                    onClick={() => setEstimateApproved(!estimateApproved)}
                    className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm ${
                      estimateApproved
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                    }`}
                  >
                    {estimateApproved ? "Estimate Locked (Click to Edit)" : "Authorize & Lock Estimate"}
                  </button>
                </div>
              </div>
            </div>

            {/* OTP Verification & Handshake */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-indigo-600" />
                    Digital Handshake & Post-Service Sign-Off
                  </h4>
                  <p className="text-xs text-slate-500">Share completion OTP only after the technician shows genuine part packaging.</p>
                </div>
                <div className="bg-slate-100 px-3 py-1.5 rounded-lg font-mono font-bold text-indigo-600 text-sm tracking-widest border border-slate-200">
                  4829
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Order Summary Sidebar */}
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
                Guaranteed Bill Summary
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Base Visit & Inspection</span>
                  <span>₹{basePrice}</span>
                </div>

                {estimateApproved && selectedParts.length > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Authorized Spare Parts ({selectedParts.length})</span>
                    <span>₹{partsTotal}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Taxes & GST (18%)</span>
                  <span>₹{Math.round(grandTotal * 0.18)}</span>
                </div>

                <div className="border-t border-slate-200 pt-3 flex justify-between font-bold text-base text-slate-900">
                  <span>Total Payable</span>
                  <span className="text-indigo-600">₹{grandTotal + Math.round(grandTotal * 0.18)}</span>
                </div>
              </div>

              <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 space-y-1 border border-emerald-100">
                <p className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  UC TrustShield Guarantee Active
                </p>
                <p>If any part fails within 60 days, free replacement and re-visit are 100% covered.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role 2: Partner Companion */}
      {role === "partner" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Partner Companion: Ramesh Kumar</h3>
              <p className="text-xs text-slate-500">Assigned Order: #UC-88421 • Customer: Priyal Kapoor</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-900">Equipment & Spare Part Checklist</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm">
                <span>Heavy Duty Capacitor (Barcode: UC-CAP-45UF)</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">Verified OEM</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm">
                <span>Digital Manifold Gauge & Vacuum Pump</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-700">Kit Inspected</span>
              </div>
            </div>

            <div className="rounded-lg bg-blue-50 p-4 border border-blue-200 text-xs text-blue-900 space-y-2">
              <p className="font-semibold">Pre-Authorized Pricing Protection</p>
              <p>The customer has approved ₹{partsTotal} in parts. You are guaranteed automatic commission credit upon customer OTP verification.</p>
            </div>
          </div>
        </div>
      )}

      {/* Role 3: Ops & AI Triage */}
      {role === "ops" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600" />
                Real-Time Feedback & Escalation NLP Triage
              </h3>
              <p className="text-xs text-slate-500">Powered by the classification pipeline developed in python_pipeline/tagger.py</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Simulate Customer Review / Complaint</label>
              <textarea
                value={reviewInput}
                onChange={(e) => setReviewInput(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-indigo-600 focus:outline-none"
                placeholder="Enter feedback or complaint text..."
              />
            </div>

            <button
              onClick={simulateAITriage}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Sparkles className="h-4 w-4" />
              Run NLP Triage Analysis
            </button>

            {triageOutput && (
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-5 space-y-4">
                <h4 className="text-sm font-bold text-slate-900">Automated Pipeline Classification Output</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-lg bg-white p-3 border border-slate-200">
                    <span className="text-xs text-slate-400 font-semibold uppercase">Predicted Category</span>
                    <p className="text-sm font-bold text-slate-900 mt-1">{triageOutput.category}</p>
                  </div>
                  <div className="rounded-lg bg-white p-3 border border-slate-200">
                    <span className="text-xs text-slate-400 font-semibold uppercase">Predicted Sentiment</span>
                    <p className={`text-sm font-bold mt-1 ${
                      triageOutput.sentiment === "Positive" ? "text-emerald-600" :
                      triageOutput.sentiment === "Negative" ? "text-rose-600" : "text-amber-600"
                    }`}>
                      {triageOutput.sentiment}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white p-3 border border-slate-200">
                    <span className="text-xs text-slate-400 font-semibold uppercase">Routing Urgency</span>
                    <p className={`text-sm font-bold mt-1 ${
                      triageOutput.urgency === "High" ? "text-rose-600" :
                      triageOutput.urgency === "Medium" ? "text-amber-600" : "text-slate-700"
                    }`}>
                      {triageOutput.urgency}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-slate-600">
                  {triageOutput.urgency === "High" ? (
                    <span className="text-rose-600 font-semibold">⚠ Priority Escalation: Automatically routed to Tier-2 Service Supervisor queue with 15-min SLA.</span>
                  ) : (
                    <span className="text-emerald-600 font-semibold">✔ Standard Feedback: Logged in quality registry with no emergency routing required.</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
