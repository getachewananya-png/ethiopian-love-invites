import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CalendarDays, Check, Copy, GripVertical, ImagePlus, LoaderCircle, Mail, MapPin, Phone, Share2, Trash2, Upload, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { InvitationRenderer } from "@/components/invitations/InvitationRenderer";
import { publishInvitation, uploadWeddingImage } from "@/lib/invitations.functions";
import { startPaidInvitation } from "@/lib/payments.functions";
import { isPaidTemplate, TEMPLATE_PRICE_ETB, formatEtb } from "@/lib/plans";
import { useAuth } from "@/lib/auth";
import { getErrorMessage } from "@/lib/utils";
import { sampleInvitation, TEMPLATE_IDS, templateMeta, type TemplateId, type WeddingInvitation } from "@/lib/invitation";

export const Route = createFileRoute("/create/$templateId")({
  validateSearch: (search: Record<string, unknown>) => ({
    edit: typeof search.edit === "string" ? search.edit : undefined,
  }),
  beforeLoad: ({ params }) => { if (!TEMPLATE_IDS.includes(params.templateId as TemplateId)) throw notFound(); },
  head: ({ params }) => ({ meta: [
    { title: `Customize ${templateMeta[params.templateId as TemplateId]?.name ?? "Invitation"} — Tizita` }, { name: "description", content: "Add your names, wedding details, story, and photos to create your invitation." },
    { property: "og:title", content: "Create Your Ethiopian Wedding Invitation — Tizita" }, { property: "og:description", content: "Customize and publish your own beautiful bilingual wedding invitation." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ]}), component: Builder,
});
const MAX_GALLERY_IMAGES = 12;
const steps = ["Couple", "Details", "Story", "Photos", "RSVP", "Preview"];

/** Fields the guest can submit either as text or a file, keyed by builder step. */
const REQUIRED_BY_STEP: Record<number, Array<{ key: keyof WeddingInvitation; label: string }>> = {
  0: [
    { key: "brideName", label: "Bride's name" },
    { key: "groomName", label: "Groom's name" },
    { key: "brideNameAm", label: "Bride's name in Amharic" },
    { key: "groomNameAm", label: "Groom's name in Amharic" },
  ],
  1: [
    { key: "weddingDate", label: "Wedding date" },
    { key: "weddingTime", label: "Wedding time" },
    { key: "ceremonyType", label: "Ceremony type" },
    { key: "venue", label: "Venue" },
    { key: "venueAm", label: "Venue in Amharic" },
    { key: "address", label: "Address" },
    { key: "addressAm", label: "Address in Amharic" },
  ],
  2: [
    { key: "howWeMet", label: "How you met" },
    { key: "story", label: "Your love story" },
    { key: "storyAm", label: "Your story in Amharic" },
  ],
  4: [
    { key: "rsvpDeadline", label: "RSVP deadline" },
    { key: "phone", label: "Contact phone" },
    { key: "email", label: "Contact email" },
  ],
};

/**
 * Everything still missing for this step. Step 3 is checked separately because
 * its fields are files rather than text, and step 4 only demands RSVP contact
 * details while RSVP is actually switched on.
 */
function missingForStep(step: number, d: WeddingInvitation): string[] {
  const missing: string[] = [];
  const fields = REQUIRED_BY_STEP[step] ?? [];
  for (const field of fields) {
    // Turning RSVP off means nobody needs to be emailed or called about it.
    if (step === 4 && !d.rsvpEnabled) continue;
    const value = d[field.key];
    if (typeof value !== "string" || !value.trim()) missing.push(field.label);
  }
  if (step === 3) {
    if (!d.primaryPhotoUrl?.trim()) missing.push("Main couple photo");
    if (!d.galleryImages.length) missing.push("At least one gallery photo");
  }
  return missing;
}
function Builder() {
  const { templateId } = Route.useParams(); const id = templateId as TemplateId; const navigate = useNavigate();
  const search = Route.useSearch();
  const editInvitationId = search.edit;
  const isEditing = Boolean(editInvitationId);

  const [step,setStep]=useState(0); const [saving,setSaving]=useState(false); const [loadingEdit,setLoadingEdit]=useState(isEditing); const [success,setSuccess]=useState<string>(); const [qr,setQr]=useState<string>(); const [drag,setDrag]=useState<string|null>(null); const heroRef=useRef<HTMLInputElement>(null); const galleryRef=useRef<HTMLInputElement>(null);
  const storageKey=`tizita-draft-${id}`;
  const [data,setData]=useState<WeddingInvitation>(()=>({...sampleInvitation,templateId:id,brideName:"",groomName:"",brideNameAm:"",groomNameAm:"",primaryPhotoUrl:"",galleryImages:[]}));
  // Autosave must not run before the saved draft has been read back, or the
  // initial empty state would overwrite the user's real draft on mount.
  const [hydrated,setHydrated]=useState(false);

  useEffect(() => {
    if (isEditing && editInvitationId) {
      setLoadingEdit(true);
      import("@/lib/invitations.functions")
        .then(({ getInvitationForEdit }) => getInvitationForEdit({ data: { invitationId: editInvitationId } }))
        .then((existing) => {
          setData({
            id: existing.id,
            slug: existing.slug,
            templateId: existing.template_id as TemplateId,
            brideName: existing.bride_name ?? "",
            groomName: existing.groom_name ?? "",
            brideNameAm: existing.bride_name_am ?? "",
            groomNameAm: existing.groom_name_am ?? "",
            weddingDate: existing.wedding_date ?? "",
            weddingTime: existing.wedding_time ?? "",
            ceremonyType: existing.ceremony_type ?? "",
            venue: existing.venue ?? "",
            venueAm: existing.venue_am ?? "",
            address: existing.address ?? "",
            addressAm: existing.address_am ?? "",
            story: existing.story ?? "",
            storyAm: existing.story_am ?? "",
            howWeMet: existing.how_we_met ?? "",
            phone: existing.phone ?? "",
            email: existing.email ?? "",
            rsvpEnabled: existing.rsvp_enabled ?? true,
            rsvpDeadline: existing.rsvp_deadline ?? "",
            customMessage: existing.custom_message ?? "",
            customMessageAm: existing.custom_message_am ?? "",
            primaryPhotoUrl: existing.primary_photo_url ?? "",
            galleryImages: Array.isArray(existing.gallery_photos) ? existing.gallery_photos : [],
            mapsUrl: existing.maps_url ?? "",
            musicUrl: existing.music_url ?? "",
          });
        })
        .catch((err) => {
          toast.error(err instanceof Error ? err.message : "Could not load invitation to edit");
          navigate({ to: "/dashboard" });
        })
        .finally(() => {
          setLoadingEdit(false);
          setHydrated(true);
        });
      return;
    }

    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try { setData(JSON.parse(saved)); } catch { /* ignore corrupt draft */ }
    }
    setHydrated(true);
  }, [storageKey, isEditing, editInvitationId, navigate]);

  useEffect(() => {
    if (hydrated && !isEditing) localStorage.setItem(storageKey, JSON.stringify(data));
  }, [data, storageKey, hydrated, isEditing]);

  const update=(field:keyof WeddingInvitation,value:unknown)=>setData(current=>({...current,[field]:value}));
  const next=()=>{const missing=missingForStep(step,data); if(missing.length){toast.error(`Please add: ${missing.join(", ")}.`); return} setStep(Math.min(5,step+1));};
  /** Uploads one file into either the hero slot or the gallery. */
  const uploadOne=async(file:File,target:"hero"|"gallery")=>{const base64=await fileToBase64(file); const result=await uploadWeddingImage({data:{name:file.name,mimeType:file.type as "image/jpeg"|"image/png"|"image/webp",base64}}); setData(current=>{if(target==="hero")return{...current,primaryPhotoUrl:result.url}; const rest=current.galleryImages.length>=MAX_GALLERY_IMAGES?current.galleryImages:[...current.galleryImages,result.url]; return{...current,galleryImages:rest}});};
  const handleFiles=async(files:FileList|File[],target:"hero"|"gallery")=>{for(const file of Array.from(files)){if(!["image/jpeg","image/png","image/webp"].includes(file.type)){toast.error(`${file.name} is not a supported image.`);continue} if(file.size>10*1024*1024){toast.error(`${file.name} is over 10MB.`);continue} if(target==="hero"&&Array.from(files).length>1){toast.error("The main photo is a single image — pick just one.");break} if(target==="gallery"&&data.galleryImages.length>=MAX_GALLERY_IMAGES){toast.error(`You can add up to ${MAX_GALLERY_IMAGES} gallery photos.`);break} setSaving(true); try{await uploadOne(file,target); toast.success(`${file.name} uploaded`)}catch(error){toast.error(error instanceof Error?error.message:"Image upload failed")}finally{setSaving(false)}}};
  const paid = isPaidTemplate(id);
  const { user, loading: authLoading } = useAuth();
  // Which required fields are still outstanding on the step being viewed, so the
  // form can mark them and the publish button can explain itself.
  const missingHere = useMemo(() => missingForStep(step, data), [step, data]);
  const missingOverall = useMemo(() => {
    const all: string[] = [];
    for (let index = 0; index <= 4; index += 1) all.push(...missingForStep(index, data));
    return all;
  }, [data]);
  // Jump the user to the earliest step that still has something outstanding,
  // rather than making them hunt for it in the progress bar.
  const firstStepWithMissing = () => {
    for (let index = 0; index <= 4; index += 1) if (missingForStep(index, data).length) return index;
    return step;
  };
  // `publishInvitation` is server-guarded by requireSupabaseAuth, so an
  // anonymous visitor must be sent to sign up BEFORE we call it. Checking
  // afterwards meant the server threw "Unauthorized" first and the user only
  // ever saw a generic "could not be created" failure. The redirect carries the
  // builder back so the draft (kept in localStorage) is still waiting for them.
  const publish=async()=>{
    if(authLoading){ toast.error("Checking your session — please try again."); return; }
    // Client-side guard. The server schema is the real enforcement, but catching
    // it here saves a round trip and tells the user exactly what is missing.
    if(missingOverall.length){ toast.error(`Please add: ${missingOverall.slice(0,4).join(", ")}${missingOverall.length>4?"…":""}`); setStep(firstStepWithMissing()); return; }
    if(!user){ navigate({to:"/signup",search:{redirect:`/create/${id}`}}); toast.error("Create an account to generate your invitation."); return; }
    setSaving(true);
    try{
      if (isEditing && editInvitationId) {
        const { updateInvitation } = await import("@/lib/invitations.functions");
        const result = await updateInvitation({ data: { ...data, invitationId: editInvitationId } });
        toast.success("Invitation updated successfully!");
        navigate({ to: "/invite/$slug", params: { slug: result.slug } });
        return;
      }
      const result=await publishInvitation({data});
      if(result.requiresPayment){
        try{
          const checkout=await startPaidInvitation({data:{invitationId:result.id,templateId:id}});
          window.location.href=checkout.checkoutUrl;
          return;
        }catch(paymentError){
          toast.error(getErrorMessage(paymentError, "Could not start checkout"));
          return;
        }
      }
      const url=`${window.location.origin}/invite/${result.slug}`;
      setSuccess(url);
      setQr(await QRCode.toDataURL(url,{width:720,margin:2,color:{dark:"#2a1714",light:"#fffaf2"}}));
      localStorage.removeItem(storageKey);
    }catch(error){
      const message=getErrorMessage(error, isEditing ? "Invitation could not be updated" : "Invitation could not be created");
      // An expired access token lands here too, so point the user at sign-in
      // instead of leaving them with a dead end.
      toast.error(/unauthorized/i.test(message)?"Your session has expired — please sign in again.":message);
    }finally{
      setSaving(false);
    }
  };
  if(loadingEdit) {
    return <main className="builder-page" style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"80vh"}}><LoaderCircle className="spin" style={{marginRight:8}}/> Loading invitation...</main>;
  }
  if(success) return <Success url={success} qr={qr}/>;
  return <main className="builder-page"><header className="builder-header"><Button asChild variant="ghost"><Link to={isEditing ? "/dashboard" : "/"}><ArrowLeft/> {isEditing ? "Dashboard" : "Exit"}</Link></Button><div className="builder-brand"><span>ትዝታ</span><strong>{templateMeta[id].name}{isEditing ? " (Editing)" : ""}</strong></div><span className="autosave"><Check/> {isEditing ? "Editing invitation" : "Draft saved"}</span></header>
    <div className="builder-progress"><div className="progress-top"><span>Step {step+1} of 6</span><strong>{steps[step]}</strong></div><div className="progress-track"><i style={{width:`${((step+1)/6)*100}%`}}/></div><div className="progress-labels">{steps.map((name,index)=><button key={name} className={index<=step?"active":""} onClick={()=>setStep(index)}><span>{index<step?<Check/>:index+1}</span>{name}</button>)}</div></div>
    <div className="builder-workspace"><section className="builder-form"><div className="form-heading"><p>{String(step+1).padStart(2,"0")} / 06</p><h1>{["Tell us your names","When & where","Share your story","Add your moments","Guest replies","One last look"][step]}</h1><span>{["The names at the heart of your invitation.","Everything your guests need to arrive with ease.","A few words that sound unmistakably like you.","Choose one main portrait and your favorite memories.","Make it easy for your people to say yes.","Your invitation is ready to become real."][step]}</span></div>
      {step===0&&<div className="form-grid"><Field label="Bride's Name"><Input value={data.brideName} onChange={e=>update("brideName",e.target.value)} placeholder="Hana Tesfaye" maxLength={100}/></Field><Field label="Groom's Name"><Input value={data.groomName} onChange={e=>update("groomName",e.target.value)} placeholder="Abebe Mekonnen" maxLength={100}/></Field><Field label="Bride's Name in Amharic"><Input lang="am" value={data.brideNameAm} onChange={e=>update("brideNameAm",e.target.value)} placeholder="ሀና ተስፋዬ" maxLength={100}/></Field><Field label="Groom's Name in Amharic"><Input lang="am" value={data.groomNameAm} onChange={e=>update("groomNameAm",e.target.value)} placeholder="አቤቤ መኮንን" maxLength={100}/></Field></div>}
      {step===1&&<div className="form-grid"><Field label="Wedding date"><Input type="date" value={data.weddingDate} onChange={e=>update("weddingDate",e.target.value)}/></Field><Field label="Wedding time"><Input type="time" value={data.weddingTime} onChange={e=>update("weddingTime",e.target.value)}/></Field><Field label="Ceremony type"><Input value={data.ceremonyType} onChange={e=>update("ceremonyType",e.target.value)} placeholder="Ceremony & reception"/></Field><Field label="Venue"><Input value={data.venue} onChange={e=>update("venue",e.target.value)} placeholder="Hyatt Regency Addis Ababa"/></Field><Field label="Venue in Amharic"><Input lang="am" value={data.venueAm} onChange={e=>update("venueAm",e.target.value)} placeholder="ሃያት ሪጀንሲ አዲስ አበባ"/></Field><Field label="Address"><Input value={data.address} onChange={e=>update("address",e.target.value)} placeholder="Meskel Square, Addis Ababa"/></Field><Field label="Address in Amharic"><Input lang="am" value={data.addressAm} onChange={e=>update("addressAm",e.target.value)} placeholder="መስቀል አደባባይ፣ አዲስ አበባ"/></Field><Field label="Google Maps link" optional><Input type="url" value={data.mapsUrl} onChange={e=>update("mapsUrl",e.target.value)} placeholder="https://maps.google.com/..."/></Field><Field label="Background music (YouTube)" optional><Input type="url" value={data.musicUrl} onChange={e=>update("musicUrl",e.target.value)} placeholder="https://youtube.com/watch?v=..."/></Field></div>}
      {step===2&&<div className="form-stack"><Field label="How you met"><Textarea value={data.howWeMet} onChange={e=>update("howWeMet",e.target.value)} placeholder="A chance meeting over coffee..." maxLength={2000}/></Field><Field label="Your love story"><Textarea className="large" value={data.story} onChange={e=>update("story",e.target.value)} placeholder="Tell your guests about the path that brought you here..." maxLength={5000}/></Field><Field label="Your story in Amharic"><Textarea lang="am" value={data.storyAm} onChange={e=>update("storyAm",e.target.value)} placeholder="የፍቅር ታሪካችሁን በአማርኛ ያካፍሉ..." maxLength={5000}/></Field></div>}
      {step===3&&<div className="upload-sections">
        {/* 1. Hero -- a single portrait-orientation photo of the couple. */}
        <section className={`upload-card ${drag==="hero"?"dragging":""}`}>
          <header className="upload-head"><div><h3><span className="upload-step">1</span> Main couple photo <em className="upload-required">Required</em></h3><p>This is the large photo at the top of your invitation. A portrait shot of you both works best.</p></div></header>
          <div className="dropzone" onDragOver={(e)=>{e.preventDefault();setDrag("hero")}} onDragLeave={()=>setDrag(null)} onDrop={(e:DragEvent)=>{e.preventDefault();setDrag(null);void handleFiles(e.dataTransfer.files,"hero")}}>
            <input ref={heroRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e:ChangeEvent<HTMLInputElement>)=>{e.target.files&&void handleFiles(e.target.files,"hero");e.target.value=""}}/>
            {data.primaryPhotoUrl
              ? <div className="upload-preview tall"><img src={data.primaryPhotoUrl} alt="Main couple photo preview"/><Button type="button" variant="outline" size="sm" disabled={saving} onClick={()=>heroRef.current?.click()}>{saving?<LoaderCircle className="spin"/>:<Upload/>}Replace</Button><Button type="button" variant="ghost" size="sm" onClick={()=>update("primaryPhotoUrl","")}>Remove</Button></div>
              : <>{saving?<LoaderCircle className="spin"/>:<ImagePlus/>}<h3>Drop your main photo here</h3><p>One photo · JPG, PNG or WebP · max 10MB</p><Button type="button" variant="outline" disabled={saving} onClick={()=>heroRef.current?.click()}>Choose photo</Button></>}
          </div>
        </section>

        {/* 2. Gallery -- up to MAX_GALLERY_IMAGES moments from the day. */}
        <section className={`upload-card ${drag==="gallery"?"dragging":""}`}>
          <header className="upload-head"><div><h3><span className="upload-step">2</span> Gallery photos <em className="upload-required">At least 1</em></h3><p>Moments from your engagement, the ceremony, or you both. These appear in the gallery strip.</p></div><span className="upload-count">{data.galleryImages.length} / {MAX_GALLERY_IMAGES}</span></header>
          <div className="dropzone" onDragOver={(e)=>{e.preventDefault();setDrag("gallery")}} onDragLeave={()=>setDrag(null)} onDrop={(e:DragEvent)=>{e.preventDefault();setDrag(null);void handleFiles(e.dataTransfer.files,"gallery")}}>
            <input ref={galleryRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e:ChangeEvent<HTMLInputElement>)=>{e.target.files&&void handleFiles(e.target.files,"gallery");e.target.value=""}}/>
            {saving?<LoaderCircle className="spin"/>:<Upload/>}<h3>Drop gallery photos here</h3><p>Select several at once · max 10MB each</p><Button type="button" variant="outline" disabled={saving||data.galleryImages.length>=MAX_GALLERY_IMAGES} onClick={()=>galleryRef.current?.click()}>Add photos</Button>
          </div>
          {data.galleryImages.length>0&&<div className="photo-grid">{data.galleryImages.map((image,index)=><PhotoRow key={image} image={image} label={`Gallery ${index+1}`} onDelete={()=>update("galleryImages",data.galleryImages.filter((_,i)=>i!==index))}/>)}</div>}
        </section>
      </div>}
      {step===4&&<div className="form-stack"><div className="rsvp-toggle"><div><h3>Enable RSVP</h3><p>Show reply details on your invitation.</p></div><Switch checked={data.rsvpEnabled} onCheckedChange={value=>update("rsvpEnabled",value)}/></div>{data.rsvpEnabled&&<div className="form-grid"><Field label="RSVP deadline"><Input type="date" value={data.rsvpDeadline} onChange={e=>update("rsvpDeadline",e.target.value)}/></Field><Field label="Contact phone"><Input type="tel" value={data.phone} onChange={e=>update("phone",e.target.value)} placeholder="+251 911 234 567"/></Field><Field label="Contact email"><Input type="email" value={data.email} onChange={e=>update("email",e.target.value)} placeholder="hello@example.com"/></Field><Field label="Closing message" optional><Textarea value={data.customMessage} onChange={e=>update("customMessage",e.target.value)} placeholder="With joyful hearts..."/></Field></div>}</div>}
      {step===5&&<div className="review-list"><Review icon={HeartIcon} label="Couple" value={`${data.brideName} & ${data.groomName}`} onEdit={()=>setStep(0)}/><Review icon={CalendarDays} label="Wedding" value={`${data.weddingDate} · ${data.weddingTime}`} onEdit={()=>setStep(1)}/><Review icon={MapPin} label="Venue" value={data.venue||"Not added"} onEdit={()=>setStep(1)}/><Review icon={ImagePlus} label="Photos" value={`${(data.primaryPhotoUrl?1:0)+data.galleryImages.length} uploaded`} onEdit={()=>setStep(3)}/><Review icon={Phone} label="RSVP" value={data.rsvpEnabled?(data.phone||data.email||"Enabled"):"Disabled"} onEdit={()=>setStep(4)}/></div>}
      <div className="form-navigation"><Button variant="outline" disabled={step===0||saving} onClick={()=>setStep(step-1)}><ArrowLeft/>Back</Button>{step<5?<Button onClick={next}>Continue<ArrowRight/></Button>:<Button onClick={publish} disabled={saving}>{saving?<LoaderCircle className="spin"/>:<Share2/>}{isEditing ? "Save Changes" : (paid?`Continue to payment · ${formatEtb(TEMPLATE_PRICE_ETB[id])}`:"Generate My Invitation")}</Button>}</div>
    </section><aside className="live-preview"><div className="preview-label"><div><span>LIVE PREVIEW</span><i/></div><strong>{templateMeta[id].name}</strong>{paid && <em className="tier-badge paid">{formatEtb(TEMPLATE_PRICE_ETB[id])} · Premium</em>}</div><div className="phone-preview"><InvitationRenderer invitation={data} compact/></div></aside></div></main>;
}
function Field({label,children,optional}:{label:string;children:React.ReactNode;optional?:boolean}){return <Label className="field"><span>{label}{optional?<em className="field-optional">Optional</em>:<em className="field-required">Required</em>}</span>{children}</Label>}
function PhotoRow({image,label,onDelete}:{image:string;label:string;onDelete:()=>void}){return <div className="photo-row"><GripVertical/><img src={image} alt="Upload preview"/><span>{label}</span><button type="button" onClick={onDelete} aria-label={`Remove ${label}`}><Trash2/></button></div>}
function Review({icon:Icon,label,value,onEdit}:{icon:React.ComponentType<{className?:string}>;label:string;value:string;onEdit:()=>void}){return <div className="review-item"><Icon/><div><span>{label}</span><strong>{value}</strong></div><button onClick={onEdit}>Edit</button></div>}
function HeartIcon(){return <span className="review-heart">♥</span>}
function fileToBase64(file:File){return new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(",")[1]??"");reader.onerror=reject;reader.readAsDataURL(file)})}
function Success({url,qr}:{url:string;qr?:string|undefined}){const copy=()=>navigator.clipboard.writeText(url).then(()=>toast.success("Invitation link copied"));return <main className="success-page"><div className="success-mark"><Check/></div><p>READY TO SHARE</p><h1>Your Invitation<br/><em>Is Ready!</em></h1><span>Your wedding invitation has been created. Share it with everyone you love.</span><div className="link-box"><div><small>Your Invitation Link</small><strong>{url}</strong></div><button onClick={copy} aria-label="Copy invitation link"><Copy/></button></div><div className="success-actions"><Button asChild size="lg"><a href={url}>Open Invitation</a></Button><Button variant="outline" size="lg" onClick={copy}><Copy/>Copy Link</Button></div><div className="share-row"><a href={`https://wa.me/?text=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer">WhatsApp</a><a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer">Facebook</a><a href={`https://t.me/share/url?url=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer">Telegram</a>{qr&&<a href={qr} download="wedding-invitation-qr.png">Download QR</a>}</div>{qr&&<img className="qr-code" src={qr} alt="Invitation QR code"/>}<Button asChild variant="ghost"><Link to="/">Return to Tizita</Link></Button></main>}
