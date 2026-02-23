/**
 * Incremental JSON parser for streaming tool call arguments.
 *
 * As the model generates a tool call like:
 *   createLayout({type:"grid", frameName:"Ideas", items:[{text:"A"},{text:"B"}]})
 *
 * The server receives partial JSON via `response.function_call_arguments.delta`.
 * This class accumulates the partial string and extracts:
 *   1. Scalar fields early (frameName, columns, title, type, etc.)
 *   2. Complete array items as they close (each {...} in the items/rows array)
 *
 * Used by both the chat server (route.ts) and voice client (useRealtimeVoice.ts).
 */

/** Which tools support streaming, and what their array field is called */
export const STREAMING_TOOLS: Record<string, { arrayField: string; contentField?: string }> = {
  createLayout: { arrayField: "items" },
  createDocument: { arrayField: "", contentField: "content" },
};

export type ExtractedScalars = Record<string, unknown>;

export interface ExtractedItem {
  index: number;
  item: Record<string, unknown>;
}

export interface ExtractionResult {
  /** Scalar fields extracted so far (type, frameName, columns, title, etc.) */
  scalars: ExtractedScalars;
  /** Newly completed array items since last call */
  newItems: ExtractedItem[];
  /** For document content field: the current accumulated content string */
  contentSoFar?: string;
}

export class IncrementalItemExtractor {
  private accumulated = "";
  private emittedItemCount = 0;
  private toolName: string;
  private arrayField: string;
  private contentField?: string;
  private lastScalars: ExtractedScalars = {};
  private lastContentEmitLength = 0;

  constructor(toolName: string) {
    this.toolName = toolName;
    const config = STREAMING_TOOLS[toolName];
    this.arrayField = config?.arrayField || "items";
    this.contentField = config?.contentField;
  }

  /** Append a delta string and extract any newly completed data */
  feed(delta: string): ExtractionResult {
    this.accumulated += delta;
    return this.extract();
  }

  /** Get the full accumulated string (for final parse fallback) */
  getAccumulated(): string {
    return this.accumulated;
  }

  private extract(): ExtractionResult {
    const result: ExtractionResult = {
      scalars: {},
      newItems: [],
    };

    // Try to extract scalar fields from the partial JSON
    this.extractScalars(result);

    // Extract complete array items if this tool has an array field
    if (this.arrayField) {
      this.extractArrayItems(result);
    }

    // Extract content string progress if this tool has a content field
    if (this.contentField) {
      this.extractContent(result);
    }

    return result;
  }

  /**
   * Extract scalar fields (strings, numbers, booleans) from partial JSON.
   * Uses regex to find completed key-value pairs.
   * Skips long values (>200 chars) which are likely content fields, not scalars.
   */
  private extractScalars(result: ExtractionResult): void {
    // Only scan the portion BEFORE the array field starts — otherwise
    // item-level fields like "type":"sticky" override top-level "type":"grid"
    let s = this.accumulated;
    if (this.arrayField) {
      const arrayStart = s.indexOf(`"${this.arrayField}":`);
      if (arrayStart !== -1) {
        s = s.slice(0, arrayStart);
      }
    }

    // Extract string values: "key":"value" or "key": "value"
    // Use a non-greedy approach and limit value length
    const stringPattern = /"(\w+)"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
    let match;
    while ((match = stringPattern.exec(s)) !== null) {
      const [, key, value] = match;
      // Skip array/content fields and item-level fields
      if (key === this.arrayField || key === this.contentField) continue;
      if (key === "text" || key === "color" || key === "parentIndex" || key === "column") continue;
      // Skip long values — those are content, not scalars
      if (value.length > 200) continue;
      if (this.lastScalars[key] !== value) {
        result.scalars[key] = value;
        this.lastScalars[key] = value;
      }
    }

    // Extract number values: "key":123
    const numberPattern = /"(\w+)"\s*:\s*(-?\d+(?:\.\d+)?)/g;
    while ((match = numberPattern.exec(s)) !== null) {
      const [, key, value] = match;
      if (key === "parentIndex" || key === "column" || key === "index") continue;
      const num = parseFloat(value);
      if (this.lastScalars[key] !== num) {
        result.scalars[key] = num;
        this.lastScalars[key] = num;
      }
    }

    // Extract array-of-strings values like "columns":["A","B","C"]
    const arrayPattern = /"(\w+)"\s*:\s*\[([^\]]*)\]/g;
    while ((match = arrayPattern.exec(s)) !== null) {
      const [, key, inner] = match;
      if (key === this.arrayField) continue; // Skip the main streaming array
      // Only extract if it looks like a string array
      if (inner.includes('"')) {
        try {
          const parsed = JSON.parse(`[${inner}]`);
          if (Array.isArray(parsed) && parsed.every(v => typeof v === "string")) {
            const serialized = JSON.stringify(parsed);
            if (this.lastScalars[key + "_ser"] !== serialized) {
              result.scalars[key] = parsed;
              this.lastScalars[key + "_ser"] = serialized;
            }
          }
        } catch {
          // Incomplete array, skip
        }
      }
    }
  }

  /**
   * Find complete objects in the target array using brace-counting.
   * String-aware: doesn't count braces inside JSON strings.
   */
  private extractArrayItems(result: ExtractionResult): void {
    const s = this.accumulated;

    // Find the start of the array: "items":[  or "rows":[
    const arrayStart = s.indexOf(`"${this.arrayField}":`);
    if (arrayStart === -1) return;

    // Find the opening bracket
    const bracketPos = s.indexOf("[", arrayStart);
    if (bracketPos === -1) return;

    // Walk through the string finding complete objects
    let pos = bracketPos + 1;
    let itemsFound = 0;

    while (pos < s.length) {
      // Skip whitespace and commas
      while (pos < s.length && (s[pos] === " " || s[pos] === "\n" || s[pos] === "\r" || s[pos] === "\t" || s[pos] === ",")) {
        pos++;
      }

      if (pos >= s.length || s[pos] === "]") break;

      // For rows array (string[][]), handle inner arrays: [...]
      if (s[pos] === "[") {
        const end = this.findMatchingBracket(s, pos);
        if (end === -1) break; // Incomplete

        if (itemsFound >= this.emittedItemCount) {
          try {
            const itemStr = s.slice(pos, end + 1);
            const parsed = JSON.parse(itemStr);
            result.newItems.push({ index: itemsFound, item: parsed });
          } catch {
            // Malformed, skip
          }
        }
        itemsFound++;
        pos = end + 1;
        continue;
      }

      // For items array (object[]), handle objects: {...}
      if (s[pos] === "{") {
        const end = this.findMatchingBrace(s, pos);
        if (end === -1) break; // Incomplete

        if (itemsFound >= this.emittedItemCount) {
          try {
            const itemStr = s.slice(pos, end + 1);
            const parsed = JSON.parse(itemStr);
            result.newItems.push({ index: itemsFound, item: parsed });
          } catch {
            // Malformed, skip
          }
        }
        itemsFound++;
        pos = end + 1;
        continue;
      }

      // Unexpected character — skip it
      pos++;
    }

    this.emittedItemCount += result.newItems.length;
  }

  /** Find matching closing brace, respecting strings */
  private findMatchingBrace(s: string, start: number): number {
    let depth = 0;
    let inString = false;
    let escape = false;

    for (let i = start; i < s.length; i++) {
      const ch = s[i];

      if (escape) {
        escape = false;
        continue;
      }

      if (ch === "\\") {
        escape = true;
        continue;
      }

      if (ch === '"') {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (ch === "{") depth++;
      if (ch === "}") {
        depth--;
        if (depth === 0) return i;
      }
    }

    return -1; // Not yet complete
  }

  /** Find matching closing bracket, respecting strings */
  private findMatchingBracket(s: string, start: number): number {
    let depth = 0;
    let inString = false;
    let escape = false;

    for (let i = start; i < s.length; i++) {
      const ch = s[i];

      if (escape) {
        escape = false;
        continue;
      }

      if (ch === "\\") {
        escape = true;
        continue;
      }

      if (ch === '"') {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (ch === "[") depth++;
      if (ch === "]") {
        depth--;
        if (depth === 0) return i;
      }
    }

    return -1; // Not yet complete
  }

  /**
   * Extract progressive content string for documents.
   * Finds "content":"..." and returns content as it grows.
   * Emits at HTML tag boundaries for cleaner rendering.
   */
  private extractContent(result: ExtractionResult): void {
    if (!this.contentField) return;

    const s = this.accumulated;
    const fieldStart = s.indexOf(`"${this.contentField}":`);
    if (fieldStart === -1) return;

    // Find opening quote of the value
    const quoteStart = s.indexOf('"', fieldStart + this.contentField.length + 3);
    if (quoteStart === -1) return;

    // Walk forward to find how much content we have, respecting escapes
    let content = "";
    let i = quoteStart + 1;
    while (i < s.length) {
      if (s[i] === "\\" && i + 1 < s.length) {
        // Handle escape sequences
        const next = s[i + 1];
        if (next === "n") content += "\n";
        else if (next === "t") content += "\t";
        else if (next === '"') content += '"';
        else if (next === "\\") content += "\\";
        else content += next;
        i += 2;
        continue;
      }
      if (s[i] === '"') {
        // End of string
        break;
      }
      content += s[i];
      i++;
    }

    // Emit if we have meaningfully more content than last time
    if (content.length > this.lastContentEmitLength + 20) {
      // Try to find the last clean HTML tag boundary for nicer rendering
      const lastTagEnd = content.lastIndexOf(">");
      if (lastTagEnd > this.lastContentEmitLength) {
        result.contentSoFar = content.slice(0, lastTagEnd + 1);
      } else {
        // No tag boundary? Just emit what we have
        result.contentSoFar = content;
      }

      if (result.contentSoFar && result.contentSoFar.length > this.lastContentEmitLength) {
        this.lastContentEmitLength = result.contentSoFar.length;
      } else {
        result.contentSoFar = undefined; // Don't emit if we didn't advance
      }
    }
  }
}
