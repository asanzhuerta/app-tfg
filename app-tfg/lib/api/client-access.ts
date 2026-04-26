import type { SessionLike } from "@/lib/contracts/api";
import type { ClientAccessTarget } from "@/lib/contracts/client-write";

export function getClientOwnerUserId(client: ClientAccessTarget) {
	return client?.user?.id ?? client?.linkedUser?.id ?? null;
}

export function canReadClient(
	session: SessionLike,
	client: ClientAccessTarget,
) {
	if (!session?.user) {
		return false;
	}

	if (session.user.role === "admin") {
		return true;
	}

	if (session.user.role === "commercial") {
		return true;
	}

	if (session.user.role === "client") {
		return getClientOwnerUserId(client) === session.user.id;
	}

	return false;
}

export function canUpdateClient(
	session: SessionLike,
	client: ClientAccessTarget,
) {
	if (!session?.user) {
		return false;
	}

	if (session.user.role === "admin") {
		return true;
	}

	if (session.user.role === "client") {
		return getClientOwnerUserId(client) === session.user.id;
	}

	return false;
}
