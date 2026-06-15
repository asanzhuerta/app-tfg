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
