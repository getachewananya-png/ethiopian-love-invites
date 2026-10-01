import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>) => ({ redirect: typeof search["redirect"] === "string" ? search["redirect"] : "" }),
  head: () => ({ meta: [
    { title: "Choose a New Password — Tizita" },
    { name: "description", content: "Set a new password for your Tizita account." },
    { name: "robots", content: "noindex" },
  ] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  // Supabase consumes the recovery token from the URL automatically
  // (detectSessionInUrl is on), establishing a temporary session. We only
  // need to know whether one actually exists before allowing a password change.
  useEffect(() => {
    let active = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setHasSession(Boolean(data.session));
        setChecking(false);
      })
      .catch(() => {
        if (!active) return;
        setHasSession(false);
        setChecking(false);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || session) {
        setHasSession(Boolean(session));
        setChecking(false);
      }
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) { toast.error("Please choose a password of at least 8 characters."); return; }
    if (password !== confirm) { toast.error("The two passwords do not match."); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new Error(error.message);
      // The recovery session is spent; drop it so the user signs in again with
      // the new password rather than carrying a privileged session forward.
      await supabase.auth.signOut();
      setDone(true);
      toast.success("Your password has been updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update your password");
    } finally {
      setBusy(false);
    }
  };

  if (checking) {
    return <main className="auth-page"><div className="auth-card"><LoaderCircle className="spin"/><p className="auth-status">Checking your reset link…</p></div></main>;
  }

  if (done) {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <CheckCircle2 className="pay-icon ok"/>
          <h1>Password updated</h1>
          <p>Sign in with your new password to get back to your invitations.</p>
          <Button asChild size="lg"><Link to="/login" search={{ redirect }}>Sign In</Link></Button>
        </div>
      </main>
    );
  }

  if (!hasSession) {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <h1>This reset link is no longer valid</h1>
          <p>Recovery links expire after a short time and can only be used once. Request a fresh one to continue.</p>
          <Button asChild size="lg"><Link to="/login" search={{ redirect }}>Back to Sign In</Link></Button>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <Link to="/" className="auth-brand"><span>ትዝታ</span>TIZITA</Link>
        <h1>Choose a new password</h1>
        <p>Pick something memorable — at least 8 characters.</p>
        <Label className="field"><span>New password</span>
          <Input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••"/>
        </Label>
        <Label className="field"><span>Confirm new password</span>
          <Input type="password" required minLength={8} autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} placeholder="••••••••"/>
        </Label>
        <Button type="submit" size="lg" disabled={busy}>{busy ? <LoaderCircle className="spin"/> : null} Update Password</Button>
        <p className="auth-alt">Changed your mind? <button type="button" className="auth-forgot" onClick={() => { void navigate({ to: "/login", search: { redirect } }); }}>Back to sign in</button></p>
      </form>
    </main>
  );
}
