import {
	getCloudinaryAttachmentDownloadUrl,
	isPdfResourceUrl,
} from "@/lib/cloudinary-url";

export function getPromotionAttachmentHref(promotion: {
	attachmentUrl: string | null;
	attachmentName: string | null;
	attachmentMimeType: string | null;
}) {
	if (!promotion.attachmentUrl) {
		return "";
	}

	if (
		isPdfResourceUrl(
			promotion.attachmentUrl,
			promotion.attachmentMimeType,
			promotion.attachmentName,
		)
	) {
		return getCloudinaryAttachmentDownloadUrl(
			promotion.attachmentUrl,
			promotion.attachmentName,
		);
	}

	return promotion.attachmentUrl;
}
