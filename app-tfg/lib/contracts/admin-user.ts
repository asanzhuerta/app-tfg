import { ROLE_IDS } from "@/lib/typeorm/constants/catalog-ids";

export type AdminUserType = "comercial" | "cliente";

export type CreateAdminUserBody = {
	name?: string;
	email?: string;
	password?: string;
	company?: string | null;
	phone?: string | null;
	roleId?: number | string;
};

export type RegisterAdminUserBody = {
	name?: string;
	email?: string;
	password?: string;
	company?: string | null;
	phone?: string | null;
	type?: AdminUserType;
	commercialId?: string | null;
};

export type RegisterAdminUserResponse = {
	message: string;
	userId: string;
};

export type AdminUserAuditBody = {
	reason?: string | null;
	notes?: string | null;
};

export type ChangeAdminUserPasswordBody = AdminUserAuditBody & {
	newPassword?: string;
};

export type UpdateAdminUserRoleBody = AdminUserAuditBody & {
	roleId?: number | string;
	newRoleId?: number | string;
};

export type UpdateAdminUserStatusBody = AdminUserAuditBody & {
	statusId?: number | string;
};

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
