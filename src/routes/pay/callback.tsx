import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { CheckCircle2, LoaderCircle, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { verifyPayment, type FulfillResult } from "@/lib/payments.functions";

const searchSchema = z.object({ tx_ref: z.string().optional() });

/**
 * Where Chapa sends the customer back after checkout.
 *
 * We never trust the query string: the reference it carries is only a lookup
 * key, and `verifyPayment` re-queries Chapa before granting access.
 */
export const Route = createFileRoute("/pay/callback")({
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({ meta: [{ title: "Confirming Payment — Tizita" }, { name: "robots", content: "noindex" }] }),
  component: PaymentCallback,
});

function PaymentCallback() {
  const { tx_ref: txRef } = useSearch({ from: "/pay/callback" });
  const [state, setState] = useState<"loading" | "done" | "error">("loading");
  const [result, setResult] = useState<FulfillResult | null>(null);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!txRef) {
      setState("error");
      setMessage("This payment link is missing its reference.");
      return;
    }
    let active = true;
    verifyPayment({ data: { txRef } })
      .then((outcome) => {
        if (!active) return;
        setResult(outcome);
        setState(outcome.status === "success" ? "done" : outcome.status === "pending" ? "loading" : "error");
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState("error");
        setMessage(error instanceof Error ? error.message : "We could not confirm this payment.");
      });
    return () => {
      active = false;
    };
  }, [txRef]);

  return (
    <main className="pay-page">
      <div className="pay-card">
        {state === "loading" && <><LoaderCircle className="spin"/><h1>Confirming your payment</h1><p>Please wait while we verify the transaction with Chapa.</p></>}
        {state === "done" && <><CheckCircle2 className="pay-icon ok"/><h1>Payment confirmed</h1><p>{result?.message ?? "Your invitation is now live."}</p>
          <div className="pay-actions">
            {result?.slug && <Button asChild size="lg"><Link to="/invite/$slug" params={{ slug: result.slug }} search={{ token: undefined }}>Open invitation</Link></Button>}
            <Button asChild variant="outline" size="lg"><Link to="/dashboard">Go to dashboard</Link></Button>
          </div></>}
        {state === "error" && <><XCircle className="pay-icon bad"/><h1>We could not confirm this payment</h1><p>{message || `No successful payment was found for ${txRef ?? "this reference"}. If you were charged, it will appear on your dashboard shortly.`}</p>
          <div className="pay-actions"><Button asChild size="lg"><Link to="/dashboard">Go to dashboard</Link></Button><Button asChild variant="outline" size="lg"><Link to="/">Back home</Link></Button></div></>}
      </div>
    </main>
  );
}
