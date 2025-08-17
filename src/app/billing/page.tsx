// app/billing/page.tsx
import Stripe from "stripe";
import Link from "next/link";

export const runtime = "nodejs";

type Props = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default async function BillingPage({ searchParams }: Props) {
  const success = searchParams?.success === "1";
  const canceled = searchParams?.canceled === "1";
  const sessionId = (searchParams?.session_id as string) || undefined;

  let session: Stripe.Checkout.Session | null = null;
  let error: string | null = null;

  if (success && sessionId) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2025-07-30.basil",
      });
      // Récupère la session pour afficher des infos (facultatif)
      session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["line_items", "payment_intent"],
      });
    } catch (e: unknown) {
      if (typeof e === "object" && e !== null && "message" in e && typeof (e as { message?: string }).message === "string") {
        error = (e as { message: string }).message;
      } else {
        error = "Impossible de récupérer la session Stripe";
      }
    }
  }

  return (
    <main className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Paiement</h1>

      {canceled && (
        <div className="rounded-md border p-4">
          <p>Paiement annulé.</p>
          <p className="text-sm opacity-70">Tu peux réessayer depuis la page de l’événement.</p>
          <div className="mt-3">
            <Link className="underline" href="/events">← Retour aux événements</Link>
          </div>
        </div>
      )}

      {success && !sessionId && (
        <div className="rounded-md border p-4">
          <p>Succès confirmé, mais pas d’identifiant de session fourni.</p>
          <p className="text-sm opacity-70">Vérifie que `success_url` contient bien <code>{`?session_id={CHECKOUT_SESSION_ID}`}</code>.</p>
        </div>
      )}

      {success && sessionId && (
        <div className="rounded-md border p-4 space-y-2">
          <p className="font-medium">Merci, paiement réussi ✅</p>
          {error && <p className="text-sm text-red-600">{error}</p>}

          {session && (
            <>
              {/* <p className="text-sm opacity-70">Session : <code>{session.id}</code></p> */}
              <p>
                Montant : <strong>
                  {(session.amount_total ?? 0) / 100} {session.currency?.toUpperCase()}
                </strong>
              </p>
              {/* Selon ton flux, affiche d’autres infos utiles */}
              {/* L’URL de facture n’est pas toujours présente en mode one-time payment */}
              {session?.invoice && typeof session.invoice === "string" ? (
                <p>
                  Facture : <a className="underline" href={`https://dashboard.stripe.com/invoices/${session.invoice}`} target="_blank">voir sur Stripe</a>
                </p>
              ) : null}
            </>
          )}

          <div className="pt-2">
            <Link className="underline" href="/account">Voir mes inscriptions →</Link>
          </div>
        </div>
      )}

      {!success && !canceled && (
        <div className="rounded-md border p-4">
          <p>Rien à afficher ici.</p>
          <p className="text-sm opacity-70">Cette page attend <code>?success=1&session_id=…</code> ou <code>?canceled=1</code>.</p>
        </div>
      )}
    </main>
  );
}
