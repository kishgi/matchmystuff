export const IMAGE_VALIDATION_PROMPT = `Validate this photo for a lost-and-found app. Accept only clear photos of real physical items: shoes, bags, phones, wallets, keys, watches, electronics, clothing, documents, accessories, everyday objects.

Reject: selfies, portraits, humans-only, anime/cartoon, memes, screenshots, landscapes, fantasy/AI art, NSFW, animals-only, blurry/unclear, no clear physical item.

JSON only:
{"valid":true,"itemType":"","category":"","color":"","description":"max 40 words"}
or
{"valid":false,"reason":"short reason"}`;

export type ImageValidationResult = {
  valid: boolean;
  reason?: string;
  itemType?: string;
  category?: string;
  color?: string;
  description?: string;
};

export const IMAGE_VALIDATION_ERROR =
  "Please upload a clear photo of the lost or found item.";

export function parseValidationResponse(raw: string): ImageValidationResult {
  try {
    const parsed = JSON.parse(raw) as ImageValidationResult;
    if (typeof parsed.valid !== "boolean") {
      return { valid: false, reason: IMAGE_VALIDATION_ERROR };
    }
    return parsed;
  } catch {
    return { valid: false, reason: IMAGE_VALIDATION_ERROR };
  }
}

export function buildAiDescriptionFromValidation(
  result: ImageValidationResult,
): string {
  if (!result.valid) return "";
  const parts = [
    result.itemType,
    result.category,
    result.color,
    result.description,
  ].filter((p) => p && String(p).trim());
  return parts.join(". ").trim();
}
