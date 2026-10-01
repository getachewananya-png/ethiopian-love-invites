import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendPasswordReset, signIn } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({ redirect: typeof search["redirect"] === "string" ? search["redirect"] : "" }),
  head: () => ({ meta: [
    { title: "Sign In — Tizita" },
    { name: "description", content: "Sign in to manage your Ethiopian wedding invitations and view RSVP analytics." },
    { name: "robots", content: "noindex" },
  ] }),
  component: LoginPage,
});

function LoginPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await signIn(email, password);
      toast.success("Welcome back");
      await navigate({ to: redirect || "/dashboard" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    if (!email.trim()) { toast.error("Enter your email address first."); return; }
    setBusy(true);
    try {
      await sendPasswordReset(email);
      // Always the same message, so this cannot be used to test whether an
      // email is registered.
      toast.success("If that email has an account, a reset link is on its way.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send the reset email");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <Link to="/" className="auth-brand"><span>ትዝታ</span>TIZITA</Link>
        <h1>Welcome back</h1>
        <p>Sign in to manage your invitations and track your RSVPs.</p>
        <Label className="field"><span>Email</span>
          <Input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com"/>
        </Label>
        <Label className="field"><span>Password</span>
          <Input type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••"/>
        </Label>
        <Button type="submit" size="lg" disabled={busy}>{busy ? <LoaderCircle className="spin"/> : null} Sign In</Button>
        <button type="button" className="auth-forgot" onClick={forgot} disabled={busy}>Forgot your password?</button>
        <p className="auth-alt">New to Tizita? <Link to="/signup" search={{ redirect }}>Create an account</Link></p>
      </form>
    </main>
  );
}
