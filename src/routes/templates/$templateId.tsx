import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Monitor, Smartphone } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InvitationRenderer } from "@/components/invitations/InvitationRenderer";
import { sampleInvitation, TEMPLATE_IDS, templateMeta, type TemplateId } from "@/lib/invitation";

export const Route = createFileRoute("/templates/$templateId")({
  beforeLoad: ({ params }) => { if (!TEMPLATE_IDS.includes(params.templateId as TemplateId)) throw notFound(); },
  head: ({ params }) => { const meta = templateMeta[params.templateId as TemplateId]; return { meta: [
    { title: `${meta?.name ?? "Invitation"} Preview — Tizita` }, { name: "description", content: `Preview the ${meta?.name ?? "wedding invitation"} design.` },
    { property: "og:title", content: `${meta?.name ?? "Invitation"} Preview — Tizita` }, { property: "og:description", content: meta?.description ?? "Preview an Ethiopian wedding invitation." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ]}; }, component: PreviewPage,
});
function PreviewPage() { const { templateId } = Route.useParams(); const id = templateId as TemplateId; const [device,setDevice]=useState<"desktop"|"mobile">("desktop"); return <main className="preview-page"><header className="preview-header"><Button asChild variant="ghost"><Link to="/"><ArrowLeft/> Back to Templates</Link></Button><strong>{templateMeta[id].name}</strong><div className="device-toggle"><button className={device === "desktop" ? "active" : ""} onClick={()=>setDevice("desktop")} aria-label="Desktop preview"><Monitor/> Desktop</button><button className={device === "mobile" ? "active" : ""} onClick={()=>setDevice("mobile")} aria-label="Mobile preview"><Smartphone/> Mobile</button></div></header><div className={`preview-stage ${device}`}><div className="preview-frame"><InvitationRenderer invitation={{...sampleInvitation,templateId:id}}/></div></div><div className="preview-dock"><span>Love this design?</span><Button asChild size="lg"><Link to="/create/$templateId" params={{templateId:id}}>Use This Template</Link></Button></div></main> }
