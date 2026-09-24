# Elegant Invitations Studio

Build a beautiful, modern Ethiopian Wedding Invitation Website where users can choose a wedding invitation template, customize it with their own information and photos, and generate a unique shareable wedding invitation link.

The website should feel premium, romantic, elegant, modern, and distinctly Ethiopian, while still being easy for anyone to use.

1. Core User Flow

The main user journey should be:

Home → Browse Templates → Preview Template → Choose Template → Customize → Upload Photos → Generate Invitation → Share Link

A user should NOT need to create an account just to test or preview templates.

After choosing a template, they should complete a form containing their wedding information. The system then creates a personalized invitation page and generates a unique URL that they can share with guests.

Example:

yourdomain.com/invite/abebe-and-hana

or

yourdomain.com/w/8f7d2a

The generated invitation must be publicly accessible through the unique URL.

2. Technology Stack

Use:

React / TypeScript

Tailwind CSS

Supabase

Supabase PostgreSQL database

Supabase Storage for uploaded wedding photos

Responsive design for desktop, tablet, and mobile

Modern animation library such as Framer Motion if appropriate

Use Supabase for:

Database

Create an invitations table containing fields such as:

id

slug

template_id

groom_name

bride_name

groom_name_am

bride_name_am

wedding_date

wedding_time

venue

venue_am

address

address_am

story

story_am

phone

email

rsvp_enabled

rsvp_deadline

custom_message

custom_message_am

primary_photo_url

gallery_photos

created_at

updated_at

Also store any other template-specific customization data as JSON if needed.

Supabase Storage

Create a storage bucket for wedding images.

Example:

wedding-images/

Organize uploaded images by invitation ID:

wedding-images/{invitation-id}/couple.jpg

wedding-images/{invitation-id}/gallery-1.jpg

etc.

Make sure the application handles image upload, preview, validation, and storage correctly.

3. HOME PAGE

The homepage should immediately communicate:

Create a Wedding Invitation Your Guests Will Remember

Suggested hero copy:

English

Your Love Story.
Beautifully Invited.

Create a stunning digital wedding invitation in minutes. Choose a design, add your story and photos, and share your special day with everyone you love.

Buttons:

Create Your Invitation

Explore Templates

Amharic

Allow users to switch the entire homepage between English and Amharic.

Suggested Amharic hero:

የፍቅር ታሪክዎን
በውብ የሰርግ ግብዣ ያካፍሉ

የሰርግ ግብዣዎን በጥቂት ደቂቃዎች ይፍጠሩ። የሚወዱትን ዲዛይን ይምረጡ፣ የግብዣዎን መረጃ እና ፎቶዎች ያክሉ፣ ከዚያም ልዩ የጋብቻ ግብዣ ሊንኩን ከቤተሰብዎና ከጓደኞችዎ ጋር ያጋሩ።

Buttons:

ግብዣዎን ይፍጠሩ

ዲዛይኖችን ይመልከቱ

The language switcher should switch all homepage UI text between English and Amharic.

4. TEMPLATE SHOWCASE

The main homepage should feature exactly 3 premium wedding invitation templates.

Do NOT make them look like simple cards with screenshots.

Make the templates visually immersive.

Section heading:

Choose Your Love Story

Subheading:

Three unique designs. One unforgettable day.

Each template should have:

Large visual preview

Template name

Short description

Preview button

Choose this design button

Smooth hover animation

Elegant entrance animation

When hovering over a template:

Slight zoom

Soft shadow

Subtle glow

Floating decorative elements

Template preview gently moves

CTA becomes visible

5. TEMPLATE 01 — ETHIOPIAN ROYAL

Create a sophisticated Ethiopian-inspired design.

Style:

Deep burgundy

Warm gold

Cream

Elegant typography

Ethiopian-inspired geometric patterns

Subtle traditional ornamentation

Luxury wedding aesthetic

Do NOT make it look like a generic African template.

Use subtle Ethiopian visual references rather than excessive cultural decorations.

Possible name:

Royal Tewahedo

Hero:

Two Hearts. One Sacred Beginning.

Include:

Couple names

Wedding date

Main couple photo

Venue

Countdown

Love story

Wedding schedule

Gallery

RSVP

Location/map

Closing message

Animations:

Gold particles gently floating

Ethiopian-inspired geometric pattern slowly appearing

Photo reveal animation

Elegant text fade/slide

Countdown numbers smoothly transition

Scroll-triggered section reveals

6. TEMPLATE 02 — MODERN ADDIS

Create a completely different design.

Style:

Minimal

Editorial

Contemporary

White / ivory

Black typography

Soft terracotta or muted gold accent

Large photography

Modern magazine-style layout

The design should feel like a high-end wedding magazine.

Possible name:

Addis Modern

Hero:

Our Forever Starts Here

Use:

Huge couple names

Large editorial photograph

Vertical date typography

Asymmetrical layout

Elegant whitespace

Large typography

Sections:

Hero

Our Story

Wedding Details

Timeline

Gallery

RSVP

Location

Closing quote

Animations:

Image masking/reveal

Smooth horizontal transitions

Typography slide-ins

Parallax image movement

Scroll-based gallery animations

Elegant page transitions

7. TEMPLATE 03 — HABESHA ROMANCE

Create a romantic Ethiopian-inspired template.

This should feel completely different from the first two.

Style:

Soft cream

Rose

Terracotta

Champagne gold

Organic shapes

Floral elements

Handwritten-style accent typography

Possible name:

Habesha Romance

Hero:

በፍቅር ተጀምሮ
ለዘላለም የሚቀጥል

English alternative:

A Love Written in Forever

Use beautiful Ethiopian-inspired floral and geometric details.

Sections:

Couple introduction

Love story

Wedding date

Ceremony

Reception

Gallery

Family message

RSVP

Location

Thank-you message

Animations:

Flowers gently moving

Petals appearing as the page loads

Handwritten text reveal

Soft floating particles

Image fade transitions

Elegant scroll animations

8. TEMPLATE PREVIEW

When the user clicks:

Preview

Open a full-screen template preview.

The user should be able to see the entire invitation as if it were a real wedding invitation.

Include:

Use This Template

button fixed near the bottom.

Also include:

Back to Templates

The preview should work beautifully on both desktop and mobile.

Add a device preview toggle:

Desktop | Mobile

9. TEMPLATE CUSTOMIZATION FORM

After clicking:

Use This Template

take the user to a beautiful multi-step form.

Do NOT show one huge boring form.

Break it into steps.

Step 1 — Couple

Fields:

Bride's Name

Groom's Name

Names in Amharic

Couple photo

Step 2 — Wedding Details

Fields:

Wedding date

Wedding time

Ceremony type

Venue

Venue in Amharic

Address

Address in Amharic

Google Maps link

Step 3 — Your Story

Fields:

How you met

Your love story

Optional Amharic version

Step 4 — Photos

Allow multiple image uploads.

Features:

Drag & drop

Upload button

Image preview

Remove image

Reorder images

Crop/position if possible

Progress indicator

Store the actual images in Supabase Storage.

Step 5 — RSVP

Allow:

Enable RSVP

RSVP deadline

Contact phone

Contact email

Step 6 — Final Preview

Show the completed invitation before publishing.

Buttons:

Edit

Generate My Invitation

10. LIVE PREVIEW

While the user fills out the form, provide a live preview of the invitation.

Desktop:

Form on left
Live invitation preview on right

Mobile:

Form first
Preview below

Changes should appear immediately in the preview.

For example, if the user changes:

Bride Name → Hana

the invitation preview immediately updates to:

Hana & Abebe

11. GENERATE INVITATION

When the user clicks:

Generate My Invitation

Save all information to Supabase.

Create a unique slug.

Example:

hana-and-abebe

If the slug already exists, generate:

hana-and-abebe-2

or a unique short identifier.

Then display a beautiful success screen.

Example:

Your Invitation Is Ready! 💍

Your wedding invitation has been created.

[Open Invitation]

[Copy Link]

[Share on WhatsApp]

[Share on Facebook]

[Share via Telegram]

[Download QR Code]

Also show:

Your Invitation Link

https://yourdomain.com/invite/hana-and-abebe

Add a copy button.

12. PUBLIC INVITATION PAGE

The generated invitation page should NOT look like the main website.

It should render the selected template exactly as designed.

For example:

/invite/hana-and-abebe

The page loads the invitation information from Supabase based on the slug.

The selected template should dynamically render the correct design.

Example architecture:

InvitationPage
   ↓
template_id
   ↓
RoyalTemplate
ModernAddisTemplate
HabeshaRomanceTemplate


Each template should have its own completely different visual identity.

13. LANGUAGE SUPPORT

The platform should support:

English 🇬🇧

and

አማርኛ 🇪🇹

The homepage must be fully translated.

The invitation templates should also support Amharic.

When creating an invitation, allow users to enter:

English names/text

Amharic names/text

Templates should support mixed-language invitations.

For example:

Hana & Abebe

ሀና እና አቤቤ

Make sure Amharic typography renders beautifully.

Use fonts that properly support Ge'ez characters.

14. DESIGN SYSTEM

The entire website should feel premium.

Avoid:

Generic SaaS cards

Generic gradients

Overused purple AI aesthetics

Cheap-looking wedding clipart

Excessive rounded cards

Template designs that look identical

Instead use:

Elegant typography

High-quality photography

Editorial layouts

Large typography

Subtle borders

Soft shadows

Organic shapes

Sophisticated animations

Premium spacing

Carefully selected Ethiopian-inspired details

The three templates must feel like they were created by three different high-end wedding designers.

15. ANIMATION SYSTEM

Use stylish but tasteful animation.

Homepage:

Hero text fade + slide

Floating decorative elements

Template cards reveal sequentially

Hover image zoom

Smooth page transitions

Scroll reveal

Template preview:

Image transitions

Text reveal

Parallax

Floating decorative elements

Customization:

Smooth step transitions

Progress indicator animation

Upload progress animation

Live preview transitions

Invitation:

Elegant loading animation

Couple names reveal

Photo reveal

Scroll animations

Countdown animation

Gallery transitions

Floral/particle movement

Smooth section transitions

Animations must remain performant on mobile.

Respect prefers-reduced-motion.

16. HOMEPAGE SECTIONS

After the hero and templates, add:

How It Works

1. Choose a Design

Pick the invitation style that fits your story.

2. Make It Yours

Add your names, wedding details, story, and favorite photos.

3. Share the Love

Get your personal invitation link and send it to your guests.

Why Digital Invitations?

Show 4 benefits:

Beautiful

Designed to feel as special as your wedding day.

Easy

Create your invitation in just a few minutes.

Shareable

Send your invitation through WhatsApp, Telegram, SMS, or social media.

Always Accessible

Your guests can open the invitation anytime from their phone.

Made for Ethiopian Weddings

Mention support for:

Amharic

English

Ethiopian wedding traditions

Ethiopian venues

Ethiopian date/time information

WhatsApp sharing

Mobile-first invitations

Final CTA

Headline:

Your Wedding Deserves More Than a Message.

Subtext:

Create an invitation your guests will remember.

Button:

Create Your Invitation

17. ADMIN / DATABASE CONSIDERATIONS

Create the Supabase database structure cleanly.

The system should support:

Creating invitations

Updating invitations

Reading public invitations

Deleting invitations

Uploading photos

Removing photos

Multiple gallery images

Template selection

Unique invitation slugs

Use appropriate Supabase Row Level Security policies.

Public users should only be able to access published invitation data.

Do not expose private Supabase credentials in frontend code.

Use environment variables:

VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=


If using Next.js instead, use the appropriate NEXT_PUBLIC_ variables.

18. RESPONSIVE DESIGN

The invitation itself is primarily designed for mobile guests.

Make the generated invitations mobile-first.

The website builder/customizer should work on:

Desktop

Tablet

Mobile

The final invitation should look excellent on:

iPhone

Android

Desktop browser

Avoid horizontal scrolling.

19. IMPORTANT UX DETAILS

Add a persistent progress indicator during customization:

Couple → Details → Story → Photos → RSVP → Preview

Show:

Step 3 of 6

Allow users to go back without losing information.

Autosave form progress locally while they are creating the invitation.

If possible, also save draft information to Supabase.

Display friendly validation messages.

Examples:

Please add the couple's names.

Please select your wedding date.

Your image is too large. Please upload an image under 10MB.

20. TEMPLATE DATA ARCHITECTURE

Do NOT hard-code the invitation content inside each template.

Create a shared invitation data structure.

For example:

interface WeddingInvitation {
  id: string;
  slug: string;
  templateId: string;

  brideName: string;
  groomName: string;

  brideNameAm?: string;
  groomNameAm?: string;

  weddingDate: string;
  weddingTime?: string;

  venue?: string;
  venueAm?: string;

  address?: string;
  addressAm?: string;

  story?: string;
  storyAm?: string;

  heroImage?: string;
  galleryImages?: string[];

  rsvpEnabled?: boolean;
  rsvpDeadline?: string;

  phone?: string;
  email?: string;

  mapsUrl?: string;

  createdAt: string;
  updatedAt: string;
}


Templates should consume this shared data.

21. SAMPLE DATA

Use realistic Ethiopian sample data when demonstrating the templates.

Example:

Bride:

Hana Tesfaye

Amharic:

ሀና ተስፋዬ

Groom:

Abebe Mekonnen

Amharic:

አቤቤ መኮንን

Venue:

Hyatt Regency Addis Ababa

Use placeholder/sample images that can easily be replaced by the user's uploaded photos.

22. OVERALL VISUAL EXPERIENCE

The most important requirement:

This should NOT look like a generic website builder.

It should feel like a premium digital wedding invitation studio.

The homepage should make users want to immediately click through the three templates.

The templates themselves should be the star of the product.

Make the experience feel like:

Canva + luxury wedding invitation studio + Ethiopian cultural design

but do NOT copy any existing company's design.

Create an original visual identity.

Prioritize:

Beauty → Simplicity → Emotion → Customization → Sharing

Build the application as a polished, production-ready experience rather than a basic prototype.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://ethiopian-love-invites.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/906bbd91-6c72-4698-8b21-03f00220df15).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
