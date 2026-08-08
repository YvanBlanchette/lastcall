"use client";

import Link from "next/link";
import { useTransition, useState } from "react";
import { Send, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { respondToRequestAction, declareOutcomeAction } from "@/actions/requests";
import { REQUEST_STATUS_LABELS } from "@/lib/validators";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

const TONE = {
  NEW: "new", VIEWED: "neutral", RESPONDED: "warning",
  CONNECTED: "success", CLOSED: "neutral", DECLINED: "neutral",
};

export function RequestCard({ request, role }) {
  const [pending, start] = useTransition();
  const [askOutcome, setAskOutcome] = useState(false);
  const toast = useToast();

  const respond = (status) => {
    start(async () => {
      const res = await respondToRequestAction(request.id, status);
      if (res?.error) toast(res.error, "error");
      else {
        toast(status === "CONNECTED" ? "Mise en relation confirmée." : "Demande refusée.");
        if (status === "CONNECTED") setAskOutcome(true);
      }
    });
  };

  const declare = (booked) => {
    start(async () => {
      await declareOutcomeAction(request.id, booked);
      setAskOutcome(false);
      toast(booked ? "Merci. Ce signal aide tout le réseau." : "Noté.");
    });
  };

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={`/listing/${request.listingId}`} className="font-semibold text-navy-900 hover:underline">
            {request.listing.title}
          </Link>
          <p className="text-xs text-navy-500">
            {role === "seller"
              ? `${request.buyer.firstName} ${request.buyer.lastName} · ${request.buyerAgency.name}`
              : `Détenu par ${request.listing.agency.name}`}
            {" · "}
            {request.numberOfTravelers} voyageur{request.numberOfTravelers > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={TONE[request.status]}>{REQUEST_STATUS_LABELS[request.status]}</Badge>
          <span className="text-xs text-navy-400">{formatDate(request.createdAt)}</span>
        </div>
      </div>

      {request.message && (
        <p className="mt-3 rounded-lg bg-navy-50 p-3 text-sm text-navy-600">{request.message}</p>
      )}

      {role === "seller" && ["NEW", "VIEWED"].includes(request.status) && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" disabled={pending} onClick={() => respond("CONNECTED")}>
            <Send className="h-3.5 w-3.5" aria-hidden /> Accepter la mise en relation
          </Button>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => respond("DECLINED")}>
            Refuser
          </Button>
        </div>
      )}

      {role === "seller" && request.status === "CONNECTED" && !request.outcomeBooked && (askOutcome || true) && (
        <div className="mt-3 rounded-lg border border-dashed border-navy-200 p-3">
          <p className="text-sm font-medium text-navy-900">Cette demande a-t-elle mené à une réservation ?</p>
          <p className="mt-0.5 text-xs text-navy-500">
            LastCall ne voit pas vos transactions. Votre réponse est la seule mesure de ce que
            le réseau fait vraiment vendre.
          </p>
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="outline" disabled={pending} onClick={() => declare(true)}>
              <Check className="h-3.5 w-3.5" aria-hidden /> Oui, réservé
            </Button>
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => declare(false)}>
              Pas encore
            </Button>
          </div>
        </div>
      )}

      {request.outcomeBooked && (
        <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-emerald-700">
          <Check className="h-4 w-4" aria-hidden /> Réservation confirmée par l'agence détentrice
        </p>
      )}
    </Card>
  );
}
