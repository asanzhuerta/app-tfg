import { getDataSource } from "@/lib/typeorm/data-source";
import { UserAccessLog } from "@/lib/typeorm/entities/UserAccessLog";

type PersistedAccessSessionInput = {
	sessionToken: string;
	userId?: string | null;
};

export async function isPersistedAccessSessionActive(
	input: PersistedAccessSessionInput,
) {
	const sessionToken = String(input.sessionToken ?? "").trim();

	if (!sessionToken) {
		return false;
	}

	const ds = await getDataSource();
	const accessLogRepo = ds.getRepository(UserAccessLog);
	const query = accessLogRepo
		.createQueryBuilder("log")
		.where("log.session_token = :sessionToken", {
			sessionToken,
		})
		.andWhere("log.revoked_at IS NULL");

	if (input.userId) {
		query.andWhere("log.user_id = :userId", {
			userId: input.userId,
		});
	}

	const activeSessionCount = await query.getCount();
	return activeSessionCount > 0;
}
