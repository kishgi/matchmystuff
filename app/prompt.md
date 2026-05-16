Before implementing, scan the full codebase to understand current messaging/notification implementation, Convex schema, and navbar structure. Do NOT break existing functionality.

Task: redesign messaging UI/UX.

Goal:
Move messaging from navbar text/link into a persistent bottom-right chat icon across all pages.

UI changes:

* Remove current "Messages" from navbar (or hide it)
* Add floating chat icon (bottom-right, fixed position)
* Icon visible on all authenticated pages
* Use existing brand styling (no new design system)

On click:

* Open a small chat popup/modal (not full page)
* Right-side or bottom-right chat drawer style
* Should show:

  1. list of matched users / chats
  2. click chat opens conversation view inside same popup
* include basic close button

Functionality:

* MUST reuse existing matches/messaging data (Convex)
* Do NOT rebuild backend unless necessary
* Keep real-time updates if already supported
* Ensure chat only between matched users

Constraints:

* No changes to auth, posts, AI, or matching logic
* Only UI + minimal wiring changes
* Keep implementation lightweight

UX:

* should feel like Messenger/WhatsApp mini widget
* fast open/close
* non-intrusive
* always accessible

First step: analyze current messaging implementation before coding.