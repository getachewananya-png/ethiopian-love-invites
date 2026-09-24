import { createFileRoute } from "@tanstack/react-router";
import { InvitationRenderer } from "@/components/invitations/InvitationRenderer";
import { getInvitation } from "@/lib/invitations.functions";
import type { WeddingInvitation } from "@/lib/invitation";

export const Route = createFileRoute("/invite/$slug")({
  loader: ({ params }) => getInvitation({ data: { slug: params.slug } }),
  head: ({ loaderData }) => ({ meta: [
    { title: loaderData ? `${loaderData.bride_name} & ${loaderData.groom_name} — Wedding Invitation` : "Wedding Invitation — Tizita" },
    { name: "description", content: loaderData?.custom_message || "You are warmly invited to celebrate this wedding." },
    { property: "og:title", content: loaderData ? `${loaderData.bride_name} & ${loaderData.groom_name}` : "Wedding Invitation" },
    { property: "og:description", content: loaderData?.custom_message || "Open this wedding invitation for all the celebration details." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ]}), component: PublicInvitation,
});
function PublicInvitation() { const row = Route.useLoaderData(); const invitation: WeddingInvitation = { id: row.id, slug: row.slug, templateId: row.template_id, brideName: row.bride_name, groomName: row.groom_name, brideNameAm: row.bride_name_am || undefined, groomNameAm: row.groom_name_am || undefined, weddingDate: row.wedding_date, weddingTime: row.wedding_time || undefined, ceremonyType: row.ceremony_type || undefined, venue: row.venue || undefined, venueAm: row.venue_am || undefined, address: row.address || undefined, addressAm: row.address_am || undefined, story: row.story || undefined, storyAm: row.story_am || undefined, howWeMet: row.how_we_met || undefined, phone: row.phone || undefined, email: row.email || undefined, rsvpEnabled: row.rsvp_enabled, rsvpDeadline: row.rsvp_deadline || undefined, customMessage: row.custom_message || undefined, customMessageAm: row.custom_message_am || undefined, primaryPhotoUrl: row.primary_photo_url || undefined, galleryImages: Array.isArray(row.gallery_photos) ? row.gallery_photos.filter((item): item is string => typeof item === "string") : [], mapsUrl: row.maps_url || undefined, createdAt: row.created_at, updatedAt: row.updated_at }; return <InvitationRenderer invitation={invitation}/>; }
