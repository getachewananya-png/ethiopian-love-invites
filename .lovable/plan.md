# Ethiopian Wedding Invitation Studio

## Goal
Build a polished, bilingual invitation studio where visitors can explore three distinct Ethiopian wedding designs, customize one without an account, upload photos, publish it, and share a public invitation link.

## Experience
- Replace the placeholder homepage with a premium editorial experience, English/Amharic switching, immersive template showcases, process and benefits sections, Ethiopian wedding support, and a strong final call to action.
- Create exactly three visually distinct invitation systems: Royal Tewahedo, Addis Modern, and Habesha Romance. Each uses the same invitation data model but has unique layouts, typography, ornament, motion, and mobile treatment.
- Add full-screen previews with desktop/mobile controls and persistent actions to return or start customizing.
- Add a six-step customization studio with progress tracking, friendly validation, local draft recovery, immediate live preview, drag-and-drop image uploads, image removal/reordering, and a final review.
- Add a success screen with the public URL, copy/open controls, WhatsApp/Facebook/Telegram sharing, and downloadable QR code.
- Add public `/invite/{slug}` pages that load published data and render only the selected invitation design.

## Routes
- `/` — bilingual home and template showcase.
- `/templates/{templateId}` — full invitation preview.
- `/create/{templateId}` — six-step customization studio.
- `/invite/{slug}` — public generated invitation.

## Lovable Cloud
- Create an `invitations` table with the requested bilingual wedding fields, template-specific JSON, draft/published state, unique slug, timestamps, and safe validation constraints.
- Allow public reads only for published invitations.
- Use controlled server functions for anonymous invitation creation and updates, with server-side validation and unique slug generation.
- Create a public `wedding-images` storage bucket limited to images under 10 MB, with scoped upload/removal policies and invitation-organized paths.
- Regenerate database types after the schema is applied.

## Design System
- Establish warm ivory, ink, terracotta, burgundy, rose, and antique-gold semantic tokens with an editorial serif, a clean sans serif, and a Ge’ez-capable family.
- Use restrained corners, fine borders, layered photography, subtle Ethiopian-inspired geometry, and tasteful motion with reduced-motion support.
- Generate a cohesive set of original Ethiopian wedding photographs for the homepage and three invitation designs; uploaded photos replace these samples in personalized invitations.

## Technical Details
- Use TanStack Start’s React/TypeScript routing and server functions, Tailwind v4 tokens, shared typed invitation data, and Lovable Cloud’s generated client.
- Validate every form step in the browser and validate the complete payload again on the server with Zod.
- Keep uploaded files validated by MIME type and size, store only public asset URLs, and avoid exposing private credentials.
- Use URL-safe collision-resistant slugs and route-specific metadata for every public content page.
- Use lightweight CSS animation and transitions rather than adding unnecessary runtime weight; animations respect `prefers-reduced-motion`.

## Validation
- Test homepage language switching and all primary links.
- Test all three previews at desktop and mobile sizes.
- Complete the builder, upload/reorder/remove images, publish an invitation, and open its public link.
- Verify share/copy/QR actions, responsive layouts, browser console, network requests, and the final production build.
