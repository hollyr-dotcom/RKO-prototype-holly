"use client";

import { useMemo } from "react";
import { IconChatTwo } from "@mirohq/design-system-icons";

// ~50 static sentence completions covering common canvas/design prompts
const STATIC_SUGGESTIONS = [
  // create...
  "create a sitemap",
  "create a user flow",
  "create a presentation outline",
  "create wireframes for a landing page",
  "create a product roadmap",
  "create a competitive analysis",
  "create a mood board",
  "create a feature prioritization matrix",
  // design...
  "design a landing page",
  "design a user journey",
  "design a dashboard layout",
  "design a mobile app flow",
  "design a checkout experience",
  "design an onboarding flow",
  // brainstorm...
  "brainstorm ideas for a new product",
  "brainstorm marketing strategies",
  "brainstorm feature names",
  "brainstorm solutions for this problem",
  // I need...
  "I need to plan a project",
  "I need to organize these ideas",
  "I need a wireframe for a homepage",
  "I need help with the layout",
  // I want...
  "I want to create a new section",
  "I want to redesign this flow",
  "I want to explore different options",
  "I want to map out the architecture",
  // help me...
  "help me organize this canvas",
  "help me flesh out these ideas",
  "help me find gaps in this work",
  "help me summarize what we have",
  // add...
  "add more detail to this section",
  "add a new section about competitors",
  "add user personas",
  "add a competitor comparison",
  // research...
  "research competitors for this space",
  "research best practices for onboarding",
  // map out...
  "map out a user journey",
  "map out the information architecture",
  // summarize...
  "summarize what we have so far",
  "summarize the key themes",
  // misc
  "reorganize the canvas",
  "connect these ideas together",
  "compare options for this feature",
  "explore different approaches to this",
  "outline a strategy for launch",
  "plan the next steps for this project",
  "find gaps in this work",
  "what are the key themes here",
];

interface PromptSuggestionsProps {
  canvasState: { frames: any[]; orphans: any[]; arrows: any[] };
  inputValue: string;
  isVisible: boolean;
  onSelect: (text: string) => void;
  selectedIndex: number;
}

export function PromptSuggestions({
  canvasState,
  inputValue,
  isVisible,
  onSelect,
  selectedIndex,
}: PromptSuggestionsProps) {
  // Build context-aware suggestions from frame names
  const allSuggestions = useMemo(() => {
    const dynamic: string[] = [];
    const frameNames = canvasState.frames
      .map((f: any) => f.name || "")
      .filter(Boolean);

    for (const name of frameNames) {
      dynamic.push(`flesh out the ${name} section`);
      dynamic.push(`add more detail to ${name}`);
      dynamic.push(`redesign the ${name}`);
    }

    return [...STATIC_SUGGESTIONS, ...dynamic];
  }, [canvasState]);

  // Prefix-match filtering
  const filtered = useMemo(() => {
    const query = inputValue.toLowerCase().trim();
    if (!query) return [];
    return allSuggestions
      .filter((s) => s.toLowerCase().startsWith(query))
      .slice(0, 4);
  }, [allSuggestions, inputValue]);

  if (!isVisible || filtered.length === 0) return null;

  const query = inputValue.trim();

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 animate-suggestions-in">
      <div
        className="bg-white rounded-2xl border border-gray-200 py-1.5 overflow-hidden"
        style={{
          boxShadow: "0 4px 24px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        {filtered.map((suggestion, i) => (
          <button
            key={suggestion}
            data-suggestion-index={i}
            data-suggestion-text={suggestion}
            onClick={() => onSelect(suggestion)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${
              selectedIndex === i ? "bg-gray-50" : "hover:bg-gray-50"
            }`}
          >
            <span className="text-gray-400 flex-shrink-0">
              <IconChatTwo size="small" />
            </span>
            <span className="text-sm">
              <span className="text-gray-400">
                {suggestion.slice(0, query.length)}
              </span>
              <span className="font-semibold text-gray-900">
                {suggestion.slice(query.length)}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
