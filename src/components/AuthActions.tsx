import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { signOut, useAuth } from "@/lib/auth";

/**
 * Header auth controls: "Sign in / Sign up" for guests, "Dashboard / Sign out"
 * once a session exists. Rendering nothing while the session resolves avoids a
 * flash of the wrong state on every page load.
 */
export function AuthActions() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  if (loading) {
    return <div className="auth-actions" aria-hidden="true" />;
  }

  if (!user) {
    return (
      <div className="auth-actions">
        <Button asChild variant="ghost" size="sm">
          <Link to="/login" search={{ redirect: "" }}>Sign in</Link>
        </Button>
        <Button asChild size="sm">
          <Link to="/signup" search={{ redirect: "" }}>Sign up</Link>
        </Button>
      </div>
    );
  }

  const handleSignOut = async () => {
    setBusy(true);
    try {
      await signOut();
      toast.success("You have been signed out");
      await navigate({ to: "/" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign out");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-actions">
      <Button asChild variant="ghost" size="sm">
        <Link to="/dashboard"><LayoutDashboard/>Dashboard</Link>
      </Button>
      <Button variant="outline" size="sm" onClick={() => { void handleSignOut(); }} disabled={busy}>
        <LogOut/>Sign out
      </Button>
    </div>
  );
}
