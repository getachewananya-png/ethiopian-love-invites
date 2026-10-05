import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EMAIL_CONFIRMATION_ENABLED, signUp } from "@/lib/auth";

export const Route = createFileRoute("/signup")({
  validateSearch: (search: Record<string, unknown>) => ({ redirect: typeof search["redirect"] === "string" ? search["redirect"] : "" }),
  head: () => ({ meta: [
    { title: "Create Your Account — Tizita" },
    { name: "description", content: "Create a free Tizita account to publish your Ethiopian wedding invitation and track RSVPs." },
    { name: "robots", content: "noindex" },
  ] }),
  component: SignupPage,
});

function SignupPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [busy, setBusy] = useState(false);
  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (form.password.length < 8) {
      toast.error("Please choose a password of at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      const { needsConfirmation } = await signUp(form.email, form.password, form.fullName, form.phone);
      // Safety net rather than the normal path. Email confirmation is off, so
      // signUp hands back a session and we drop straight into the dashboard.
      // Reaching this means the project setting and EMAIL_CONFIRMATION_ENABLED
      // have drifted apart, so word it for whichever one is actually in force
      // and send the user to sign in.
      if (needsConfirmation) {
        toast.info(
          EMAIL_CONFIRMATION_ENABLED
            ? "Check your email to confirm your account, then sign in."
            : "Your account was created, but we could not sign you in. Please sign in.",
        );
        // Keep the redirect so the user lands back on the builder they left,
        // with their draft still intact, after they sign in.
        await navigate({ to: "/login", search: { redirect } });
        return;
      }
      toast.success("Your account is ready");
      await navigate({ to: redirect || "/dashboard" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create your account");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <Link to="/" className="auth-brand"><span>ትዝታ</span>TIZITA</Link>
        <h1>Create your account</h1>
        <p>Free to start. You will see how many links you sent and who has replied.</p>
        <Label className="field"><span>Your name</span>
          <Input required autoComplete="name" value={form.fullName} onChange={(event) => update("fullName", event.target.value)} placeholder="Hana Tesfaye"/>
        </Label>
        <Label className="field"><span>Email</span>
          <Input type="email" required autoComplete="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="you@example.com"/>
        </Label>
        <Label className="field"><span>Phone (optional)</span>
          <Input autoComplete="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+251 911 234 567"/>
        </Label>
        <Label className="field"><span>Password</span>
          <Input type="password" required autoComplete="new-password" value={form.password} onChange={(event) => update("password", event.target.value)} placeholder="At least 8 characters"/>
        </Label>
        <Button type="submit" size="lg" disabled={busy}>{busy ? <LoaderCircle className="spin"/> : null} Create Account</Button>
        <p className="auth-alt">Already have an account? <Link to="/login" search={{ redirect }}>Sign in</Link></p>
      </form>
    </main>
  );
}
