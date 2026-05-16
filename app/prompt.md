Scan the full codebase first — understand the existing post creation flow, 
Convex actions/mutations, schema, and frontend upload components before making any changes.

Then implement these 3 features:

---

1. IMAGE VALIDATION
Before processing any uploaded image, validate it via GPT-4o vision.
Reject if: human face/body visible, meme, screenshot, document, NSFW, 
abstract art, or no identifiable real-world physical object (bag, phone, 
wallet, keys, clothing, etc).
Return JSON { valid: boolean, reason?: string }.
If invalid — store the rejection reason on the post record and stop processing.
Surface the rejection reason to the user on the frontend clearly.
Reuse whatever OpenAI client instance already exists in the codebase.

---

2. IMAGE EDIT BEFORE UPLOAD
After a user selects an image but before they submit the form, show an 
inline editor with: crop and rotate (left/right).
User confirms the edit, then the edited version is what gets uploaded.
Plug into whatever upload flow and storage pattern already exists.

---

3. NO-IMAGE MATCHING (description-only path)
Make image optional. If no image is provided, still generate an embedding 
from title + description + location and run the full matching pipeline.
On the frontend, offer two clear modes on the post creation form:
  - "I have a photo" (existing flow + image editor from above)
  - "Describe it instead" (title, description, location only — with a hint 
    to be as detailed as possible for better matches)
Do not change the match threshold — text-only posts will naturally score 
lower, which is acceptable.

---

Rules:
- Read existing files before editing. Do not duplicate logic that already exists.
- Match the current code style, naming conventions, and patterns throughout.
- Minimal schema changes — only add fields that are strictly necessary.
- No new dependencies unless unavoidable; prefer what is already installed.