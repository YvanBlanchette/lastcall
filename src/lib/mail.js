import "server-only";

/**
 * Couche d'envoi découplée du code métier (section 22 du brief).
 * Par défaut : journalisation en console. Branchez Resend, Postmark ou SMTP
 * en remplaçant uniquement `deliver`.
 */

async function deliver({ to, subject, html }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[mail] → ${to} — ${subject}`);
    return { ok: true, simulated: true };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.MAIL_FROM, to, subject, html }),
  });
  if (!res.ok) {
    console.error("[mail] échec", await res.text());
    return { ok: false };
  }
  return { ok: true };
}

const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function layout(title, body) {
  return `<div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0b1524">
    <div style="font-size:20px;font-weight:700;margin-bottom:24px">Last<span style="color:#f97316">Call</span></div>
    <h1 style="font-size:18px;margin:0 0 12px">${title}</h1>
    ${body}
    <p style="margin-top:32px;font-size:12px;color:#64748b">
      Vous recevez ce message parce que vous êtes membre de LastCall.
      <a href="${base}/profil" style="color:#64748b">Gérer mes notifications</a>
    </p>
  </div>`;
}

export const mail = {
  welcome(user) {
    return deliver({
      to: user.email,
      subject: "Bienvenue sur LastCall",
      html: layout(
        `Bonjour ${user.firstName},`,
        `<p>Votre compte est créé. Un administrateur vérifie votre agence sous 24 h ouvrables ;
         d'ici là, vous pouvez déjà parcourir le marketplace.</p>
         <p><a href="${base}/marketplace" style="background:#f97316;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;display:inline-block">Ouvrir le marketplace</a></p>`
      ),
    });
  },

  accountVerified(user) {
    return deliver({
      to: user.email,
      subject: "Votre agence est vérifiée",
      html: layout(
        "Votre agence est vérifiée",
        `<p>Vous avez maintenant accès aux inventaires réservés aux professionnels vérifiés,
         incluant les tarifs masqués.</p>`
      ),
    });
  },

  savedSearchMatch(user, search, listing) {
    return deliver({
      to: user.email,
      subject: `Un espace correspond à « ${search.name} »`,
      html: layout(
        `Un espace correspond à « ${search.name} »`,
        `<p><strong>${listing.title}</strong><br>
         ${listing.destination} · départ le ${new Date(listing.departureDate).toLocaleDateString("fr-CA")}<br>
         ${listing.inventoryLeft} ${listing.inventoryType === "CABINS" ? "cabines" : "places"} · relâche le
         ${new Date(listing.releaseDate).toLocaleDateString("fr-CA")}</p>
         <p><a href="${base}/listing/${listing.id}" style="background:#f97316;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;display:inline-block">Voir l'espace</a></p>`
      ),
    });
  },

  requestReceived(seller, request, listing) {
    return deliver({
      to: seller.email,
      subject: `Un conseiller a un client pour ${listing.title}`,
      html: layout(
        "Nouvelle demande reçue",
        `<p>${request.buyerAgency?.name ?? "Une agence"} a ${request.numberOfTravelers} voyageur(s)
         pour <strong>${listing.title}</strong>.</p>
         ${request.message ? `<blockquote style="border-left:3px solid #e2e8f0;padding-left:12px;color:#475569">${request.message}</blockquote>` : ""}
         <p><a href="${base}/demandes" style="background:#f97316;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;display:inline-block">Répondre</a></p>`
      ),
    });
  },

  requestAnswered(buyer, listing, status) {
    return deliver({
      to: buyer.email,
      subject: `Réponse à votre demande — ${listing.title}`,
      html: layout(
        "L'agence détentrice a répondu",
        `<p>Votre demande pour <strong>${listing.title}</strong> est maintenant au statut
         « ${status} ».</p>
         <p><a href="${base}/demandes">Voir la demande</a></p>`
      ),
    });
  },

  listingExpiring(user, listing, days) {
    return deliver({
      to: user.email,
      subject: `${listing.title} — relâche dans ${days} jours`,
      html: layout(
        "Une de vos annonces approche de sa relâche",
        `<p><strong>${listing.title}</strong> sera retirée le
         ${new Date(listing.releaseDate).toLocaleDateString("fr-CA")}.
         Il reste ${listing.inventoryLeft} ${listing.inventoryType === "CABINS" ? "cabines" : "places"}.</p>
         <p><a href="${base}/mes-annonces">Mettre à jour l'annonce</a></p>`
      ),
    });
  },

  newsletter(user, sections) {
    const html = sections
      .filter((s) => s.listings.length)
      .map(
        (s) => `<h2 style="font-size:14px;text-transform:uppercase;letter-spacing:.04em;color:#64748b;margin:28px 0 8px">${s.title}</h2>
        ${s.listings
          .map(
            (l) => `<a href="${base}/listing/${l.id}" style="display:block;text-decoration:none;color:inherit;border:1px solid #e2e8f0;border-radius:10px;padding:12px;margin-bottom:8px">
              <strong>${l.title}</strong><br>
              <span style="font-size:13px;color:#475569">${l.destination} · ${l.departureCity} · départ le ${new Date(l.departureDate).toLocaleDateString("fr-CA")}</span><br>
              <span style="font-size:13px;color:#ea580c;font-weight:600">${l.inventoryLeft} ${l.inventoryType === "CABINS" ? "cabines" : "places"} · relâche le ${new Date(l.releaseDate).toLocaleDateString("fr-CA")}</span>
            </a>`
          )
          .join("")}`
      )
      .join("");

    return deliver({
      to: user.email,
      subject: "Cette semaine sur LastCall",
      html: layout("Cette semaine sur LastCall", html),
    });
  },
};
