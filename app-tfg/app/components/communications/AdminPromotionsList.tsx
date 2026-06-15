"use client";

import Image from "next/image";
import { sanitizeDownloadFileName } from "@/lib/cloudinary-url";
import type { PromotionView } from "./communication-view-types";
import {
	formatDate,
	getPromotionAttachmentHref,
} from "./admin-communication-utils";
import StatusBadge from "./StatusBadge";

type AdminPromotionsListProps = {
	promotions: PromotionView[];
	pendingAction: string | null;
	confirmDeleteAction: string | null;
	onStatusChange: (id: string, status: string) => void;
	onEdit: (promotion: PromotionView) => void;
	onDelete: (id: string) => void;
};

export function AdminPromotionsList({
	promotions,
	pendingAction,
	confirmDeleteAction,
	onStatusChange,
	onEdit,
	onDelete,
}: AdminPromotionsListProps) {
	if (!promotions.length) {
		return (
			<p className="rounded-2xl border border-dashed border-slate-200 bg-white/75 p-4 text-sm text-slate-500">
				Sin promociones registradas.
			</p>
		);
	}

	return (
		<div className="space-y-3">
			{promotions.map((promotion) => {
				const isActivePromotion = promotion.status === "active";

				return (
					<article
						key={promotion.id}
						className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm"
					>
						<div className="flex flex-wrap items-start justify-between gap-3">
							<div className="min-w-0 flex-1">
								<h3 className="font-semibold text-slate-900">
									{promotion.title}
								</h3>
								<p className="mt-1 text-sm text-slate-600">
									{promotion.description}
								</p>
							</div>
							{promotion.imageUrl ? (
								<Image
									src={promotion.imageUrl}
									alt="Imagen de la promoción"
									width={180}
									height={120}
									unoptimized
									className="h-24 w-36 rounded-2xl object-cover"
								/>
							) : null}
							<StatusBadge status={promotion.status} />
						</div>
						<p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
							{promotion.promotionDiscountTypeName}
						</p>
						<p className="mt-3 text-sm font-medium text-slate-800">
							{promotion.benefit}
						</p>
						{promotion.attachmentUrl ? (
							<a
								href={getPromotionAttachmentHref(promotion)}
								download={sanitizeDownloadFileName(
									promotion.attachmentName || `${promotion.title}.pdf`,
									"promocion.pdf",
									{ ensurePdfExtension: true },
								)}
								className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
							>
								{promotion.attachmentName || "Ver PDF adjunto"}
							</a>
						) : null}
						<p className="mt-2 text-xs text-slate-500">
							{formatDate(promotion.startDate)} - {formatDate(promotion.endDate)}
						</p>
						<p className="mt-2 text-xs text-slate-500">
							Ámbito:{" "}
							{promotion.clientName ??
								promotion.customerSegmentName ??
								"Global"}
							{promotion.productName
								? ` - Producto: ${promotion.productName}`
								: ""}
							{promotion.productLineName
								? ` - Línea: ${promotion.productLineName}`
								: ""}
						</p>
						<div className="mt-3 flex flex-wrap gap-2">
							{isActivePromotion ? (
								<button
									type="button"
									onClick={() => onStatusChange(promotion.id, "archived")}
									disabled={pendingAction === `promotion-${promotion.id}`}
									className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600"
								>
									Archivar
								</button>
							) : (
								<button
									type="button"
									onClick={() => onStatusChange(promotion.id, "active")}
									disabled={pendingAction === `promotion-${promotion.id}`}
									className="rounded-lg border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700"
								>
									Activar
								</button>
							)}
							<button
								type="button"
								onClick={() => onEdit(promotion)}
								className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600"
							>
								Editar
							</button>
							{!isActivePromotion ? (
								<button
									type="button"
									onClick={() => onDelete(promotion.id)}
									disabled={
										pendingAction === `promotion-delete-${promotion.id}`
									}
									className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-medium text-rose-700"
								>
									{confirmDeleteAction ===
									`promotion-delete-${promotion.id}`
										? "Confirmar eliminar"
										: "Eliminar"}
								</button>
							) : null}
						</div>
					</article>
				);
			})}
		</div>
	);
}
