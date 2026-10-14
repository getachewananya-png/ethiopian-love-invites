import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { ArrowLeft, Monitor, Smartphone } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InvitationRenderer } from "@/components/invitations/InvitationRenderer";
import { AuthActions } from "@/components/AuthActions";
import { sampleInvitation, TEMPLATE_IDS, templateMeta, normalizeTemplateId, type TemplateId } from "@/lib/invitation";

export const Route = createFileRoute("/templates/$templateId")({
  beforeLoad: ({ params }) => {
    const rawId = (params.templateId as string).toLowerCase().trim();
    if (rawId === "custome-ai") {
      throw redirect({
        to: "/templates/$templateId",
        params: { templateId: "custom-ai" },
      });
    }
    if (!TEMPLATE_IDS.includes(rawId as TemplateId)) throw notFound();
  },
  head: ({ params }) => {
    const id = normalizeTemplateId(params.templateId as string);
    const meta = templateMeta[id];
    return {
      meta: [
        { title: `${meta?.name ?? "Invitation"} Preview — Tizita` },
        { name: "description", content: `Preview the ${meta?.name ?? "wedding invitation"} design.` },
        { property: "og:title", content: `${meta?.name ?? "Invitation"} Preview — Tizita` },
        { property: "og:description", content: meta?.description ?? "Preview an Ethiopian wedding invitation." },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: PreviewPage,
});

function PreviewPage() {
  const { templateId } = Route.useParams();
  const id = normalizeTemplateId(templateId);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  return (
    <main className="preview-page">
      <header className="preview-header">
        <Button asChild variant="ghost">
          <Link to="/">
            <ArrowLeft /> Back to Templates
          </Link>
        </Button>
        <strong>{templateMeta[id]?.name ?? "Custom AI Template"}</strong>
        <div className="device-toggle">
          <button
            className={device === "desktop" ? "active" : ""}
            onClick={() => setDevice("desktop")}
            aria-label="Desktop preview"
          >
            <Monitor /> Desktop
          </button>
          <button
            className={device === "mobile" ? "active" : ""}
            onClick={() => setDevice("mobile")}
            aria-label="Mobile preview"
          >
            <Smartphone /> Mobile
          </button>
        </div>
        <AuthActions />
      </header>
      <div className={`preview-stage ${device}`}>
        <div className="preview-frame">
          <InvitationRenderer invitation={{ ...sampleInvitation, templateId: id }} />
        </div>
      </div>
      <div className="preview-dock">
        <span>Love this design?</span>
        <Button asChild size="lg">
          <Link to="/create/$templateId" params={{ templateId: id }}>
            Use This Template
          </Link>
        </Button>
      </div>
    </main>
  );
}

