import { ROLE_IDS } from "@/lib/typeorm/constants/catalog-ids";
import type {
	AdminUserType,
	UpdateAdminUserRoleBody,
} from "@/lib/contracts/admin-user";

export function resolveAdminUserRoleId(type: AdminUserType | undefined) {
	if (type === "comercial") {
		return ROLE_IDS.COMMERCIAL;
	}

	if (type === "cliente") {
		return ROLE_IDS.CLIENT;
	}

	return 0;
}

export function resolveNextAdminRoleId(body: UpdateAdminUserRoleBody) {
	return Number(body.roleId ?? body.newRoleId);
}
