"use client";

import React, { useState } from "react";
import {
  BookOpen,
  FlaskConical,
  ShieldCheck,
  Wrench,
  Layers,
  History,
  Info,
  ExternalLink,
} from "lucide-react";
import { RelatedStandardsCategorized, StandardMetadata } from "@/types";

interface Props {
  related: RelatedStandardsCategorized;
  onSelectStandard: (std: StandardMetadata) => void;
}

export const RelatedStandardsSection: React.FC<Props> = ({ related, onSelectStandard }) => {
  const tabs = [
    {
      id: "normative",
      label: "Normative References",
      count: related.normative_references?.length || 0,
      icon: BookOpen,
      color: "text-blue-600 bg-blue-50 border-blue-200",
      items: related.normative_references || [],
      description: "Mandatory referenced standards required for product specification and compliance verification.",
    },
    {
      id: "testing",
      label: "Testing Standards",
      count: related.testing_standards?.length || 0,
      icon: FlaskConical,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
      items: related.testing_standards || [],
      description: "Accredited laboratory testing methods for loss determination, mechanical strength, and endurance.",
    },
    {
      id: "safety",
      label: "Safety Standards",
      count: related.safety_standards?.length || 0,
      icon: ShieldCheck,
      color: "text-red-600 bg-red-50 border-red-200",
      items: related.safety_standards || [],
      description: "Personnel protection, electric shock mitigation, fire containment, and ingress protection codes.",
    },
    {
      id: "installation",
      label: "Installation & Maintenance",
      count: related.installation_standards?.length || 0,
      icon: Wrench,
      color: "text-amber-600 bg-amber-50 border-amber-200",
      items: related.installation_standards || [],
      description: "Codes of practice for civil foundation, alignment, cabling, earthing, and commissioning.",
    },
    {
      id: "related",
      label: "Related Product Standards",
      count: related.related_products?.length || 0,
      icon: Layers,
      color: "text-indigo-600 bg-indigo-50 border-indigo-200",
      items: related.related_products || [],
      description: "Interfacing components, starters, cables, and complementary equipment standards.",
    },
    {
      id: "superseded",
      label: "Superseded Standards",
      count: related.superseded_standards?.length || 0,
      icon: History,
      color: "text-rose-600 bg-rose-50 border-rose-200",
      items: related.superseded_standards || [],
      description: "Preceding editions and obsolete standards replaced by modern specifications.",
    },
  ];

  // Default active tab to first non-empty tab
  const [activeTabId, setActiveTabId] = useState<string>("normative");
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 md:p-6 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-700" />
            Related-Standard Intelligence & Hierarchy
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Automated relationship graph traversal categorizing normative, testing, safety, and superseded standards.
          </p>
        </div>
      </div>

      {/* Tabs Navigation Header */}
      <div className="mt-4 flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTabId(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition whitespace-nowrap border ${
                isActive
                  ? "bg-blue-700 text-white border-blue-700 shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : ""}`} />
              <span>{tab.label}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  isActive ? "bg-blue-900/60 text-blue-100" : "bg-slate-200 text-slate-700"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Context Banner */}
      <div className="mt-3.5 p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700 flex items-center gap-2.5">
        <Info className="w-4 h-4 text-blue-600 shrink-0" />
        <span>{activeTab.description}</span>
      </div>

      {/* Standards List in Active Tab */}
      <div className="mt-4">
        {activeTab.items.length === 0 ? (
          <div className="py-8 text-center bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
            <p className="text-sm text-slate-400 font-medium">
              No standards mapped under this category for the primary specification.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {activeTab.items.map((std, idx) => (
              <div
                key={idx}
                onClick={() => onSelectStandard(std)}
                className="bg-white hover:bg-blue-50/40 p-4 rounded-xl border border-slate-200 hover:border-blue-300 shadow-2xs transition cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-base font-extrabold text-blue-900 group-hover:text-blue-700">
                      {std.is_number}
                    </span>
                    <span className="ml-2 text-sm text-slate-500 font-medium">
                      ({std.year})
                    </span>
                  </div>

                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                      std.status === "current"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-red-50 text-red-800 border-red-200"
                    }`}
                  >
                    {std.status === "current" ? "Active" : "Superseded"}
                  </span>
                </div>

                <div className="text-sm font-semibold text-slate-900 mt-1.5 line-clamp-2 leading-snug">
                  {std.title}
                </div>

                <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                  {std.scope}
                </p>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-medium text-slate-700">
                    Domain: {std.domain}
                  </span>
                  <span className="text-blue-600 group-hover:underline flex items-center gap-1 font-semibold">
                    View Metadata <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
