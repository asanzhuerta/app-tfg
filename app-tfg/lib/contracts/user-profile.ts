import type { ClientProfilePayload } from "@/lib/contracts/client-profile";

export type UpdateOwnProfileBody = {
	name?: string;
	email?: string;
	company?: string | null;
	phone?: string | null;
	profile_image_url?: string | null;
	password?: string;
	confirmPassword?: string;
	clientProfile?: ClientProfilePayload | null;
};

export type UpdateAdminUserBody = UpdateOwnProfileBody & {
	roleId?: number;
	statusId?: number;
};

export type UpdateProfileResponse = {
	message: string;
};

export type UploadProfileImageResponse = {
	message: string;
	imageUrl: string;
	publicId: string;
};

export function buildAdminUserClientProfileUpdate(
	clientProfile: ClientProfilePayload | null | undefined,
) {
	if (!clientProfile) {
		return null;
	}

	return {
		name: clientProfile.name === null ? undefined : clientProfile.name,
		contact_name: clientProfile.contact_name,
		tax_id: clientProfile.tax_id,
		address:
			clientProfile.address === null ? undefined : clientProfile.address,
		city: clientProfile.city === null ? undefined : clientProfile.city,
		postal_code: clientProfile.postal_code,
		province: clientProfile.province,
		lat: clientProfile.lat,
		lng: clientProfile.lng,
		visit_window_start_time: clientProfile.visit_window_start_time,
		visit_window_end_time: clientProfile.visit_window_end_time,
		notes: clientProfile.notes,
	};
}
