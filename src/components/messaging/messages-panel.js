"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const POLL_INTERVAL_MS = 8000;

export function MessagesPanel({ children, messageCount = 0, conversationId }) {
	const router = useRouter();
	const scrollRef = useRef(null);

	// Rafraîchit la conversation sans recharger la page (uniquement si l'onglet est visible).
	useEffect(() => {
		function refreshIfVisible() {
			if (document.visibilityState === "visible") router.refresh();
		}

		const interval = setInterval(refreshIfVisible, POLL_INTERVAL_MS);
		window.addEventListener("focus", refreshIfVisible);
		document.addEventListener("visibilitychange", refreshIfVisible);

		return () => {
			clearInterval(interval);
			window.removeEventListener("focus", refreshIfVisible);
			document.removeEventListener("visibilitychange", refreshIfVisible);
		};
	}, [router]);

	useEffect(() => {
		const node = scrollRef.current;
		if (node) node.scrollTop = node.scrollHeight;
	}, [messageCount, conversationId]);

	return (
		<div
			ref={scrollRef}
			className="flex-1 space-y-3 overflow-y-auto px-5 py-4"
		>
			{children}
		</div>
	);
}
