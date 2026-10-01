import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface AuthState {
  user: User | null;
  loading: boolean;
}

/**
 * Client-side session hook.
 *
 * NOTE: this is for UI only. Every server function that touches private data
 * enforces auth itself via `requireSupabaseAuth` — a route guard is not a
 * security boundary, since server functions are reachable independently.
 */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    let active = true;

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (active) setState({ user: data.user ?? null, loading: false });
      })
      .catch(() => {
        if (active) setState({ user: null, loading: false });
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ user: session?.user ?? null, loading: false });
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return state;
}

/**
 * Supabase returns 400 for "Invalid login credentials" when the email is wrong,
 * the password is wrong, OR the account exists but was never confirmed. It
 * deliberately does not say which, to avoid leaking whether an email is
 * registered — so we phrase it for the most common case instead of leaking.
 */
function friendlySignInError(message: string): string {
  if (/invalid login credentials/i.test(message)) {
    return "That email and password do not match. If you just created an account, confirm your email first, then sign in.";
  }
  if (/email not confirmed/i.test(message)) {
    return "Please confirm your email address first — check your inbox for the link we sent.";
  }
  if (/rate limit|too many requests/i.test(message)) {
    return "Too many attempts. Please wait a minute and try again.";
  }
  return message;
}

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw new Error(friendlySignInError(error.message));
}

/** Sends a recovery email so a locked-out user is not permanently stuck. */
export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    // Must point at the page that handles the recovery token and sets the
    // password — this URL also has to be allow-listed in the Supabase
    // dashboard under Authentication → URL Configuration → Redirect URLs.
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw new Error(friendlySignInError(error.message));
}

export async function signUp(email: string, password: string, fullName: string, phone: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, phone } },
  });
  if (error) throw new Error(error.message);
  // When email confirmation is enabled Supabase returns a user but no session.
  return { needsConfirmation: !data.session };
}

export async function signOut() {
  await supabase.auth.signOut();
}
