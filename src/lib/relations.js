import "server-only";

export async function ensureAcceptedRelation(tx, userAId, userBId) {
	const existing = await tx.agentRelation.findFirst({
		where: {
			OR: [
				{ requesterId: userAId, addresseeId: userBId },
				{ requesterId: userBId, addresseeId: userAId },
			],
		},
	});

	if (existing) {
		if (existing.status !== "ACCEPTED") {
			return tx.agentRelation.update({
				where: { id: existing.id },
				data: { status: "ACCEPTED", respondedAt: new Date() },
			});
		}
		return existing;
	}

	return tx.agentRelation.create({
		data: {
			requesterId: userAId,
			addresseeId: userBId,
			status: "ACCEPTED",
			respondedAt: new Date(),
		},
	});
}

export async function ensureConversationForRelation(tx, relationId, { requestId = null } = {}) {
	const existing = await tx.conversation.findFirst({ where: { relationId } });
	if (existing) {
		if (!existing.requestId && requestId) {
			await tx.conversation.update({
				where: { id: existing.id },
				data: { requestId },
			});
		}
		return existing;
	}

	const relation = await tx.agentRelation.findUnique({
		where: { id: relationId },
		select: { requesterId: true, addresseeId: true },
	});
	if (!relation) throw new Error("Relation introuvable.");

	return tx.conversation.create({
		data: {
			relationId,
			requestId,
			participants: {
				create: [
					{ userId: relation.requesterId, lastReadAt: new Date() },
					{ userId: relation.addresseeId, lastReadAt: new Date() },
				],
			},
		},
	});
}

export async function ensureRelationConversationFromRequest(tx, request) {
	const relation = await ensureAcceptedRelation(tx, request.buyerUserId, request.sellerUserId);
	const conversation = await ensureConversationForRelation(tx, relation.id, { requestId: request.id });
	return { relation, conversation };
}
