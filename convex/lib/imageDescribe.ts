/** Dedicated vision description for matching — separate from validation JSON. */

export const IMAGE_DESCRIBE_PROMPT = `You are analyzing a photo for a lost-and-found app. Describe ONLY what is clearly visible in the image.

Write one detailed paragraph (no bullet points) covering:
- Exact object type and subtype (e.g. "black leather bi-fold wallet", not just "wallet")
- Primary and secondary colors, patterns, prints, logos, or brand text if readable
- Material, texture, size impression, shape, and style
- Condition: wear, scratches, stains, dents, cracks, missing parts
- Distinctive features: straps, zippers, buttons, wheels, tags, stickers, keychains, serial labels, unique marks
- What category of item it is (electronics, bag, clothing, keys, document, etc.)

Rules:
- Do not guess brand, model, or details you cannot see.
- Ignore busy backgrounds unless they help locate the item.
- Do not mention people, faces, or that this is a photo.
- Maximum 120 words.`;

export type ImageDescribeContext = {
  title?: string;
  description?: string;
};

export function buildDescribeUserMessage(
  imageUrl: string,
  context?: ImageDescribeContext,
): {
  role: "user";
  content: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string; detail: "high" } }
  >;
} {
  let text = IMAGE_DESCRIBE_PROMPT;
  const title = context?.title?.trim();
  const description = context?.description?.trim();
  if (title || description) {
    text += `\n\nPoster context (use only to disambiguate; the image is the source of truth):`;
    if (title) text += `\nTitle: ${title}`;
    if (description) text += `\nUser notes: ${description}`;
  }

  return {
    role: "user",
    content: [
      { type: "text", text },
      { type: "image_url", image_url: { url: imageUrl, detail: "high" } },
    ],
  };
}
