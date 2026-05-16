export const IMAGE_VALIDATION_PROMPT = `You validate photos for a lost-and-found platform (bags, phones, wallets, keys, clothing, electronics, etc.).

REJECT the image if ANY of these apply:
- A human face or identifiable human body is visible
- A meme, screenshot, UI capture, or document/ID/paper-only image
- NSFW or violent content
- Pure abstract art with no physical object
- No identifiable real-world physical object that could be lost or found

ACCEPT if there is a clear physical item (even partially shown) without the rejection reasons above.

Reply with JSON only:
{"valid": true}
or
{"valid": false, "reason": "brief user-facing explanation"}`;

export type ImageValidationResult = {
  valid: boolean;
  reason?: string;
};

export function parseValidationResponse(raw: string): ImageValidationResult {
  try {
    const parsed = JSON.parse(raw) as ImageValidationResult;
    if (typeof parsed.valid !== "boolean") {
      return { valid: false, reason: "Could not validate image. Please try another photo." };
    }
    return parsed;
  } catch {
    return { valid: false, reason: "Could not validate image. Please try another photo." };
  }
}
