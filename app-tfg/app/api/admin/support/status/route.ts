import { NextResponse } from "next/server";
import { requireRoleUser, unauthorizedError } from "@/lib/api/server";
import {
	listSupportCapabilityItems,
	summarizeSupportCapabilityItems,
} from "@/lib/support/operational-support";

export async function GET() {
	const user = await requireRoleUser("admin");

	if (!user) {
		return unauthorizedError();
	}

	const items = listSupportCapabilityItems();

	return NextResponse.json(
		{
			summary: summarizeSupportCapabilityItems(items),
			items,
		},
		{ status: 200 },
	);
}
