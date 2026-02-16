/**
 * Shared utilities for canvas operations.
 */

/**
 * Generate an AI emoji from a board title and persist it to the canvas.
 * Returns the generated image data URL, or null on failure.
 */
export async function generateAndSetEmoji(
  canvasId: string,
  title: string
): Promise<string | null> {
  try {
    const res = await fetch("/api/emoji/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: title }),
    });
    if (!res.ok) return null;
    const { imageUrl } = await res.json();

    // Persist the new emoji
    await fetch(`/api/canvases/${canvasId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji: imageUrl }),
    });

    return imageUrl;
  } catch (err) {
    console.error("Failed to generate emoji:", err);
    return null;
  }
}
