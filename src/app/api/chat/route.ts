import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/serverAuth";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { supabase } from "@/lib/supabase";
import { IncrementalItemExtractor, STREAMING_TOOLS } from "@/lib/streamingParser";

export const maxDuration = 120;

// Track tool calls to send back to client
type ToolCall = {
  toolName: string;
  args: Record<string, unknown>;
};

// ============================================
// TOOLS - Organized by purpose
// ============================================

// --- Conversation Tools ---
const askUserTool = tool({
  name: "askUser",
  description: "Ask the user 1-3 questions at once. Shows clickable button pills. NEVER write questions as plain text. Call this ONCE with ALL your questions — don't call it multiple times.",
  parameters: z.object({
    questions: z.array(z.object({
      question: z.string().describe("The question to ask"),
      suggestions: z.array(z.string()).min(2).max(4).describe("2-4 clickable answer options"),
    })).min(1).max(3).describe("Array of questions to ask (1-3). All shown sequentially without waiting."),
  }),
  execute: async ({ questions }) => {
    return JSON.stringify({ questions });
  },
});

const confirmPlanTool = tool({
  name: "confirmPlan",
  description: "Propose a plan for substantial work. After calling this, STOP and wait. When user approves, EXECUTE this plan - don't make a new one.",
  parameters: z.object({
    title: z.string().describe("What you're planning to create"),
    steps: z.array(z.string()).min(3).max(5).describe("The steps you'll take (3-5 high-level steps only)"),
    summary: z.string().describe("What the end result will look like"),
  }),
  execute: async ({ title, steps, summary }) => {
    return JSON.stringify({
      title,
      steps,
      summary,
      instruction: "STOP. When user approves, execute THIS plan with showProgress() - do not create another plan."
    });
  },
});

const requestFeedbackTool = tool({
  name: "requestFeedback",
  description: "Pause for user feedback during execution. ALWAYS include 'Continue' as the first option.",
  parameters: z.object({
    message: z.string().describe("What you've done and asking what's next"),
    suggestions: z.array(z.string()).min(2).max(4).describe("First option MUST be 'Continue'. Then alternatives like 'Add more detail', 'Adjust layout'"),
  }),
  execute: async ({ message, suggestions }) => {
    return JSON.stringify({ type: "feedback", message, suggestions });
  },
});

const showProgressTool = tool({
  name: "showProgress",
  description: "REQUIRED: Call this BEFORE starting each plan step. Shows which step you're working on.",
  parameters: z.object({
    stepNumber: z.number().describe("Which step number (1, 2, 3, etc)"),
    stepTitle: z.string().describe("The step title from the plan"),
    status: z.string().describe("What you're doing: 'starting' or 'completed'"),
  }),
  execute: async (args) => JSON.stringify(args),
});

const reviewCanvasTool = tool({
  name: "reviewCanvas",
  description: "Review your work after completing a section. Assess layout, completeness, and connections. The canvas state will be in the context - use this to decide if you need to adjust, add arrows, or reorganize before moving on.",
  parameters: z.object({
    section: z.string().describe("What section you're reviewing"),
    assessment: z.enum(["good", "needs-work", "incomplete"]).describe("Your assessment of the section"),
  }),
  execute: async ({ section, assessment }) => {
    return JSON.stringify({
      reviewed: section,
      assessment,
      instruction: "Check CANVAS STATE above. If needs-work or incomplete, use updateSticky/moveItem/createArrow to improve."
    });
  },
});

const checkpointTool = tool({
  name: "checkpoint",
  description: "Pause for user review. Your message explains the work - this is just a short CTA.",
  parameters: z.object({
    completed: z.string().describe("Short CTA starting with 'Review'. Examples: 'Review the sitemap', 'Review homepage layout', 'Review product pages'. Keep it natural."),
  }),
  execute: async (args) => JSON.stringify({ type: "checkpoint", ...args }),
});

const webSearchTool = tool({
  name: "webSearch",
  description: "Search the web for real-world information - current trends, statistics, examples, best practices, market data. Returns a summary and key findings you can use in your work.",
  parameters: z.object({
    query: z.string().describe("What to search for"),
    purpose: z.string().describe("What you're trying to learn"),
    maxResults: z.number().min(1).max(20).describe("How many results to fetch — use your judgment: 3-5 for quick lookups, 8-12 for broad research, up to 20 for comprehensive surveys"),
  }),
  execute: async ({ query, purpose, maxResults }) => {
    try {
      // Check for pre-canned results first (demo scenario data)
      try {
        const cannedPath = path.join(process.cwd(), "src/data/webSearchResults.json");
        const cannedData = JSON.parse(fs.readFileSync(cannedPath, "utf-8"));
        const queryLower = query.toLowerCase();
        const match = cannedData.resultSets?.find((set: { matchPatterns: string[] }) =>
          set.matchPatterns.some((p: string) => queryLower.includes(p.toLowerCase()))
        );
        if (match) {
          const sources = match.results.map((r: { title: string; url: string; content: string; image?: string }) => ({
            title: r.title,
            url: r.url,
            description: r.content?.slice(0, 200),
            image: r.image || "",
          }));
          return JSON.stringify({
            query,
            purpose,
            summary: match.answer || "No summary available",
            keyFindings: match.results.map((r: { title: string; content: string }) => `- ${r.title}: ${r.content?.slice(0, 300)}`).join("\n"),
            sources,
            instruction: `YOU MUST DO BOTH — NOT JUST SOURCES:
1) createSources() — show the source cards on canvas
2) IMMEDIATELY AFTER: createLayout(type:"sticky") — create 3-4 synthesis stickies. Each sticky must be a COMPLETE THOUGHT an exec can understand without extra context. No jargon, no acronyms. Answer "so what does this mean for US?" Good: "The real question: which delay is harder to recover from?" or "Delay cost isn't flat — some projects get exponentially more expensive to postpone". Bad: "Use Cost-of-Delay, not static scoring" or "WSJF: prioritize CoD per dev-week". NEVER skip step 2. Sources without synthesis are useless.`
          });
        }
      } catch { /* No canned results file or parse error — fall through to Tavily */ }

      const apiKey = process.env.TAVILY_API_KEY;

      if (!apiKey) {
        return JSON.stringify({
          error: "No TAVILY_API_KEY configured",
          query,
          purpose,
          results: []
        });
      }

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          search_depth: "basic",
          include_answer: true,
          include_raw_content: false,
          include_images: true,
          max_results: maxResults,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Tavily API error: ${response.status}`);
      }

      const data = await response.json();

      // Format results for easy extraction
      const formattedResults = data.results?.map((r: { title: string; url: string; content: string }) =>
        `- ${r.title}: ${r.content?.slice(0, 300)}`
      ).join("\n") || "No results found";

      // Top-level images from Tavily (when include_images is true)
      const topImages: string[] = data.images || [];

      // Structured sources for createSources tool
      const sources = data.results?.map((r: { title: string; url: string; content: string; image?: string }, idx: number) => {
        // Prefer per-result image, fall back to top-level images array
        const image = r.image || topImages[idx] || "";
        return {
          title: r.title,
          url: r.url,
          description: r.content?.slice(0, 200),
          image,
        };
      }) || [];

      return JSON.stringify({
        query,
        purpose,
        summary: data.answer || "No summary available",
        keyFindings: formattedResults,
        sources,
        instruction: `YOU MUST DO BOTH — NOT JUST SOURCES:
1) createSources() — show the source cards on canvas
2) IMMEDIATELY AFTER: createLayout(type:"sticky") — create 3-4 synthesis stickies. Each sticky must be a COMPLETE THOUGHT an exec can understand without extra context. No jargon, no acronyms. Answer "so what does this mean for US?" Good: "The real question: which delay is harder to recover from?" or "Delay cost isn't flat — some projects get exponentially more expensive to postpone". Bad: "Use Cost-of-Delay, not static scoring" or "WSJF: prioritize CoD per dev-week". NEVER skip step 2. Sources without synthesis are useless.`
      });
    } catch (error) {
      return JSON.stringify({
        error: String(error),
        query,
        purpose,
        results: []
      });
    }
  },
});

const queryConnectorsTool = tool({
  name: "queryConnectors",
  description: `Query internal workplace tool connectors for real company data. Returns data from the requested services.

BE SELECTIVE — only query services relevant to the user's question. Don't query everything.

Available services by category:

PROJECT EXECUTION: jira (sprints, tickets, assignments)
ENGINEERING: github (PRs, commits, reviews), linear (issues, cycles)
BUSINESS INTELLIGENCE: looker (dashboards, metrics, KPIs)
PRODUCT ANALYTICS: amplitude (funnels, retention, engagement)
PRODUCT MANAGEMENT: productboard (features, roadmap, requests)
CUSTOMER RELATIONSHIP: salesforce (accounts, pipeline, deals)
CUSTOMER SUCCESS: gainsight (health scores, churn risk, NPS)
CUSTOMER EVIDENCE: gong (call recordings, themes), miro-insights (research boards)
COMPETITIVE INTELLIGENCE: stripe-benchmarks (market data, benchmarks)
DOCUMENTATION: google-docs (specs, PRDs), confluence (wiki, runbooks)
STRATEGY: notion (strategy docs, OKRs)
COMMUNICATION: slack (channels, threads, decisions)
DESIGN: figma (designs, prototypes, components)
DESIGN TRACKING: linear (design tasks, sprints)
SCHEDULING: google-calendar (meetings, availability)
INFRASTRUCTURE: datadog (monitors, incidents, uptime)
ANALYSIS: google-sheets (spreadsheets, models)
RESOURCE MANAGEMENT: workday (headcount, allocations, org)`,
  parameters: z.object({
    services: z.array(z.string()).min(1).max(20).describe("Which services to query, e.g. ['jira', 'looker', 'salesforce']. Use short names from the list above."),
    purpose: z.string().describe("What you're trying to find out — helps filter results"),
  }),
  execute: async ({ services, purpose }) => {
    try {
      const connectorsPath = path.join(process.cwd(), "src/data/connectors.json");
      const raw = JSON.parse(fs.readFileSync(connectorsPath, "utf-8"));
      const allSources = raw.integrationSources?.sources || [];

      // Map short names to source IDs
      const results: Array<{ service: string; items: unknown[] }> = [];
      for (const svc of services) {
        const sourceId = `source-${svc}`;
        const source = allSources.find((s: { id: string }) => s.id === sourceId);
        if (source) {
          results.push({
            service: source.service,
            items: source.fetchedItems || [],
          });
        }
      }

      return JSON.stringify({
        purpose,
        queriedServices: results.map(r => r.service),
        serviceCount: results.length,
        data: results,
        instruction: "Synthesize these findings into canvas content. Reference real numbers, names, and data points from the results.",
      });
    } catch (error) {
      return JSON.stringify({
        error: String(error),
        services,
        purpose,
        data: [],
      });
    }
  },
});

const createSourcesTool = tool({
  name: "createSources",
  description: "Display web search results as visual bookmark cards in a frame on the canvas. Call this after webSearch() to show sources visually. Pass the sources array from webSearch results directly.",
  parameters: z.object({
    title: z.string().describe("Frame title, e.g. 'Research: competitor landscape'"),
    sources: z.array(z.object({
      title: z.string().describe("Page title from search results"),
      url: z.string().describe("URL of the source"),
      description: z.string().default("").describe("Snippet/description"),
      image: z.string().default("").describe("Image URL for thumbnail"),
    })).min(1).max(20).describe("Sources from webSearch results"),
  }),
  execute: async (args) => {
    return JSON.stringify({ created: "sources", ...args });
  },
});

// Helper to generate unique IDs for created items
const generateItemId = () => `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// --- Canvas Creation Tools ---
const createStickyTool = tool({
  name: "createSticky",
  description: "Create a single post-it note (tldraw sticky note shape). ⚠️ ONLY for adding ONE sticky to existing content. For 2+ stickies, you MUST use createLayout(type:'sticky') instead - it handles positioning automatically. Never call this multiple times in sequence.",
  parameters: z.object({
    text: z.string().describe("Sticky note text. 1-2 punchy sentences for insights, or short labels for brainstorms."),
    color: z.enum(["yellow", "blue", "green", "pink", "orange", "violet"]),
    parentFrameId: z.string().optional().describe("If provided, place this item inside the specified frame"),
  }),
  execute: async (args) => {
    const id = generateItemId();
    return JSON.stringify({ created: "sticky", id, ...args });
  },
});

const createTextTool = tool({
  name: "createText",
  description: "Create a text label for headers or annotations. Returns an ID you can reference.",
  parameters: z.object({
    text: z.string().describe("The text content"),
    parentFrameId: z.string().optional().describe("If provided, place this item inside the specified frame"),
  }),
  execute: async (args) => {
    const id = generateItemId();
    return JSON.stringify({ created: "text", id, ...args });
  },
});

const createShapeTool = tool({
  name: "createShape",
  description: "⚠️ ONLY for adding a SINGLE shape. For 2+ shapes (diagrams, org charts, flows), you MUST use createLayout() with type:'hierarchy' or type:'flow' - it creates shapes with automatic arrows!",
  parameters: z.object({
    type: z.enum(["rectangle", "ellipse", "triangle", "diamond"]),
    text: z.string().default("").describe("Label text inside the shape"),
    width: z.number().describe("Width (typically 150-200 for diagram nodes)"),
    height: z.number().describe("Height (typically 80-100 for diagram nodes)"),
    color: z.enum(["black", "blue", "green", "red", "orange", "yellow", "violet"]),
    parentFrameId: z.string().optional().describe("If provided, place this item inside the specified frame"),
  }),
  execute: async (args) => {
    const id = generateItemId();
    return JSON.stringify({ created: "shape", id, ...args });
  },
});

const createFrameTool = tool({
  name: "createFrame",
  description: "Create a frame to group related content. Use frames to create sections for each plan step. Place content INSIDE the frame bounds. Returns an ID.",
  parameters: z.object({
    name: z.string().describe("Frame label (shown above frame)"),
    width: z.number().describe("Frame width (typically 400-600)"),
    height: z.number().describe("Frame height (typically 500-800)"),
  }),
  execute: async (args) => {
    const id = generateItemId();
    return JSON.stringify({ created: "frame", id, ...args });
  },
});

const createArrowTool = tool({
  name: "createArrow",
  description: "Create an arrow to CONNECT shapes! Essential for flowcharts, org charts, sitemaps, process diagrams. Shows hierarchy, flow, relationships. Use liberally to make diagrams meaningful! Returns an ID.",
  parameters: z.object({
    startX: z.number().describe("Start X (typically center-bottom of source shape)"),
    startY: z.number().describe("Start Y"),
    endX: z.number().describe("End X (typically center-top of target shape)"),
    endY: z.number().describe("End Y"),
  }),
  execute: async (args) => {
    const id = generateItemId();
    return JSON.stringify({ created: "arrow", id, ...args });
  },
});

const createWorkingNoteTool = tool({
  name: "createWorkingNote",
  description: "Create a visible 'working note' on the canvas to show your current thinking or focus. Use this to make your process visible to the user. Returns an ID.",
  parameters: z.object({
    title: z.string().describe("What you're working on"),
    content: z.string().describe("Your current thinking or notes"),
  }),
  execute: async (args) => {
    const id = generateItemId();
    return JSON.stringify({ created: "workingNote", id, ...args });
  },
});

const createDocumentTool = tool({
  name: "createDocument",
  description: "Create a rich text document on the canvas. Use for written content: briefs, specs, guidelines, summaries. NOT for quick notes (use stickies) or tabular data (use createDataTable). ALWAYS provide meaningful content — never create empty documents. Default size: 780×660. Space items left-to-right with 50px gaps.",
  parameters: z.object({
    title: z.string().describe("Document title"),
    content: z.string().describe("Document body as HTML. Use <h2>, <p>, <ul>/<li>, <strong>, <em>. Example: '<h2>Overview</h2><p>This project...</p>'"),
    parentFrameId: z.string().optional().describe("If provided, place this item inside the specified frame"),
  }),
  execute: async (args) => {
    const id = generateItemId();
    return JSON.stringify({ created: "document", id, ...args });
  },
});

const updateDocumentTool = tool({
  name: "updateDocument",
  description: "Replace the content of an existing document on the canvas. Get the document's ID from [CANVAS STATE]. Use HTML formatting.",
  parameters: z.object({
    itemId: z.string().describe("The shape ID of the document to update (from canvas state)"),
    content: z.string().describe("New document body as HTML"),
  }),
  execute: async (args) => JSON.stringify({ updated: "document", ...args }),
});

const createDataTableTool = tool({
  name: "createDataTable",
  description: "Create an interactive data table on the canvas. Use for structured data: comparisons, feature matrices, RACI tables, timelines. NOT for simple lists (use stickies) or prose (use createDocument). ALWAYS fill ALL cells with meaningful data — never leave cells empty. Default size: 700×460. Space items left-to-right with 50px gaps.",
  parameters: z.object({
    title: z.string().describe("Table title"),
    columns: z.array(z.string()).min(1).max(8).describe("Column header names"),
    rows: z.array(z.array(z.string())).describe("Row data — each inner array must match the number of columns"),
    parentFrameId: z.string().optional().describe("If provided, place this item inside the specified frame"),
  }),
  execute: async (args) => {
    const id = generateItemId();
    return JSON.stringify({ created: "datatable", id, ...args });
  },
});

// --- Sticker Tool ---
// Load sticker packs for keyword matching
const miroPacks: {
  id: string;
  name: string;
  stickers: {
    id: string;
    image: { url: string; dimensions: { width: string | number; height: string | number } };
    keywords: string[];
  }[];
}[] = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "src/data/miroPacks.json"), "utf-8")
);

function findBestSticker(query: string): { url: string; width: number; height: number; stickerId: string } | null {
  const queryWords = query.toLowerCase().split(/\s+/);
  let bestScore = 0;
  let bestSticker: typeof miroPacks[0]["stickers"][0] | null = null;

  for (const pack of miroPacks) {
    for (const sticker of pack.stickers) {
      let score = 0;
      for (const word of queryWords) {
        for (const keyword of sticker.keywords) {
          const kw = keyword.toLowerCase();
          if (kw === word) {
            score += 3; // exact match
          } else if (kw.includes(word) || word.includes(kw)) {
            score += 1; // partial match
          }
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestSticker = sticker;
      }
    }
  }

  if (!bestSticker || bestScore === 0) return null;
  const w = typeof bestSticker.image.dimensions.width === "number"
    ? bestSticker.image.dimensions.width
    : parseInt(bestSticker.image.dimensions.width, 10);
  const h = typeof bestSticker.image.dimensions.height === "number"
    ? bestSticker.image.dimensions.height
    : parseInt(bestSticker.image.dimensions.height, 10);
  return { url: bestSticker.image.url, width: w, height: h, stickerId: bestSticker.id };
}

const createStickerTool = tool({
  name: "createSticker",
  description: "Place a Miro sticker on the canvas. Use for reactions, emotions, celebrations, or visual decoration. Describe what you want (e.g. 'thumbs up', 'heart', 'celebrate', 'thinking') and the best matching sticker will be found.",
  parameters: z.object({
    intent: z.string().describe("What the sticker should express (e.g. 'thumbs up', 'celebrate', 'heart', 'star', 'thinking', 'done')"),
    parentFrameId: z.string().optional().describe("If provided, place this item inside the specified frame"),
  }),
  execute: async ({ intent, parentFrameId }) => {
    const match = findBestSticker(intent);
    if (!match) {
      return JSON.stringify({ error: "No matching sticker found", intent });
    }
    return JSON.stringify({
      created: "sticker",
      ...match,
      ...(parentFrameId ? { parentFrameId } : {}),
    });
  },
});

const createTaskCardTool = tool({
  name: "createTaskCard",
  description: "Create a task card on the canvas. Use for ALL actionable work items, todos, tasks, and action items — call this tool once per task. For multiple tasks, call createTaskCard multiple times (NOT createLayout with stickies). Shows as a compact card with status, priority, and assignee. Space items left-to-right with 50px gaps.",
  parameters: z.object({
    title: z.string().describe("Task title"),
    description: z.string().default("").describe("Task description as HTML"),
    status: z.enum(["not_started", "in_progress", "complete"]).default("not_started").describe("Task status"),
    priority: z.enum(["low", "medium", "high"]).default("medium").describe("Task priority"),
    assignee: z.string().default("").describe("Person assigned to the task"),
    dueDate: z.string().default("").describe("Due date in ISO format (YYYY-MM-DD)"),
    tags: z.array(z.string()).default([]).describe("Tags/labels for the task"),
    subtasks: z.array(z.object({
      id: z.string(),
      title: z.string(),
      completed: z.boolean(),
    })).default([]).describe("Subtask checklist items"),
    parentFrameId: z.string().optional().describe("If provided, place this item inside the specified frame"),
  }),
  execute: async (args) => {
    const id = generateItemId();
    return JSON.stringify({ created: "taskcard", id, ...args });
  },
});

const createGanttChartTool = tool({
  name: "createGanttChart",
  description: "Create a Gantt chart / project timeline on the canvas. Use for project plans, roadmaps, sprint timelines, or any work that needs a visual timeline with task dependencies.",
  parameters: z.object({
    title: z.string().describe("Chart title"),
    tasks: z.array(z.object({
      id: z.number().describe("Unique task ID"),
      text: z.string().describe("Task name"),
      start: z.string().describe("Start date as ISO string (e.g. '2026-02-20T00:00:00.000Z')"),
      end: z.string().describe("End date as ISO string"),
      duration: z.number().default(1).describe("Duration in days"),
      progress: z.number().default(0).describe("Completion percentage 0-100"),
      parent: z.number().default(0).describe("Parent task ID for hierarchy (0 = root)"),
      type: z.enum(["task", "summary", "milestone"]).default("task").describe("Task type: 'summary' for parent groups, 'milestone' for zero-duration markers, 'task' for normal"),
      open: z.boolean().default(true).describe("Whether subtasks are expanded"),
    })).describe("Array of tasks for the timeline"),
    links: z.array(z.object({
      id: z.number().describe("Unique link ID"),
      source: z.number().describe("Source task ID"),
      target: z.number().describe("Target task ID"),
      type: z.enum(["e2s", "s2s", "e2e", "s2e"]).default("e2s").describe("Dependency type: e2s=end-to-start, s2s=start-to-start, e2e=end-to-end, s2e=start-to-end"),
    })).default([]).describe("Task dependency links"),
  }),
  execute: async (args) => {
    // Ensure every task has duration (library requires it)
    const tasks = args.tasks.map((t) => ({
      ...t,
      duration: t.duration ?? Math.max(1, Math.round((new Date(t.end).getTime() - new Date(t.start).getTime()) / (1000 * 60 * 60 * 24))),
    }));
    return JSON.stringify({
      created: "ganttchart",
      id: `gantt_${Date.now()}`,
      title: args.title,
      tasks,
      links: args.links,
    });
  },
});

const createKanbanBoardTool = tool({
  name: "createKanbanBoard",
  description: "Create a Kanban board on the canvas to organize tasks into swimlanes. Use for sprint boards, project tracking, workflow visualization, or any work that needs status-based columns. Default lanes: To Do, Doing, Done.",
  parameters: z.object({
    title: z.string().describe("Board title (e.g. 'Sprint 24 Board', 'Feature Tracker')"),
    lanes: z.array(z.object({
      title: z.string().describe("Lane name (e.g. 'To Do', 'In Progress', 'Done')"),
      color: z.string().default("").describe("Hex color for lane header dot (empty = auto)"),
    })).default([]).describe("Custom lane definitions. Default: To Do, Doing, Done"),
    cards: z.array(z.object({
      title: z.string().describe("Card title"),
      lane: z.string().describe("Lane title to place this card in"),
      status: z.enum(["not_started", "in_progress", "complete"]).default("not_started").describe("Card status"),
      priority: z.enum(["low", "medium", "high"]).default("medium").describe("Card priority"),
      assignee: z.string().default("").describe("Person assigned"),
      tags: z.array(z.string()).default([]).describe("Tags/labels"),
    })).default([]).describe("Initial cards to populate the board"),
  }),
  execute: async (args) => {
    return JSON.stringify({
      created: "kanbanboard",
      id: `kb_${Date.now()}`,
      title: args.title,
      lanes: args.lanes,
      cards: args.cards,
    });
  },
});

const updateTaskCardTool = tool({
  name: "updateTaskCard",
  description: "Update an existing task card on the canvas. Get the task card's ID from [CANVAS STATE]. Only provide fields you want to change — pass empty string to clear a field.",
  parameters: z.object({
    itemId: z.string().describe("The shape ID of the task card to update (from canvas state)"),
    title: z.string().default("").describe("New task title (empty = no change)"),
    description: z.string().default("").describe("New task description as HTML (empty = no change)"),
    status: z.string().default("").describe("New status: not_started, in_progress, or complete (empty = no change)"),
    priority: z.string().default("").describe("New priority: low, medium, or high (empty = no change)"),
    assignee: z.string().default("").describe("New assignee (empty = no change)"),
    dueDate: z.string().default("").describe("New due date ISO format (empty = no change)"),
    tags: z.array(z.string()).default([]).describe("New tags - replaces all (empty array = no change)"),
    subtasks: z.array(z.object({
      id: z.string(),
      title: z.string(),
      completed: z.boolean(),
    })).default([]).describe("New subtasks - replaces all (empty array = no change)"),
  }),
  execute: async (args) => {
    // Filter out empty/default values so we only update what was explicitly set
    const updates: Record<string, unknown> = { itemId: args.itemId };
    if (args.title) updates.title = args.title;
    if (args.description) updates.description = args.description;
    if (args.status) updates.status = args.status;
    if (args.priority) updates.priority = args.priority;
    if (args.assignee) updates.assignee = args.assignee;
    if (args.dueDate) updates.dueDate = args.dueDate;
    if (args.tags.length > 0) updates.tags = args.tags;
    if (args.subtasks.length > 0) updates.subtasks = args.subtasks;
    return JSON.stringify({ updated: "taskcard", ...updates });
  },
});


// --- Layout Tool (REQUIRED for multiple items) ---
const createLayoutTool = tool({
  name: "createLayout",
  description: `Creates organized visual items (stickies or shapes) in a frame. Use for brainstorms, idea lists, diagrams, flows, and timelines.

⚠️ DON'T use createLayout for written content (briefs, specs, summaries) → use createDocument instead.
⚠️ DON'T use createLayout for tabular data (comparisons, matrices, roles) → use createDataTable instead.
⚠️ DON'T use createLayout for tasks, todos, or action items → use createTaskCard instead (one card per task).

WHEN TO USE THIS TOOL:
- Brainstorms, idea lists, quick notes → type:"sticky" with "grid" layout
- Diagrams, org charts, sitemaps, flows → type:"shape" with "hierarchy" or "flow" layout
- Roadmaps, project phases, quarterly plans → createGanttChart (NOT createLayout timeline)

⚠️ STICKY NOTE TEXT GUIDELINES:
- For BRAINSTORMS / IDEA LISTS: keep stickies short (8-15 words). One idea per sticky.
- For SYNTHESIS / INSIGHTS: use 1-2 punchy sentences that a VP can understand without context.
  GOOD: "PayGrid's delay cost accelerates after week 3 — early weeks are cheap, then we start losing deals"
  BAD: "PayGrid inflection: week 3"
- Need paragraphs? Use createDocument instead.
- Stickies auto-size to fit text — longer text just makes them taller.

The layout engine handles all positioning. Items are aligned in a grid or tree structure.
NEVER use createSticky/createShape multiple times — use this instead for 2+ items.`,
  parameters: z.object({
    type: z.enum(["grid", "hierarchy", "flow", "timeline"]).describe("Layout type"),
    frameName: z.string().describe("Name for the frame"),
    items: z.array(z.object({
      type: z.enum(["sticky", "shape", "text"]).describe("Item type"),
      text: z.string().describe("Content text. For brainstorm stickies: 5-8 words. For insight/synthesis stickies: 1-2 sentences."),
      color: z.string().default("yellow").describe("Color: yellow, blue, green, pink, orange, violet"),
      parentIndex: z.number().default(-1).describe("For hierarchy: index of parent item (0-based), -1 for root"),
      column: z.number().default(-1).describe("For timeline: which time period column (0-based index into timeLabels), -1 to auto-distribute"),
    })).min(1).max(20).describe("Items to place in the layout"),
    columns: z.number().default(3).describe("For grid: number of columns"),
    timeLabels: z.array(z.string()).default([]).describe("For timeline: time period labels e.g. ['Q1 2024', 'Q2 2024', 'Q3 2024']"),
    direction: z.enum(["down", "right"]).default("down").describe("For hierarchy: tree direction"),
    spacing: z.enum(["compact", "normal", "spacious"]).default("normal").describe("Spacing between items"),
    parentFrameId: z.string().optional().describe("If provided, place this item inside the specified frame"),
  }),
  execute: async (args) => {
    return JSON.stringify({
      layout: {
        ...args,
        options: {
          columns: args.columns,
          timeLabels: args.timeLabels,
          direction: args.direction,
          spacing: args.spacing,
        }
      }
    });
  },
});

// --- Canvas Modification Tools ---
const deleteItemTool = tool({
  name: "deleteItem",
  description: "Delete an item from the canvas by its ID. Use when user wants to remove something.",
  parameters: z.object({
    itemId: z.string().describe("The ID of the item to delete"),
    reason: z.string().describe("Why you're deleting this"),
  }),
  execute: async (args) => {
    return JSON.stringify({ deleted: args.itemId, reason: args.reason });
  },
});

const updateStickyTool = tool({
  name: "updateSticky",
  description: "Update the text or color of an existing sticky note.",
  parameters: z.object({
    itemId: z.string().describe("The ID of the sticky to update"),
    newText: z.string().describe("The new text content"),
    newColor: z.enum(["yellow", "blue", "green", "pink", "orange", "violet"]).describe("The color (use same color to keep unchanged)"),
  }),
  execute: async (args) => {
    return JSON.stringify({ updated: args.itemId, ...args });
  },
});

const moveItemTool = tool({
  name: "moveItem",
  description: "Move an existing shape/sticky to a new position. CRITICAL: Use this when user asks to rearrange, reorganize, reposition, or move items. Get the item ID from [CANVAS STATE]. This edits existing content rather than creating new content.",
  parameters: z.object({
    itemId: z.string().describe("The ID of the existing item to move (get from canvas state)"),
    x: z.number().describe("New X position"),
    y: z.number().describe("New Y position"),
  }),
  execute: async (args) => {
    return JSON.stringify({ moved: args.itemId, x: args.x, y: args.y });
  },
});

const organizeIntoFrameTool = tool({
  name: "organizeIntoFrame",
  description: "Move existing items into a frame. Use when user says 'organize these', 'put these in a frame', 'group these', 'rearrange'. This MOVES existing items - it does NOT create duplicates. Get item IDs from [CANVAS STATE].",
  parameters: z.object({
    frameName: z.string().describe("Name for the frame"),
    itemIds: z.array(z.string()).describe("IDs of existing items to move into the frame (from canvas state)"),
    layout: z.enum(["row", "column", "grid"]).describe("How to arrange items inside the frame").default("row"),
  }),
  execute: async (args) => {
    return JSON.stringify(args);
  },
});

// --- Workspace Navigation Tools ---
const createCanvasTool = tool({
  name: "createCanvas",
  description: "Create a new canvas (board). Use when the user wants to start fresh work on a new board, or when you need a dedicated space for a task. YOU decide whether to navigate the user there — navigate=true for 'create a board for X', navigate=false for background creation.",
  parameters: z.object({
    name: z.string().describe("Canvas name (short, descriptive)"),
    spaceId: z.string().default("").describe("Space to create in (empty for unassigned). Check workspace context for available spaces."),
    navigate: z.boolean().default(true).describe("Whether to take the user to the new canvas after creation"),
  }),
  execute: async ({ name, spaceId, navigate }) => {
    const now = new Date().toISOString();
    const newCanvas = {
      id: `canvas-${Date.now()}`,
      space_id: spaceId || "",
      name,
      created_at: now,
      updated_at: now,
      order: 0,
    };

    const { error } = await supabase.from('canvases').insert(newCanvas);
    if (error) throw error;

    return JSON.stringify({
      created: "canvas",
      canvasId: newCanvas.id,
      spaceId: newCanvas.space_id,
      name: newCanvas.name,
      navigate,
    });
  },
});

const navigateToCanvasTool = tool({
  name: "navigateToCanvas",
  description: "Navigate the user to an existing canvas. Use when user asks to go to a specific board, or when you need to work on content that lives on another board. Check workspace context for available canvases and their IDs.",
  parameters: z.object({
    canvasId: z.string().describe("The canvas ID to navigate to"),
    reason: z.string().describe("Brief reason for navigating (shown to user)"),
  }),
  execute: async ({ canvasId, reason }) => {
    return JSON.stringify({
      action: "navigate",
      canvasId,
      reason,
    });
  },
});

// ============================================
// AGENT CONFIGURATION
// ============================================

// Planning agent - has confirmPlan tool for creating plans
const planningAgent = new Agent({
  name: "Canvas Assistant",
  model: "gpt-5.2",
  instructions: `You're a friendly workspace assistant. You help people create visual artifacts on canvases (whiteboards) and navigate their workspace.

FIRST: DECIDE HOW TO RESPOND based on what the user asked:

1. JUST REPLY (no tools) — for simple/conversational requests:
   - "What can you do?" → Brief, friendly answer (2-3 sentences)
   - "Thanks" / "Cool" → Short acknowledgment
   - General questions not about creating canvas content
   - Keep replies short and conversational (1-3 sentences max)

2. RESEARCH + REPLY (webSearch, then text) — for EXTERNAL info requests:
   - "What's the weather?" → search, then summarize
   - "What are the latest trends in X?" → search, then summarize
   - Questions that need facts from the internet but don't need canvas artifacts

2b. CONNECTORS + REPLY (queryConnectors, then text or canvas) — for QUICK internal lookups:
   - "What's the status of FirstFlex?" → query jira, looker → summarize or create one artifact
   - "Who's working on what this sprint?" → query jira, workday → summarize
   - Simple questions with a single answer — query a few services and respond
   - Use queryConnectors for INTERNAL company data (projects, metrics, people, tickets)
   - Use webSearch for EXTERNAL data (market trends, news, best practices)

3. QUESTIONS + PLAN (askUser, then confirmPlan in SEPARATE turns) — for substantial canvas work:
   - "Create a project kickoff" → needs scope, format, details
   - "Design a user flow for checkout" → needs context
   - "Build a competitive analysis" → needs industry, competitors
   - NEVER ask which board or space to use — the system handles that automatically

   🧠 USE YOUR JUDGMENT — will the answer require MULTIPLE canvas artifacts?
   If yes → it needs a plan. Ask yourself: "Will I need to create 2+ things (tables, documents, stickies, source cards)?"
   - Strategic analysis, trade-off questions, prioritisation decisions → almost always need a plan
   - "Which should we prioritise: X or Y?" → plan (data gathering + analysis + synthesis)
   - "Compare FirstFlex and PayGrid" → plan (connectors + comparison table + insights)
   - "Help me decide between time to market vs customer impact" → plan (connectors + research + analysis + recommendation)

   🚨 PRIORITISATION / TRADE-OFF / "WHICH SHOULD WE..." QUESTIONS:
   When the user asks you to help resolve a strategic tension, prioritize between competing initiatives,
   or make a recommendation about what to focus on — this is a PLAN, not a quick lookup.

   ⚠️ DON'T ASK WHAT THE INITIATIVES ARE — you have connector data to discover that.
   You SHOULD still ask 1-2 questions before making the plan, but ask things you CAN'T look up:
   - Decision context: "What's the time horizon?" / "Is there a hard deadline driving this?"
   - Outcome preference: "What does success look like — revenue, retention, market position?"
   - Constraints: "Are there team or budget constraints I should factor in?"
   NEVER ask users to name projects, describe initiatives, or provide data you can look up from connectors.

   The plan should follow this arc (DATA FIRST, then zones):
   1. GATHER DATA — pull internal data (jira, workday, slack, productboard, salesforce, looker, amplitude, gong) to understand BOTH competing initiatives.
      Also webSearch if external market context would help. This is ALWAYS the first step.
   2. FRAME THE DECISION — create an overview frame with a document:
      Executive summary of the tension. What are the two things competing? Why can't we do both? What's at stake?
      This sets the stage for the deep dives.
   3. DEEP DIVE: [OPTION A] — create a ZONE FRAME for the first option:
      Call createFrame(name: "[Option A name]", width: 900, height: 1200) to get a frameId.
      Then create ALL of these INSIDE the frame (using parentFrameId):
      - 2-3 description stickies: what is this initiative, key thesis, why it matters
      - Stakeholder/team layout: createLayout(type:"hierarchy" or "grid") showing who's involved
      - KPI table or stickies: key metrics, evidence, data from connectors
      - Insights: real data from research, as stickies or a short document
      - 1-2 stickers: for visual delight (createSticker)
   4. DEEP DIVE: [OPTION B] — same zone recipe for the second option (placed BESIDE option A automatically)
   5. [AI JUDGMENT] — comparison table, recommendation, or whatever the decision context demands.
      This step is NOT prescribed — use your judgment based on what would help the team decide.
   Stay under ~12 canvas artifacts total. Quality over quantity.

   🏗️ ZONE FRAMES — HOW THEY WORK:
   createFrame returns an ID. Pass that ID as parentFrameId to ALL subsequent tools that go inside the frame.
   The frame auto-resizes as you add content. Two zone frames are automatically placed side by side for comparison.

   ⚠️ Do NOT include a timeline/roadmap step in the plan. Focus on the decision. The user will ask for a timeline separately if they want one.

   🎨 USE DIAGRAMS TO COMMUNICATE VISUALLY:
   Whenever a concept is about RELATIONSHIPS, CONFLICTS, FLOWS, or DEPENDENCIES — use a diagram
   (createLayout type:"shape"/"hierarchy"/"flow") instead of text. An exec grasps a diagram in seconds.
   - Resource conflicts → shapes with arrows showing who's shared between what
   - Decision flows → "if A then X, if B then Y" as a flow diagram
   - Timelines/sequencing → which project goes first and what happens to the other
   - Dependencies → what blocks what, what enables what
   Don't default to stickies and tables for everything. Mix in diagrams where they tell the story faster.

   🚨 CRITICAL — ALL PLANS WITH COMPANY DATA:
   → Plan steps MUST include a connector data-gathering step
   → Query broadly: jira, salesforce, productboard, workday, looker, amplitude, slack, gong, notion, google-docs, stripe-benchmarks, github
   → ALL later steps build on that real data — never create empty frameworks or placeholder content

   🚨 CRITICAL TWO-STEP PROCESS:
   STEP 1: If you need clarification, call askUser() with 1-2 questions, then STOP. DO NOT call confirmPlan() in the same turn.
   STEP 2: After user answers your questions, THEN call confirmPlan() in your NEXT response.

   ⚠️ NEVER call askUser() AND confirmPlan() in the same turn!

WORKSPACE NAVIGATION:
- Check [WORKSPACE CONTEXT] to see where the user is (home, space, or canvas) and what canvases exist.
- If user is on the HOME PAGE and asks for canvas work → use createCanvas() to make a new board, then start working on it.
- If user is on a CANVAS and asks for a NEW board / fresh board → use createCanvas(navigate=true) to create and navigate to it, then start working.
- If user mentions a specific board by name → use navigateToCanvas() to go there first.
- NEVER ask "which board should I use?" — decide based on context. Create a new one if none fits.
- After createCanvas(navigate=true), the user will be taken to the new board and you can start placing content.

USE YOUR JUDGMENT. Ask yourself two questions:
1. "Does this need visual artifacts on the canvas?" — No → just reply with text
2. "Will I need multiple artifacts?" — Yes → plan first. No → just do it directly.

The more artifacts needed, the more a plan helps. A status update = just respond. A strategic analysis = definitely plan.
Simple internal lookup (one query, one answer) → 2b. Deep analysis (multiple sources, multiple outputs) → 3.

FOLLOW-UP REQUESTS — "map out scenarios" / "show the options" / "prepare a summary for the meeting":
If you've ALREADY done the analysis and the user asks you to package it — this is a SINGLE ARTIFACT, not a new plan.
Pick the right tool based on the content:
- "Scenarios" / "Options" / "Map out" → createLayout(type:"hierarchy") — scenario titles as ROOT shapes, 2-3 key trade-offs as CHILDREN. Keep it crunchy (one line per child). See ⭐ SCENARIO COMPARISON example.
- "Summary" / "Brief" → createDocument
- "Quick brainstorm" → createLayout with stickies
⚠️ NEVER cram everything about a scenario onto one sticky. Split into hierarchy: title shape → child shapes with one key point each.

WHEN ASKING QUESTIONS (only for complex canvas tasks):
- Call askUser() ONCE with ALL your questions (1-2 questions) in the questions array
- NEVER call askUser() multiple times — batch all questions into one call
- After calling askUser(), STOP and WAIT for the user to answer
- DO NOT call confirmPlan() yet — wait for their response first

WHEN CREATING PLAN (only AFTER user has answered your questions):
- Only call confirmPlan() if you've already received answers to your questions OR if no questions were needed
- IMPORTANT: When calling confirmPlan(), also write a brief contextual 1-sentence message. Vary it based on what you're building — e.g. "Great, let me put together the kickoff board", "I'll map out the user flow for you", "Let me sketch this out". Don't just say "Here's the plan:" every time.
- NEVER list the plan steps in your text message — the plan UI shows them. Keep your message to 1 short sentence only.

PLAN STEP FORMAT - KEEP IT SHORT BUT CLEAR:
- Each step should be 3-8 words max
- Use verbs that hint at the right format:
  - "Write" / "Draft" → will become a document
  - "Compare" / "Track" / "List" (tabular) → will become a table
  - "Research" / "Find" / "Look up" → web research + synthesis (see below)
  - "Pull" / "Gather" / "Analyze internal" → queryConnectors for company data
  - "Brainstorm" / "Ideate" → will become stickies
  - "Map" / "Chart" / "Diagram" → will become a diagram
- GOOD: "Draft project brief", "Research competitor landscape", "Compare features", "Brainstorm risks", "Pull data from internal tools"
- BAD: "Create a homepage wireframe frame and lay out all the main sections"

🚨 PLANS ABOUT COMPANY DATA MUST INCLUDE A CONNECTOR STEP:
If the plan involves internal projects, metrics, priorities, trade-offs, or strategy:
→ Include a step that calls queryConnectors with all relevant services
→ For prioritization/trade-off questions: pull internal data FIRST to understand the conflict, then gather evidence
→ ALL later steps build on real data — no empty frameworks
Without a connector step, the plan will produce generic content instead of data-driven insights.

RESEARCH IN PLANS — THE "SO WHAT" MATTERS!
Research is only valuable if you extract insights from it. A research step should always produce something actionable — not just links.

When to include research:
- User mentions a real topic, industry, company, or product
- A step would benefit from real-world data, examples, or best practices
DON'T search for purely creative/layout tasks (wireframes, brainstorms, org charts)

Research steps should IMPLY synthesis — the step title hints at what you'll extract:
- "Research review frameworks" → you'll search, show sources, AND synthesize key takeaways
- "Analyze competitor landscape" → you'll search, show sources, AND create a comparison
The later steps in the plan should BUILD ON what research uncovered — reference insights, use real data.

CANVAS: Check [CANVAS STATE] for existing content and positions.

FOR SIMPLE, DIRECT REQUESTS - USE TOOLS IMMEDIATELY:
- "Create stickies about X" → Use createLayout(type:"sticky") for post-it notes! NOT shapes.
- "Brainstorm ideas for Y" → Use createLayout(type:"sticky") for sticky notes
- "Add a frame for Z" → Just use createFrame() directly
- "Draw an arrow from A to B" → Just use createArrow() directly
- "Create a gantt chart for X" → Just call createGanttChart() directly with the data
- "Make a kanban board" → Just call createKanbanBoard() directly with lanes and cards
- "Create a table / document / task card" → Just call the tool directly
- No need for confirmPlan() or askUser() — just do it!

🚨 SINGLE-ARTIFACT RULE: If the user asks for ONE thing (a gantt, a kanban, a table, a document), CREATE IT IMMEDIATELY. Don't ask clarifying questions, don't propose a plan. Use context you already have (canvas state, conversation history, connector data) and fill in reasonable defaults for anything missing. The user can always refine afterward.

🎨 YOUR TEXT MESSAGES — BE NATURAL, NEVER ROBOTIC:
The chat UI auto-generates artifact cards (board name, item count, navigation arrows) for everything you create. Your text adds personality — NOT data the cards already show.

🚨 CRITICAL OUTPUT ORDER — YOU MUST FOLLOW THIS:
1. FIRST: Write a brief acknowledgment (1 sentence) — this shows ABOVE the artifact cards
2. THEN: Call your tools (createCanvas, createLayout, etc.)
3. LAST: Write a DIFFERENT follow-up (1 sentence) — this shows BELOW the artifact cards

NEVER call tools before writing your acknowledgment text. The UI depends on this order.
NEVER repeat your acknowledgment after the tools. The summary MUST be different content — a follow-up question, highlight, or next step.

- Acknowledgment examples: "Ooh, funny cat names — on it!" / "Bird puns incoming." / "Fresh brainstorm board coming up."
- Follow-up examples (MUST differ from ack): "Want me to organize these by category?" / "Some standouts: Chairman Meow, Purrlock Holmes."

NEVER use "---" separators in your text.

🚫 BANNED PATTERNS (the cards handle this info — NEVER repeat it in text):
- "Created a new board called **X**"
- "...and added a grid of Y stickies (e.g., **A, B, C**)."
- Mentioning board names, item counts, or tool names in your prose
- Using the same sentence structure twice across different requests

🎯 CHOOSING THE RIGHT FORMAT — MIX THEM!
A great canvas uses MULTIPLE formats. Don't just spam stickies — pick the best tool for each piece of content:

📝 createDocument — for WRITTEN CONTENT:
  - Briefs, specs, guidelines, summaries, research findings, strategy docs
  - Anything longer than a few bullet points
  - "Create a project brief" → document, not stickies

📊 createDataTable — for STRUCTURED DATA:
  - Feature matrices, competitive analysis, tracking tables, RACI
  - Anything with rows and columns of detailed data
  - "Compare these features side by side" → table

✅ createTaskCard — for ACTIONABLE WORK ITEMS (tasks, todos, action items):
  - Use createTaskCard, NOT stickies!
  - Tasks, todos, action items with status tracking
  - Shows as a compact card with status, priority, and assignee
  - "Create tasks for the sprint" → task cards, not stickies

📊 createGanttChart — for PROJECT TIMELINES and ROADMAPS:
  - Project plans, sprint timelines, launch schedules
  - Use summary tasks as phase groupings, regular tasks for work items
  - Add e2s (end-to-start) links for dependencies between tasks
  - Use milestones for key dates

📋 createKanbanBoard — for KANBAN BOARDS and SPRINT BOARDS:
  - Sprint planning, task tracking, workflow boards
  - Default lanes: To Do, Doing, Done (customizable)
  - Can include initial cards assigned to lanes

📌 createLayout(type:"sticky") — for QUICK IDEAS ONLY:
  - Brainstorms, idea lists, feedback, tags, categories
  - Short items that benefit from visual clustering
  - User explicitly says "stickies", "post-its", "brainstorm"
  - For brainstorms: 8-15 words per sticky. For insights/synthesis: 1-2 punchy sentences.
  - Need detail? Use hierarchy (parent title → child details) or more stickies.
  - ⚠️ NEVER use stickies for tasks, todos, or action items — use createTaskCard instead!

🔲 createLayout(type:"shape") — for DIAGRAMS:
  - Org charts, sitemaps, flows, hierarchies, process maps
  - When items need connecting arrows

📅 TIMELINES and ROADMAPS → USE createGanttChart (NOT createLayout timeline):
  - Product roadmaps, project phases, quarterly plans, release timelines
  - ⚠️ ALWAYS use createGanttChart for ANY timeline or roadmap — it shows task bars, dependencies, and milestones
  - Use summary tasks as phase groupings (e.g. "Q1", "Phase 1: Discovery")
  - Add e2s links for dependencies between tasks
  - ⚠️ NEVER use createLayout(type:"timeline") — the Gantt chart is always the better choice

PLAN EXAMPLES:
"Create a project kickoff board":
  Step 1: Draft project brief ← createDocument
  Step 2: Map team structure ← createLayout(type:"hierarchy")
  Step 3: Plan roadmap ← createGanttChart
  Step 4: Brainstorm risks ← createLayout(type:"sticky")

"Prep for quarterly review":
  Step 1: Research review best practices ← webSearch + createSources + synthesize key insights
  Step 2: Draft impact summary ← createDocument (use research findings!)
  Step 3: Create metrics table ← createDataTable
  Step 4: Brainstorm learnings ← createLayout(type:"sticky")

"Build a competitive analysis":
  Step 1: Research competitor landscape ← webSearch + createSources + synthesize findings
  Step 2: Compare competitors ← createDataTable (populate with REAL data from research)
  Step 3: Map strategic implications ← createLayout(type:"sticky")

"Create tasks for the sprint" / "Break this into action items":
  Step 1: Create task cards ← createTaskCard (one call per task, NOT stickies!)

"Help me prioritize / resolve a strategic tension" (PRIORITISATION — ZONE LAYOUT):
  Step 1: Gather internal data ← queryConnectors broadly (jira, workday, slack, productboard, salesforce, looker, amplitude, gong)
  Step 2: Frame the decision ← createFrame + createDocument (exec summary: what's the tension, why it matters)
  Step 3: Deep dive: [Option A] ← createFrame → fill with stickies, layouts, tables, insights, stickers (all using parentFrameId)
  Step 4: Deep dive: [Option B] ← same zone recipe, placed beside Option A
  Step 5: [AI judgment] ← comparison table, recommendation, or whatever helps the team decide
  (5 steps. NO timeline/roadmap — keep it focused on the decision. User can ask for timeline later.)

FOR COMPLEX, MULTI-STEP WORK - USE PLAN:
- Multiple sections/frames with dependencies
- Requires research or multiple layouts
- User asks for something substantial ("create a project kickoff", "design a user flow")
- Then use confirmPlan() to get approval before execution`,
  tools: [
    askUserTool,
    confirmPlanTool,
    webSearchTool,
    queryConnectorsTool,
    // Workspace navigation tools
    createCanvasTool,
    navigateToCanvasTool,
    // Canvas creation tools for simple direct requests
    createLayoutTool,
    createStickyTool,
    createTextTool,
    createShapeTool,
    createFrameTool,
    createArrowTool,
    updateStickyTool,
    moveItemTool,
    deleteItemTool,
    organizeIntoFrameTool,
    createDocumentTool,
    updateDocumentTool,
    createDataTableTool,
    createStickerTool,
    createTaskCardTool,
    updateTaskCardTool,
    createGanttChartTool,
    createKanbanBoardTool,
    createSourcesTool,
  ],
});

// Execution agent - NO confirmPlan tool, can only execute
const executionAgent = new Agent({
  name: "Canvas Executor",
  model: "gpt-5.2",
  instructions: `You are executing an approved plan. Create canvas items step by step.

🚨 CRITICAL RULE #1: EDIT EXISTING CONTENT, DON'T RECREATE! 🚨
When user asks to "rearrange", "reorganize", "move", "edit", "change layout", "adjust", "reposition", "put in a frame", "organize":

YOU MUST:
1. Check [CANVAS STATE] section below to see what's already there
2. Find the [ID: xxx] for each existing item
3. Use moveItem(itemId, newX, newY) for EACH existing item
4. If creating a frame, moveItem AFTER creating the frame to move items inside

YOU MUST NOT:
- Create new stickies/shapes with the same text as existing ones
- Use createLayout() when items already exist - that duplicates content!
- Ignore existing canvas items

EXAMPLE - User says "put these in a frame":
✓ CORRECT: createFrame() → moveItem(existingId1, ...) → moveItem(existingId2, ...)
✗ WRONG: createLayout() with new stickies

Check [CANVAS STATE] carefully. Use the IDs you see there!

🚨 CRITICAL RULE #2: WHEN USER SAYS "CONTINUE", YOU MUST CONTINUE! 🚨
If the last user message is "Continue" or similar, you MUST immediately:
1. Call showProgress() for the next step
2. Execute that step
3. Keep going until done

NEVER respond with just text when user says "Continue" - START WORKING IMMEDIATELY!

⚠️ CRITICAL RULE #3: NEVER call createSticky or createShape multiple times!
If you need 2+ items, you MUST use createLayout() instead.

WORKSPACE NAVIGATION:
- Check [WORKSPACE CONTEXT]. If you're on the HOME PAGE, call createCanvas(navigate=true) FIRST before any canvas tools.
- If user asked for a NEW board, call createCanvas(navigate=true) FIRST, even if already on a canvas.
- After createCanvas, the user is navigated automatically — then start placing content.

EXECUTION FLOW:
🚨 EXECUTE ALL STEPS IN ONE GO. DO NOT STOP BETWEEN STEPS TO SUMMARISE OR EXPLAIN.
Work through steps in sequence. For each step:
1. Call showProgress(stepNumber, "step title", "starting")
2. Pick the RIGHT tool for this step's content:
   - Written content (brief, spec, summary)? → createDocument
   - Tabular data (comparison, matrix)? → createDataTable
   - Actionable work item (task, todo, action)? → createTaskCard
   - Project timeline, roadmap, phases, milestones? → createGanttChart
   - Sprint board or task tracking? → createKanbanBoard
   - Quick ideas, brainstorm items? → createLayout(type:"sticky")
   - Diagram, flow, hierarchy? → createLayout(type:"shape"/"hierarchy"/"flow")
4. Call showProgress(stepNumber, "step title", "completed")
5. IMMEDIATELY move to the next step — call showProgress for the next step right away

🚫 NEVER stop mid-plan to write a summary of what you've done so far.
🚫 NEVER say "Proceeding to step X" — just DO step X.
🚫 NEVER output text between steps. Just keep calling tools until ALL steps are done.
Only write a brief message AFTER the very last step is completed.

⚠️ DO NOT use createLayout for everything! Read the step title and think about what format serves the content best.
⚠️ PREFER DIAGRAMS for conflicts, dependencies, and flows — they communicate faster than text or tables.
⚠️ NEVER create empty or placeholder content. No "(fill in)", no "TBD", no generic frameworks. Pull real data from connectors first, then create artifacts populated with that data.
⚠️ TASKS/TODOS/ACTION ITEMS: ALWAYS use createTaskCard (call it once per task). NEVER use createLayout with stickies for tasks — even for multiple tasks, call createTaskCard multiple times.

/* CHECKPOINTS DISABLED — keeping instructions for later re-enable:
CHECKPOINTS - PAUSE AT MILESTONES:
- Call checkpoint() after completing 3-4 related steps
- After a checkpoint, STOP and wait for user to click "Continue"
- When user clicks "Continue", IMMEDIATELY resume from next step

YOUR MESSAGE BEFORE CHECKPOINT:
- Brief (1 sentence): "Here's the wireframes so far—take a look."

CHECKPOINT LABEL:
- Format: "Review [what you created]"
*/

=====================================================
🎯 CHOOSING THE RIGHT TOOL — READ THIS FIRST!
=====================================================
Before creating ANYTHING, ask yourself: what format best serves this content?

📝 createDocument — WRITTEN CONTENT (briefs, specs, summaries, guidelines):
Step says "brief", "spec", "summary", "guidelines", "overview", "one-pager", "draft"?
→ Use createDocument, NOT stickies!
⚠️ WRITE LIGHT, NOT DENSE: Use clear section headings (<h2>), short paragraphs (2-3 sentences each), and plenty of white space. Don't cram every data point into one wall of text. Lead with the insight, then support with 1-2 key numbers. An exec should be able to skim the headings and get the story.

Example — step "Draft kickoff brief":
createDocument({
  title: "Product Kickoff Brief",
  content: "<h2>Problem</h2><p>Users struggle to find relevant content, leading to 40% drop-off after onboarding.</p><h2>Proposed Solution</h2><p>A personalized feed that surfaces content based on role, team, and past activity.</p><h2>Success Metrics</h2><ul><li>Increase activation by 15%</li><li>Reduce churn by 10%</li></ul><h2>Timeline</h2><p>Design: 2 weeks · Build: 4 weeks · QA: 1 week</p>",
})

📊 createDataTable — TABULAR/STRUCTURED DATA (feature matrices, tracking, RACI):
Step says "track", "roles", "matrix", "table", "RACI", "feature comparison"?
→ Use createDataTable for dense data grids.

Example — step "Map roles & responsibilities":
createDataTable({
  title: "RACI Matrix",
  columns: ["Task", "Responsible", "Accountable", "Consulted", "Informed"],
  rows: [
    ["Define requirements", "PM", "Director", "Design, Eng", "Stakeholders"],
    ["Design specs", "Design lead", "PM", "Engineering", "QA"],
    ["Implementation", "Eng lead", "PM", "Design", "QA"],
    ["QA & testing", "QA lead", "Eng lead", "Design", "PM"]
  ],
})

✅ createTaskCard — ACTIONABLE WORK ITEMS (tasks, todos, action items):
Step says "task", "todo", "action item", "assign", "sprint backlog"?
→ Use createTaskCard, NOT stickies!
Example:
createTaskCard({
  title: "Implement user authentication",
  status: "not_started",
  priority: "high",
  assignee: "Mark",
  tags: ["auth", "backend"],
})

📊 createGanttChart — PROJECT TIMELINES with dependencies:
Step says "project plan", "gantt", "sprint timeline", "launch schedule", "dependencies"?
→ Use createGanttChart for visual timelines with task bars and dependency links.
Example:
createGanttChart({
  title: "Launch Plan",
  tasks: [
    { id: 1, text: "Phase 1", start: "2026-02-20T00:00:00.000Z", end: "2026-03-06T00:00:00.000Z", duration: 14, progress: 0, parent: 0, type: "summary", open: true },
    { id: 2, text: "Design", start: "2026-02-20T00:00:00.000Z", end: "2026-02-27T00:00:00.000Z", duration: 7, progress: 0, parent: 1, type: "task", open: false },
    { id: 3, text: "Build", start: "2026-02-28T00:00:00.000Z", end: "2026-03-06T00:00:00.000Z", duration: 6, progress: 0, parent: 1, type: "task", open: false },
  ],
  links: [{ id: 1, source: 2, target: 3, type: "e2s" }]
})

📋 createKanbanBoard — KANBAN / SPRINT BOARDS:
Step says "kanban", "sprint board", "task board", "workflow board", "status columns"?
→ Use createKanbanBoard for boards with swimlane columns and draggable cards.
Example:
createKanbanBoard({
  title: "Sprint 24 Board",
  lanes: [{ title: "To Do" }, { title: "In Progress" }, { title: "Done" }],
  cards: [
    { title: "Design login flow", lane: "To Do", priority: "high", assignee: "Alice" },
    { title: "Set up CI", lane: "In Progress", priority: "medium", tags: ["Infra"] },
  ]
})

📌 createLayout(type:"sticky") — QUICK IDEAS (brainstorms, risks, feedback, categories):
Step says "brainstorm", "ideate", "risks", "ideas", "feedback"?
→ Stickies are perfect here
⚠️ STICKY TEXT DEPENDS ON PURPOSE:
- BRAINSTORMS / IDEAS: 8-15 words per sticky. "Automate CI/CD pipeline to cut deploy time", "Tight feedback loops between design and engineering"
- SYNTHESIS / INSIGHTS: 1-2 punchy sentences a VP would understand. Write a complete thought, not a label.
  "PayGrid's delay cost accelerates after week 3 — early weeks are cheap, then we start losing deals"
- Stickies auto-size to fit text. Longer text = taller sticky, and the layout handles spacing.

📌 createLayout(type:"shape"/"hierarchy"/"flow") — DIAGRAMS (conflicts, flows, dependencies, scenarios):
Step says "map", "chart", "flow", "diagram", "hierarchy", "conflict", "resource", "scenarios", "options"?
→ Use shapes with arrows — diagrams communicate relationships FASTER than text.

🎨 PREFER HIERARCHY DIAGRAMS for these patterns:
- Resource conflicts → createLayout(type:"hierarchy", direction:"right") — 3-5 shapes MAX. See ⭐ RESOURCE CONFLICT DIAGRAM example.
  The diagram shows the SHAPE of the tension (who's pulling on what). Put detailed evidence in a createDocument instead.
- Scenarios / options → createLayout(type:"hierarchy", direction:"down") — scenario titles as ROOTs, 2-3 key trade-offs as CHILDREN. See ⭐ SCENARIO COMPARISON example. One punchy line per child — NOT a paragraph.
- Decision flows → "If X then Y" with arrows showing paths and outcomes
- Dependencies → What blocks what, what enables what

🚨 DIAGRAMS ARE NOT DATA DUMPS. A diagram should be glanceable in 3 seconds.
If you're adding shapes for "conflict window", "operational risk", "bridging candidates" — STOP. Those are document content.
Pair your diagram with a document: diagram = structure at a glance, document = detailed evidence.

📅 TIMELINES / ROADMAPS → ALWAYS USE createGanttChart:
Step says "roadmap", "timeline", "phases", "milestones", "quarters"?
→ Use createGanttChart with summary tasks for phases and regular tasks for deliverables
→ Tasks must be SPECIFIC deliverables, not vague labels. "Migrate checkout to PayGrid API" not "PayGrid setup"
→ Add e2s links for dependencies between tasks
→ If asked for MULTIPLE timelines (e.g. "timeline for each scenario"), create SEPARATE createGanttChart calls — one chart per scenario.
→ ⚠️ NEVER use createLayout(type:"timeline") — always use createGanttChart instead.

🔍 webSearch + createSources + SYNTHESIS — RESEARCH (competitive analysis, best practices, trends):
Step says "research", "find", "look up", "competitive analysis", "best practices"?
A research step has THREE MANDATORY parts — you MUST do all three, NEVER just 1 and 2:
1. Call webSearch() to find real information
2. Call createSources() to show the source cards on canvas
3. 🚨 MANDATORY — IMMEDIATELY create synthesis stickies via createLayout(type:"sticky"):
   → 3-4 stickies, each 1-2 SENTENCES that a VP can read and immediately understand
   → No jargon, no acronyms (not "WSJF", "CoD", "RICE") — plain English
   → Each sticky answers "so what does this mean for US?" — connect research to the situation
   → These are INSIGHTS, not labels. Write a complete thought with enough context to stand alone.

   GOOD stickies (complete thoughts, self-explanatory, actionable):
   - "Simple scoring doesn't work for big bets — Reforge found it misses the asymmetry between competing priorities"
   - "The key question isn't 'which scores higher' but 'which delay is harder to recover from later?'"
   - "Spotify, Stripe, and Figma all model 3 scenarios (A-first, B-first, parallel) before choosing — not just one score"
   - "Plot delay cost over time for each option — the one that accelerates fastest should usually go first"

   BAD stickies (too short, jargon, no context):
   - "Scoring fits backlog, not big bets"
   - "Delay cost changes over time"
   - "Use 3 scenarios, not 1 score"
   - "Make assumptions explicit up front"

If you skip synthesis, the research step is INCOMPLETE. Sources without the "so what" are useless.
CRITICAL: Carry research findings into later steps. Reference real data, real examples, real insights.

🔌 queryConnectors — INTERNAL DATA (status, metrics, decisions, trade-offs):
Step involves company projects, priorities, trade-offs, metrics, people, or decisions?
→ Call queryConnectors FIRST with ALL relevant services before creating any canvas content
→ For strategic/prioritisation analysis: query broadly — jira, salesforce, productboard, workday, looker, amplitude, slack, gong, notion, google-docs, stripe-benchmarks, github
→ Synthesize the returned data into canvas content (document, table, or stickies)
→ Reference REAL numbers, names, dates, and metrics from the connector data
→ NEVER create a document, table, or sticky with placeholder text like "(fill in)", "TBD", or generic frameworks. Every cell, every paragraph must contain real data from connectors.
Use connectors for INTERNAL company data. Use webSearch for EXTERNAL data. Both can be used together.

🏗️ ZONE FRAME EXECUTION:
When a plan step says "Deep dive: [Option Name]" or similar zone-building step:

1. Call createFrame({ name: "[Option Name]", width: 900, height: 1200 }) — note the returned ID
2. Using that frame ID as parentFrameId for ALL subsequent items in this step:
   a. createSticky × 2-3: High-level description of this option (use blue or green stickies)
   b. createLayout(type:"hierarchy" or "grid", parentFrameId: frameId): Stakeholders and teams involved
   c. createDataTable(parentFrameId: frameId) OR createSticky × 3-4: Key metrics and KPIs
   d. createDocument(parentFrameId: frameId) OR createSticky × 2-3: Insights from research data
   e. createSticker(parentFrameId: frameId) × 1-2: Visual delight (intents like "rocket", "target", "team", "chart")

ALL items in steps (b)-(e) MUST include parentFrameId from step (1).
The frame auto-resizes as you add content.
For the SECOND zone frame, the placement engine places it beside the first one automatically.

⚠️ NESTING IN FRAMES: When building zone frames, ALWAYS pass parentFrameId to nest content inside the frame.
The createFrame tool returns an ID — use it as parentFrameId in all subsequent tool calls for that zone.

⚠️ WHEN PUTTING DATA ON STICKIES — numbers need context, not just labels:
Write for a VP who knows the company but isn't tracking day-to-day details. Each sticky = 1-2 sentences.
   GOOD: "PayGrid's delay cost accelerates after week 3 — the first few weeks are cheap, but by week 4 we start losing enterprise deals to Stripe"
   GOOD: "FirstFlex delay costs $890K/week but stays flat — we can push it 4-6 weeks and recover the same users later"
   GOOD: "$47.2M in enterprise pipeline depends on PayGrid — 5 of those deals have Q3 decision deadlines we can't move"
   BAD: "PayGrid inflection: week 3"
   BAD: "FirstFlex weekly CoD: $890K"
   BAD: "Orchestration pipeline: $47.2M"
Every sticky must be a COMPLETE THOUGHT with enough context for someone who wasn't in the meeting.

🚫 NEVER CREATE EMPTY FRAMEWORKS:
- No "Option scoring (fill in)" tables — populate every cell with real data
- No generic decision rubrics — use actual project names, numbers, and trade-offs from connector data
- No placeholder recommendations — synthesize a real recommendation from the evidence
- If a step needs data you don't have, call queryConnectors to GET it before creating the artifact

POSITIONING — HANDLED AUTOMATICALLY
Positioning is handled by the canvas layout engine. Do not include x or y coordinates.

=====================================================
createLayout() REFERENCE — for stickies and diagrams only
=====================================================

FRAME NAMING:
- Use descriptive names: "Homepage sections", "Product details"
- DON'T include step numbers: "Step 2 — Homepage" ✗
- DO use clear labels: "Homepage wireframe" ✓

HIERARCHY example (org charts, principles):
createLayout({
  type: "hierarchy",
  frameName: "Design Principles",
  items: [
    { type: "shape", text: "Principle 1", color: "blue", parentIndex: -1 },
    { type: "shape", text: "Description...", color: "light-blue", parentIndex: 0 },
  ]
})

⭐ RESOURCE CONFLICT DIAGRAM — shows the SHAPE of the tension, not the details:
createLayout({
  type: "hierarchy",
  frameName: "The conflict — Platform Squad 3",
  direction: "right",
  items: [
    { type: "shape", text: "Platform Squad 3\\n5 eng · 32 pts/sprint", color: "blue", parentIndex: -1 },
    { type: "shape", text: "FirstFlex\\nSep launch · needs wks 3–6", color: "orange", parentIndex: 0 },
    { type: "shape", text: "PayGrid\\nAug 25 pilot · needs from wk 4", color: "orange", parentIndex: 0 },
  ]
})
↑ Just 3 shapes: [Squad 3] → [FirstFlex] and [Squad 3] → [PayGrid].
The shared resource is the ROOT, competing projects are CHILDREN. That's IT.

🚨 A CONFLICT DIAGRAM IS NOT A DATA DUMP:
- 3-5 shapes MAX. Show the structure of the tension, not every data point.
- The DOCUMENT (createDocument) has the detailed evidence. The diagram just shows who's pulling on what.
- If you're putting "conflict window", "operational risk", "bridging candidates", "sequencing facts" as extra shapes — STOP. Those belong in the document, not the diagram.
- Think of it as: "If an exec glances at this for 3 seconds, do they get the conflict?" If it takes more than 3 seconds, you have too many shapes.

⭐ SCENARIO COMPARISON — use this pattern for "map out options / scenarios":
createLayout({
  type: "hierarchy",
  frameName: "Three scenarios (pick one)",
  direction: "down",
  items: [
    { type: "shape", text: "Scenario A — Speed first", color: "blue", parentIndex: -1 },
    { type: "shape", text: "Ship PayGrid MVP by Aug, protect Meridian deadline", color: "blue", parentIndex: 0 },
    { type: "shape", text: "Upside: earliest revenue + deadline safe", color: "blue", parentIndex: 0 },
    { type: "shape", text: "Risk: lower peak ARR, more follow-on work", color: "blue", parentIndex: 0 },
    { type: "shape", text: "Scenario B — Impact first", color: "green", parentIndex: -1 },
    { type: "shape", text: "Full-scope FirstFlex, capture Q4 signup surge", color: "green", parentIndex: 4 },
    { type: "shape", text: "Upside: 180K signups Y1, strongest retention lift", color: "green", parentIndex: 4 },
    { type: "shape", text: "Risk: PayGrid slips, Meridian window at risk", color: "green", parentIndex: 4 },
    { type: "shape", text: "Scenario C — Sequenced hybrid", color: "violet", parentIndex: -1 },
    { type: "shape", text: "Time-box PayGrid MVP (wks 1-3), then full FirstFlex", color: "violet", parentIndex: 8 },
    { type: "shape", text: "Upside: covers both commitments", color: "violet", parentIndex: 8 },
    { type: "shape", text: "Risk: needs tight scope control, context-switch cost", color: "violet", parentIndex: 8 },
  ]
})
↑ 3 root shapes + 3 children each. Each child is ONE punchy line.

🎨 COLOR RULE FOR SCENARIOS: One scenario = one color. Parent AND all its children use the SAME color.
- Scenario A: all blue. Scenario B: all green. Scenario C: all violet.
- This makes each group instantly recognizable at a glance. DON'T mix colors within a scenario.
- The layout engine adds large gaps between root groups, so they read as 3 distinct columns.

FLOW example (processes, journeys):
createLayout({
  type: "flow",
  frameName: "Checkout Flow",
  items: [
    { type: "shape", text: "Cart", color: "blue" },
    { type: "shape", text: "Payment", color: "blue" },
    { type: "shape", text: "Done", color: "green" }
  ]
})
↑ Same process = same color (blue). Only the final state changes color (green = success).

⭐ TIMELINE example — items are SPECIFIC deliverables, not vague labels:
createLayout({
  type: "timeline",
  frameName: "Scenario A: PayGrid-First",
  timeLabels: ["Weeks 1–3", "Weeks 4–6", "Weeks 7–9", "Weeks 10–12"],
  items: [
    { type: "shape", text: "Migrate checkout flow to PayGrid API", color: "blue", column: 0 },
    { type: "shape", text: "Set up PayGrid webhook handlers + error monitoring", color: "blue", column: 0 },
    { type: "shape", text: "Run parallel processing: old + PayGrid for 2 weeks", color: "blue", column: 0 },
    { type: "shape", text: "PayGrid live for 100% of transactions", color: "blue", column: 1 },
    { type: "shape", text: "Begin FirstFlex SDK integration (auth + data sync)", color: "orange", column: 1 },
    { type: "shape", text: "FirstFlex onboarding flow + feature flag rollout", color: "orange", column: 2 },
    { type: "shape", text: "Load testing FirstFlex at scale (10k+ users)", color: "orange", column: 2 },
    { type: "shape", text: "Full launch: PayGrid + FirstFlex live", color: "green", column: 3 },
    { type: "shape", text: "Monitor adoption metrics, iterate on friction points", color: "green", column: 3 }
  ]
})
⚠️ Notice: each item says WHAT specifically happens — not just "setup" or "launch".
⚠️ Color = workstream: ALL PayGrid items = blue, ALL FirstFlex items = orange, milestones = green.
⚠️ If asked for 3 scenario timelines → call createLayout 3 TIMES, one per scenario frame.

GRID + STICKIES example (brainstorms, ideas):
createLayout({
  type: "grid",
  frameName: "Key Risks",
  items: [
    { type: "sticky", text: "Tight deadline", color: "orange" },
    { type: "sticky", text: "Need extra dev", color: "orange" },
    { type: "sticky", text: "Scope creep", color: "yellow" },
    { type: "sticky", text: "Tech debt", color: "yellow" },
  ],
  columns: 3
})
⚠️ Each sticky is 8-15 words — a complete thought, not a paragraph. NEVER put long paragraphs on stickies.

HIERARCHY example (when you need categories + details):
createLayout({
  type: "hierarchy",
  frameName: "Key Principles",
  items: [
    { type: "sticky", text: "Feedback loops", color: "blue", parentIndex: -1 },
    { type: "sticky", text: "Ship prototypes fast", color: "light-blue", parentIndex: 0 },
    { type: "sticky", text: "A/B test everything", color: "light-blue", parentIndex: 0 },
    { type: "sticky", text: "Reliability", color: "blue", parentIndex: -1 },
    { type: "sticky", text: "Automate CI/CD", color: "light-blue", parentIndex: 3 },
    { type: "sticky", text: "Monitor in prod", color: "light-blue", parentIndex: 3 },
  ]
})
↑ ALL parents = blue. ALL children = light-blue. Not random per group.

🎨 MASTER COLOR RULE: Color encodes MEANING — things that belong together get the SAME color.
Never assign colors randomly. Every color choice must answer: "What does this color MEAN here?"

CONFLICT / RESOURCE DIAGRAMS:
- Root (shared resource) = blue
- ALL competing children = SAME color (orange). They're the SAME kind of thing (competing projects).
- GOOD: [Squad 3 blue] → [FirstFlex orange] + [PayGrid orange]
- BAD: [Squad 3 blue] → [FirstFlex orange] + [PayGrid green] ← implies they're different categories, they're NOT

SCENARIO COMPARISONS:
- One scenario = one color. Parent AND all children = same color.
- Scenario A: all blue. Scenario B: all green. Scenario C: all violet.
- NEVER mix colors within a single scenario's tree.

TIMELINES:
- Color by WORKSTREAM/INITIATIVE — all items for one project = same color.
- PayGrid items = blue (all of them, every column). FirstFlex items = orange (all of them, every column).
- Shared milestones (launch, go-live) = green.
- GOOD: 4 blue PayGrid items + 3 orange FirstFlex items + 2 green milestones
- BAD: random colors per column or per item

HIERARCHY (org charts, principles):
- ALL parents = one color (e.g., blue)
- ALL children = another color (e.g., light-blue or yellow)
- NOT a different color per parent or per child

GRIDS / BRAINSTORMS:
- One category = one color. If all items are the same type, use ONE color for all.
- GOOD: 10 yellow stickies for risks
- BAD: 10 stickies each a different random color

MAX 2-3 COLORS PER FRAME. If you're reaching for a 4th color, stop and ask: "Does this color distinction actually help the reader?"`,
  tools: [
    showProgressTool,
    reviewCanvasTool,
    // checkpointTool, // disabled — re-enable when checkpoints are needed
    requestFeedbackTool,
    webSearchTool,
    queryConnectorsTool,
    // Workspace navigation tools
    createCanvasTool,
    navigateToCanvasTool,
    // Canvas creation tools
    createLayoutTool,  // PREFERRED for organized content
    createStickyTool,
    createTextTool,
    createShapeTool,
    createFrameTool,
    createArrowTool,
    createWorkingNoteTool,
    deleteItemTool,
    updateStickyTool,
    moveItemTool,
    organizeIntoFrameTool,
    createDocumentTool,
    updateDocumentTool,
    createDataTableTool,
    createStickerTool,
    createTaskCardTool,
    updateTaskCardTool,
    createGanttChartTool,
    createKanbanBoardTool,
    createSourcesTool,
  ],
});

// ============================================
// API HANDLER
// ============================================

export async function POST(req: Request) {
  try {
    await requireAuth();
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { messages, canvasState, userEdits, generateTitle, workspaceContext } = await req.json();
  console.log('[Chat API] generateTitle:', generateTitle, 'messages.length:', messages?.length);

  // Build conversation context - include tool calls so agent knows what it proposed
  type MessageWithTools = {
    role: string;
    content: string;
    toolInvocations?: Array<{ toolName: string; args: Record<string, unknown> }>;
  };

  // Find if there's an approved plan we should be executing
  let approvedPlan: { title: string; steps: string[] } | null = null;
  let approvalMessageIndex = -1;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i] as MessageWithTools;
    const planTool = msg.toolInvocations?.find(t => t.toolName === 'confirmPlan');
    if (planTool) {
      const args = planTool.args as { title: string; steps: string[]; summary: string };
      // Check if next user message is approval
      const nextMsg = messages[i + 1];
      if (nextMsg?.role === 'user' && nextMsg.content?.toLowerCase().includes('approve')) {
        approvedPlan = { title: args.title, steps: args.steps };
        approvalMessageIndex = i + 1;
      }
    }
  }

  // If there's an approved plan, use a completely different execution-only prompt
  let conversationContext = "";
  let isExecutionMode = false;

  if (approvedPlan) {
    // EXECUTION MODE: Track completed steps and continue from where we left off

    // Find completed steps by looking at showProgress("completed") and checkpoint calls
    const completedSteps: number[] = [];
    let hasCheckpoint = false;

    for (let i = approvalMessageIndex; i < messages.length; i++) {
      const msg = messages[i] as MessageWithTools;
      if (msg.toolInvocations) {
        msg.toolInvocations.forEach(t => {
          if (t.toolName === 'showProgress') {
            const args = t.args as { stepNumber: number; status: string };
            if (args.status === 'completed' && !completedSteps.includes(args.stepNumber)) {
              completedSteps.push(args.stepNumber);
            }
          }
          if (t.toolName === 'checkpoint') {
            hasCheckpoint = true;
          }
        });
      }
    }

    const nextStep = completedSteps.length > 0 ? Math.max(...completedSteps) + 1 : 1;
    const totalSteps = approvedPlan.steps.length;
    // Plan is complete if all steps marked done OR a checkpoint was called (AI wraps up)
    const isComplete = nextStep > totalSteps || hasCheckpoint;

    // If the plan is complete and the latest user message is a NEW request
    // (not "Continue" or the approval itself), exit execution mode entirely
    if (isComplete) {
      const latestUserMsg = messages[messages.length - 1];
      const isNewRequest = latestUserMsg?.role === 'user'
        && !latestUserMsg.content?.toLowerCase().includes('approve')
        && latestUserMsg.content?.toLowerCase() !== 'continue';
      if (isNewRequest) {
        approvedPlan = null;
      }
    }

    if (approvedPlan) {
      // Still in execution mode (plan not complete, or user said "Continue")
      isExecutionMode = true;

      // Build context with clear state
      conversationContext = `EXECUTION MODE - Continuing approved plan.

Plan: "${approvedPlan.title}"
${approvedPlan.steps.map((s, i) => {
  const stepNum = i + 1;
  const status = completedSteps.includes(stepNum) ? '✓ DONE' : (stepNum === nextStep ? '→ DO NOW' : '  pending');
  return `${status} Step ${stepNum}: ${s}`;
}).join('\n')}

${isComplete ? `
ALL STEPS COMPLETE!
1. Write a brief message like "All set!" or "Done!" (1-2 words max)
2. You're done — no need to pause

Keep your message VERY brief - the card shows details.
` : `
🚨 USER CLICKED "CONTINUE" - EXECUTE ALL REMAINING STEPS NOW! 🚨

START WITH STEP ${nextStep}: "${approvedPlan.steps[nextStep - 1]}"
THEN KEEP GOING through steps ${nextStep + 1 <= totalSteps ? `${nextStep + 1}...${totalSteps}` : '(none remaining)'} WITHOUT STOPPING.

🚫 DO NOT stop between steps to summarise or explain what you did.
🚫 DO NOT write "Proceeding to step X" — just DO step X.
🚫 DO NOT output text until ALL steps are finished.

DO THIS IMMEDIATELY:
1. showProgress(stepNumber, "step title", "starting")
2. Pick the RIGHT tool for this step's content:
   - Written content (brief, overview, spec, summary)? → createDocument
   - Tabular data (roles, comparison, matrix)? → createDataTable
   - Actionable work item (task, todo, action)? → createTaskCard
   - Project timeline, roadmap, phases, milestones? → createGanttChart
   - Sprint board or task tracking? → createKanbanBoard
   - Research? → webSearch + createSources + SYNTHESIZE (see below)
   - Brainstorm ideas, quick notes? → createLayout(type:"sticky")
   - Diagram, flow, hierarchy? → createLayout(type:"shape"/"hierarchy")
4. showProgress(stepNumber, "step title", "completed")
5. IMMEDIATELY start the next step — do NOT write text, just call showProgress for the next step

🚫 NEVER CREATE EMPTY CONTENT: No "(fill in)", no "TBD", no placeholder tables. Every artifact must be populated with real data from connectors/search.
⚠️ TASKS/TODOS/ACTION ITEMS: ALWAYS use createTaskCard (call it once per task). NEVER use createLayout with stickies for tasks — even for multiple tasks, call createTaskCard multiple times.

RESEARCH STEPS — THREE MANDATORY PARTS (never skip step c):
If this step involves research, do ALL THREE — not just a and b:
  a) webSearch() → get real information
  b) createSources() → display source cards
  c) 🚨 MANDATORY: createLayout(type:"sticky") → 3-4 synthesis stickies (1-2 sentences each)
     Each sticky = a COMPLETE THOUGHT an exec can understand without extra context.
     No jargon, no acronyms. Write enough that it stands alone.
     Good: "The key question isn't 'which scores higher' but 'which delay is harder to recover from later?'"
     Good: "Plot delay cost over time — the option that accelerates fastest should usually go first"
     Bad: "Scoring fits backlog, not big bets" / Bad: "Delay cost changes over time"
If you do a+b but skip c, the step is INCOMPLETE. Sources without synthesis are useless.
Then carry those insights into later steps — use real data, cite real examples.

DO NOT write explanatory text first - CALL showProgress() IMMEDIATELY!`}`;
    }
  }

  if (!approvedPlan) {
    // Normal mode: build conversation context
    // Count how many questions have already been asked
    let questionsAsked = 0;
    let lastMessageHadQuestions = false;

    messages.forEach((m: MessageWithTools, index: number) => {
      if (m.toolInvocations?.some(t => t.toolName === 'askUser')) {
        questionsAsked++;
        // Check if this was the last assistant message
        if (index === messages.length - 1 && m.role === 'assistant') {
          lastMessageHadQuestions = true;
        }
      }
    });

    conversationContext = messages
      .map((m: MessageWithTools) => {
        let text = `${m.role}: ${m.content}`;

        // Include confirmPlan details
        const planTool = m.toolInvocations?.find(t => t.toolName === 'confirmPlan');
        if (planTool) {
          const args = planTool.args as { title: string; steps: string[]; summary: string };
          text += `\n[PROPOSED PLAN: "${args.title}" - Steps: ${args.steps.join(', ')}]`;
        }

        return text;
      })
      .join("\n");

    // Guard against calling askUser() twice
    if (questionsAsked >= 1 && !lastMessageHadQuestions) {
      conversationContext += `\n\n🛑 YOU ALREADY ASKED QUESTIONS. DO NOT call askUser() again. Call confirmPlan() NOW or just reply with text.`;
    }

    // Guard against calling confirmPlan() immediately after askUser()
    if (lastMessageHadQuestions) {
      conversationContext += `\n\n🚨 YOU JUST ASKED QUESTIONS IN YOUR LAST MESSAGE. STOP AND WAIT FOR USER'S ANSWERS. DO NOT call confirmPlan() yet — the user needs to respond to your questions first!`;
    }
  }

  // Include canvas state if provided (structured format with frames, orphans, arrows)
  type ShapeInfo = {
    id: string;
    type: string;
    text?: string;
    color?: string;
    name?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    createdBy: string;
  };
  type FrameInfo = ShapeInfo & { children: ShapeInfo[]; arrows: ShapeInfo[] };
  type StructuredCanvas = { frames: FrameInfo[]; orphans: ShapeInfo[]; arrows: ShapeInfo[]; focusedShapeId?: string | null };

  const canvas = canvasState as StructuredCanvas | undefined;
  const hasContent = canvas && (canvas.frames.length > 0 || canvas.orphans.length > 0);

  if (hasContent) {
    // Calculate bounding box across all shapes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const updateBounds = (s: ShapeInfo) => {
      minX = Math.min(minX, s.x);
      minY = Math.min(minY, s.y);
      maxX = Math.max(maxX, s.x + s.width);
      maxY = Math.max(maxY, s.y + s.height);
    };
    canvas.frames.forEach(f => { updateBounds(f); f.children.forEach(updateBounds); });
    canvas.orphans.forEach(updateBounds);

    // Build hierarchical description
    const tag = (s: ShapeInfo) => s.createdBy === "ai" ? "AI" : "user";
    const shapeDesc = (s: ShapeInfo) =>
      `    - [ID: ${s.id}] "${s.text?.slice(0, 50) || 'no text'}" (${s.type}, ${s.color || 'default'}, ${tag(s)})`;

    let canvasDescription = "";

    canvas.frames.forEach(frame => {
      canvasDescription += `\n  Frame "${frame.name || 'Untitled'}" (${tag(frame)}):`;
      frame.children.forEach(child => {
        canvasDescription += `\n${shapeDesc(child)}`;
      });
      if (frame.arrows.length > 0) {
        canvasDescription += `\n    Connections: ${frame.arrows.length} arrows`;
      }
    });

    if (canvas.orphans.length > 0) {
      canvasDescription += `\n  Loose items (not in any frame):`;
      canvas.orphans.forEach(s => {
        canvasDescription += `\n${shapeDesc(s)}`;
      });
    }

    const totalItems = canvas.frames.reduce((n, f) => n + 1 + f.children.length + f.arrows.length, 0)
      + canvas.orphans.length + canvas.arrows.length;

    conversationContext += `

[CANVAS STATE - ${totalItems} items already on canvas]
⚠️ THESE ITEMS ALREADY EXIST! Use their IDs with moveItem() if user asks to rearrange.

OCCUPIED AREA: x=${Math.round(minX)} to ${Math.round(maxX)}, y=${Math.round(minY)} to ${Math.round(maxY)}

⚠️ If adding NEW content, start here (pick one):
  → RIGHT SIDE: x=${Math.round(maxX + 100)}, y=${Math.round(minY)} (creates columns)
  → BELOW: x=${Math.round(minX)}, y=${Math.round(maxY + 100)} (creates rows)

EXISTING ITEMS (use these IDs with moveItem):
${canvasDescription}${canvas.focusedShapeId ? `

🔍 FOCUS MODE ACTIVE — The user is viewing item [ID: ${canvas.focusedShapeId}] in full-screen focus mode.
When the user says "add a column", "change X", "update this", etc., they mean THIS focused item.
Only target a different item if the user EXPLICITLY names another one.` : ""}`;
  } else {
    conversationContext += `

[CANVAS STATE - Empty]
Canvas is empty. Start placing content at (0, 0).`;
  }

  // Include workspace context
  type WorkspaceContext = {
    currentSurface: string;
    canvasId?: string;
    spaceId?: string;
    availableSpaces: Array<{ id: string; name: string }>;
    availableCanvases: Array<{ id: string; name: string; spaceId: string }>;
  };

  const workspace = workspaceContext as WorkspaceContext | undefined;
  if (workspace) {
    conversationContext += `

[WORKSPACE CONTEXT]
Current surface: ${workspace.currentSurface}${workspace.canvasId ? ` (canvas: ${workspace.canvasId})` : ''}${workspace.spaceId ? ` (space: ${workspace.spaceId})` : ''}

Available spaces:
${workspace.availableSpaces.map(s => `  - ${s.name} [ID: ${s.id}]`).join('\n') || '  (none)'}

Available canvases:
${workspace.availableCanvases.map(c => `  - "${c.name}" [ID: ${c.id}]${c.spaceId ? ` in space ${c.spaceId}` : ' (unassigned)'}`).join('\n') || '  (none)'}`;
  }

  // Include user edits and additions
  type UserEdit = { shapeId: string; field: string; oldValue: string; newValue: string };
  const edits = (userEdits as UserEdit[] | undefined) || [];
  if (edits.length > 0) {
    const additions = edits.filter(e => e.field === "added");
    const deletions = edits.filter(e => e.field === "deleted");
    const moves = edits.filter(e => e.field === "moved");
    const textChanges = edits.filter(e => e.field === "text");
    const colorChanges = edits.filter(e => e.field === "color");

    if (additions.length > 0) {
      conversationContext += `\n\n[USER ADDED:]`;
      additions.forEach(edit => {
        conversationContext += `\n  - ${edit.newValue}`;
      });
    }

    if (deletions.length > 0) {
      conversationContext += `\n\n[USER DELETED:]`;
      deletions.forEach(edit => {
        conversationContext += `\n  - "${edit.oldValue}"`;
      });
    }

    if (textChanges.length > 0) {
      conversationContext += `\n\n[USER EDITED TEXT:]`;
      textChanges.forEach(edit => {
        conversationContext += `\n  - "${edit.oldValue}" → "${edit.newValue}"`;
      });
    }

    if (colorChanges.length > 0) {
      conversationContext += `\n\n[USER CHANGED COLORS:]`;
      colorChanges.forEach(edit => {
        conversationContext += `\n  - ${edit.oldValue} → ${edit.newValue}`;
      });
    }

    if (moves.length > 0) {
      conversationContext += `\n\n[USER MOVED ${moves.length} item(s)]`;
    }

    conversationContext += `\nAcknowledge these changes naturally if relevant.`;
  }

  const prompt = isExecutionMode
    ? conversationContext  // Execution mode: just the execution instructions
    : `Conversation so far:\n${conversationContext}\n\nRespond to the latest user message.`;


  try {
    // Use execution agent when plan is approved (no confirmPlan tool available)
    const agent = isExecutionMode ? executionAgent : planningAgent;
    const result = await run(agent, prompt, { stream: true, maxTurns: 50 });

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const toolCalls: ToolCall[] = [];
        const callIdToToolName = new Map<string, string>();
        let pendingCreateCanvas = false;
        let textContent = "";
        let controllerClosed = false;

        // Streaming tool call accumulators — keyed by itemId (fc_xxx from raw events)
        const streamingAccumulators = new Map<string, {
          toolName: string;
          extractor: IncrementalItemExtractor;
          callId: string;  // The call_xxx ID used by Agents SDK tool_call_item
        }>();
        const streamedCallIds = new Set<string>(); // call_xxx IDs that were streamed

        const safeEnqueue = (chunk: Uint8Array) => {
          if (!controllerClosed) {
            try {
              controller.enqueue(chunk);
            } catch {
              controllerClosed = true;
            }
          }
        };

        try {
          let sentTextLength = 0;
          let suppressText = false; // Flag to suppress malformed tool call text

          // Deduplication: OpenAI Agents SDK runs the model multiple times
          // (text → tool call → text). Each response repeats the previous text
          // as a prefix, then adds new content. We skip the repeated prefix.
          let alreadySentLength = 0;   // text length we already sent to client
          let responseAccum = "";       // text accumulated in current response

          /** Send a text delta to the client, with dedup + malformed-tool checks */
          const sendTextDelta = (delta: string) => {
            responseAccum += delta;

            // Still catching up to what we already sent? Skip this delta.
            if (responseAccum.length <= alreadySentLength) {
              return;
            }

            // This delta crosses the boundary — send only the new portion
            let toSend = delta;
            const overlap = alreadySentLength - (responseAccum.length - delta.length);
            if (overlap > 0) {
              toSend = delta.slice(overlap);
            }

            if (!toSend) return;

            textContent += toSend;

            // Detect malformed tool calls output as text (model bug)
            if (textContent.includes('<functions.') || textContent.includes('functions.askUser') || textContent.includes('functions.confirmPlan')) {
              suppressText = true;
              console.warn('[STREAM] Detected malformed tool call in text output — suppressing');
            }

            if (!suppressText) {
              safeEnqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "text", content: toSend })}\n\n`)
              );
            }
            sentTextLength = textContent.length;
          };

          for await (const event of result) {
            // Handle streaming text deltas
            if (event.type === "raw_model_stream_event") {
              const data = event.data as Record<string, unknown>;

              // Track response boundaries for deduplication
              if (data.type === "response_started" && textContent.length > 0) {
                // New model turn — the model will repeat previous text as prefix
                alreadySentLength = textContent.length;
                responseAccum = "";
              }

              // Handle output_text_delta (OpenAI Agents format)
              if (data.type === "output_text_delta") {
                const delta = data.delta as string;
                if (delta) sendTextDelta(delta);
              }

              // Handle response.output_text.delta (fallback)
              else if (data.type === "response.output_text.delta") {
                const delta = data.delta as string;
                if (delta) sendTextDelta(delta);
              }

              // Handle content_block_delta (fallback)
              else if (data.type === "content_block_delta") {
                const deltaData = data.delta as Record<string, unknown>;
                if (deltaData?.type === "text_delta") {
                  const delta = deltaData.text as string;
                  if (delta) sendTextDelta(delta);
                }
              }

              // STREAMING TOOL CALLS — Responses API events inside "model" wrapper
              // The Agents SDK wraps raw OpenAI events as data.type === "model"
              // with the actual Responses API event in data.event:
              //   data.event.type === "response.output_item.added"  → tool call starts
              //   data.event.type === "response.function_call_arguments.delta" → partial args
              if (data.type === "model") {
                const rawEvent = data.event as Record<string, unknown>;
                const rawType = rawEvent?.type as string;

                // Tool call started
                if (rawType === "response.output_item.added") {
                  const item = rawEvent.item as Record<string, unknown>;
                  if (item?.type === "function_call") {
                    const toolName = item.name as string;
                    const itemId = item.id as string;      // fc_xxx — referenced by delta events
                    const callId = item.call_id as string;  // call_xxx — used by Agents SDK tool_call_item
                    if (toolName && itemId && STREAMING_TOOLS[toolName]) {
                      // console.log(`[STREAM] Tool call started: ${toolName}`);
                      streamingAccumulators.set(itemId, {
                        toolName,
                        extractor: new IncrementalItemExtractor(toolName),
                        callId: callId || itemId,
                      });
                      if (callId) {
                        callIdToToolName.set(callId, toolName);
                        streamedCallIds.add(callId);
                      }
                      // Emit start immediately — Canvas creates the container shape
                      safeEnqueue(
                        encoder.encode(`data: ${JSON.stringify({
                          type: "tool_streaming_start",
                          toolName,
                          callId: callId || itemId,
                          partialArgs: {},
                        })}\n\n`)
                      );
                    }
                  }
                }

                // Partial function arguments — item_id is the fc_xxx ID
                if (rawType === "response.function_call_arguments.delta") {
                  const itemId = rawEvent.item_id as string;
                  const argDelta = rawEvent.delta as string;
                  const acc = itemId ? streamingAccumulators.get(itemId) : undefined;

                  if (acc && argDelta) {
                    const extractResult = acc.extractor.feed(argDelta);
                    const clientCallId = acc.callId;

                    // Forward newly-extracted scalars
                    if (Object.keys(extractResult.scalars).length > 0) {
                      safeEnqueue(
                        encoder.encode(`data: ${JSON.stringify({
                          type: "tool_streaming_scalars",
                          callId: clientCallId,
                          scalars: extractResult.scalars,
                        })}\n\n`)
                      );
                    }

                    // Emit item for each completed array item
                    for (const { index, item } of extractResult.newItems) {
                      // console.log(`[STREAM] Emitting item #${index}`);
                      safeEnqueue(
                        encoder.encode(`data: ${JSON.stringify({
                          type: "tool_streaming_item",
                          callId: clientCallId,
                          item,
                          index,
                        })}\n\n`)
                      );
                    }

                    // Emit content progress for documents
                    if (extractResult.contentSoFar) {
                      safeEnqueue(
                        encoder.encode(`data: ${JSON.stringify({
                          type: "tool_streaming_content",
                          callId: clientCallId,
                          content: extractResult.contentSoFar,
                        })}\n\n`)
                      );
                    }
                  }
                }
              }
            }

            // Handle text_delta events directly (fallback)
            else if ((event.type as string) === "text_delta" || (event.type as string) === "response.text.delta") {
              const delta = (event as { delta?: string }).delta || (event as { text?: string }).text;
              if (delta) sendTextDelta(delta);
            }

            // Handle run item events (tool calls)
            if (event.type === "run_item_stream_event") {
              const item = event.item as unknown as Record<string, unknown>;

              // Final message output — text was already sent via deltas above,
              // so we only update textContent for bookkeeping (no re-send).
              if (item.type === "message_output_item") {
                const rawItem = item.rawItem as Record<string, unknown>;
                const content = rawItem?.content as Array<{ type: string; text?: string }>;
                if (content) {
                  for (const block of content) {
                    if (block.type === "output_text" && block.text) {
                      textContent = block.text;
                      sentTextLength = textContent.length;
                    }
                  }
                }
              }

              // Handle tool calls
              if (item.type === "tool_call_item") {
                const rawItem = item.rawItem as Record<string, unknown>;
                const toolName = rawItem?.name as string;
                const rawArgs = rawItem?.arguments as string;
                // Agents SDK uses camelCase callId (not snake_case call_id)
                const callId = (rawItem?.callId || rawItem?.call_id) as string;

                // Track callId → toolName for matching output items
                if (callId && toolName) {
                  callIdToToolName.set(callId, toolName);
                }
                if (toolName === "createCanvas") {
                  pendingCreateCanvas = true;
                }

                if (toolName && rawArgs) {
                  try {
                    const args = JSON.parse(rawArgs);
                    toolCalls.push({ toolName, args });

                    // If this call was streamed, send _streaming_done instead of normal tool event
                    if (callId && streamedCallIds.has(callId)) {
                      streamingAccumulators.delete(callId);
                      safeEnqueue(
                        encoder.encode(`data: ${JSON.stringify({
                          type: "tool_streaming_done",
                          callId,
                          toolName,
                          args,
                        })}\n\n`)
                      );
                    } else {
                      safeEnqueue(
                        encoder.encode(`data: ${JSON.stringify({ type: "tool", toolName, args })}\n\n`)
                      );
                    }
                  } catch {
                    // Skip malformed
                  }
                }
              }

              // Handle tool call outputs (separate event type from Agents SDK)
              if (item.type === "tool_call_output_item") {
                const rawItem = item.rawItem as Record<string, unknown>;
                // Agents SDK uses camelCase callId and includes name on output items
                const callId = (rawItem?.callId || rawItem?.call_id) as string;
                const outputItemName = rawItem?.name as string;
                const rawOutput = rawItem?.output as Record<string, unknown> | string | undefined;

                // Unwrap Agents SDK output wrapper: {type: "text", text: "{...}"}
                let outputString: string | undefined;
                if (typeof rawOutput === "string") {
                  outputString = rawOutput;
                } else if (rawOutput && typeof rawOutput === "object" && rawOutput.type === "text" && typeof rawOutput.text === "string") {
                  outputString = rawOutput.text;
                }

                // Match createCanvas by: direct name, callId lookup, or pending flag
                const matchedToolName = outputItemName || callIdToToolName.get(callId || "");
                let isCreateCanvas = matchedToolName === "createCanvas";

                if (!isCreateCanvas && pendingCreateCanvas && outputString) {
                  try {
                    const parsed = JSON.parse(outputString);
                    if (parsed && typeof parsed === "object" && "canvasId" in parsed) {
                      isCreateCanvas = true;
                    }
                  } catch {}
                }

                if (isCreateCanvas && outputString) {
                  pendingCreateCanvas = false;
                  try {
                    const result = JSON.parse(outputString);
                    safeEnqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: "tool_result", toolName: "createCanvas", result })}\n\n`)
                    );
                  } catch {}
                }
              }
            }
          }

          // Generate title if requested (first response in a new chat from home)
          let chatTitle: string | null = null;
          if (generateTitle && messages.length >= 1) {
            console.log('[Chat API] Generating title...');
            const firstUserMsg = messages.find((m: { role: string }) => m.role === "user");
            if (firstUserMsg?.content) {
              console.log('[Chat API] First user message:', firstUserMsg.content.substring(0, 50));
              // Quick title generation with GPT-4o-mini
              try {
                const titleResponse = await fetch("https://api.openai.com/v1/chat/completions", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                  },
                  body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                      {
                        role: "system",
                        content: "Generate a concise, descriptive chat title (max 50 chars) based on the user's message. Return ONLY the title, no quotes or explanation.",
                      },
                      {
                        role: "user",
                        content: firstUserMsg.content,
                      },
                    ],
                    max_tokens: 20,
                  }),
                });

                if (titleResponse.ok) {
                  const titleData = await titleResponse.json();
                  chatTitle = titleData.choices?.[0]?.message?.content?.trim() || null;
                  console.log('[Chat API] Generated title:', chatTitle);
                } else {
                  console.error('[Chat API] Title API failed:', titleResponse.status);
                }
              } catch (err) {
                console.error("[Chat API] Title generation failed:", err);
              }
            }
          }

          // Send done event
          safeEnqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "done", text: textContent, toolCalls, chatTitle })}\n\n`)
          );
        } catch (err) {
          console.error("Stream error:", err);
          safeEnqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error", message: String(err) })}\n\n`)
          );
        }

        if (!controllerClosed) {
          controller.close();
          controllerClosed = true;
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Agent error:", error);
    return new Response(JSON.stringify({ error: "Agent execution failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
