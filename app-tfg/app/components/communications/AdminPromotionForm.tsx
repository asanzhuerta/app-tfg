"use client";

import Image from "next/image";
import { sanitizeDownloadFileName } from "@/lib/cloudinary-url";
import type {
	ChangeEvent,
	Dispatch,
	FormEvent,
	SetStateAction,
} from "react";
import type {
	ClientOptionView,
	ProductLineOptionView,
	ProductOptionView,
	PromotionDiscountTypeView,
	SegmentView,
} from "./communication-view-types";
import type { PromotionFormState } from "./admin-communication-forms";
import { getPromotionAttachmentHref } from "./admin-communication-utils";
import DeliveryChannelsField from "./DeliveryChannelsField";
import ProductSearchField from "./ProductSearchField";

type SubmitHandler = (
	event: FormEvent<HTMLFormElement>,
) => void | Promise<void>;

type PromotionAttachmentKind = "image" | "pdf";

type AdminPromotionFormProps = {
	form: PromotionFormState;
	setForm: Dispatch<SetStateAction<PromotionFormState>>;
	className: string;
	isOpen: boolean;
	isEditing: boolean;
	isSubmitPending: boolean;
	pendingAction: string | null;
	clients: ClientOptionView[];
	products: ProductOptionView[];
	productLines: ProductLineOptionView[];
	promotionDiscountTypes: PromotionDiscountTypeView[];
	segments: SegmentView[];
	giftProductQuery: string;
	productQuery: string;
	onGiftProductQueryChange: (value: string) => void;
	onProductQueryChange: (value: string) => void;
	onAttachmentUpload: (
		event: ChangeEvent<HTMLInputElement>,
		kind: PromotionAttachmentKind,
	) => void | Promise<void>;
	onClose: () => void;
	onSubmit: SubmitHandler;
};

export function AdminPromotionForm({
	form,
	setForm,
	className,
	isOpen,
	isEditing,
	isSubmitPending,
	pendingAction,
	clients,
	products,
	productLines,
	promotionDiscountTypes,
	segments,
	giftProductQuery,
	productQuery,
	onGiftProductQueryChange,
	onProductQueryChange,
	onAttachmentUpload,
	onClose,
	onSubmit,
}: AdminPromotionFormProps) {
	return (
		<form
			onSubmit={onSubmit}
			role="dialog"
			aria-modal={isOpen}
			className={className}
		>
			<div className="flex items-start justify-between gap-3">
				<div>
					<h2 className="text-lg font-semibold text-slate-900">
						{isEditing ? "Editar promoción" : "Nueva promoción"}
					</h2>
					<p className="text-sm text-slate-500">
						Define campañas globales, por rango o por cliente.
					</p>
				</div>
				<button
					type="button"
					onClick={onClose}
					className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
				>
					Cerrar
				</button>
			</div>

			<input
				required
				placeholder="Título"
				value={form.title}
				onChange={(event) =>
					setForm((current) => ({
						...current,
						title: event.target.value,
					}))
				}
				className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
			/>
			<textarea
				required
				placeholder="Descripción"
				value={form.description}
				onChange={(event) =>
					setForm((current) => ({
						...current,
						description: event.target.value,
					}))
				}
				className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
			/>
			<div className="grid gap-3 md:grid-cols-2">
				<select
					value={form.promotionDiscountTypeCode}
					onChange={(event) => {
						const nextDiscountTypeCode = event.target.value;

						if (nextDiscountTypeCode !== "gift_product") {
							onGiftProductQueryChange("");
						}

						setForm((current) => ({
							...current,
							promotionDiscountTypeCode: nextDiscountTypeCode,
							promotionType:
								promotionDiscountTypes.find(
									(discountType) =>
										discountType.code === nextDiscountTypeCode,
								)?.name ?? "",
							discountPercentage:
								nextDiscountTypeCode === "gift_product"
									? ""
									: current.discountPercentage,
							minimumOrderAmount:
								nextDiscountTypeCode === "volume_percentage_discount"
									? current.minimumOrderAmount
									: "",
							giftProductId:
								nextDiscountTypeCode === "gift_product"
									? current.giftProductId
									: "",
							giftDescription:
								nextDiscountTypeCode === "gift_product"
									? current.giftDescription
									: "",
						}));
					}}
					className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
				>
					{promotionDiscountTypes.map((discountType) => (
						<option key={discountType.id} value={discountType.code}>
							{discountType.name}
						</option>
					))}
				</select>
				<input
					placeholder="Beneficio visible (opcional)"
					value={form.benefit}
					onChange={(event) =>
						setForm((current) => ({
							...current,
							benefit: event.target.value,
						}))
					}
					className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
				/>
				{form.promotionDiscountTypeCode !== "gift_product" ? (
					<input
						required
						type="number"
						min="0.01"
						max="100"
						step="0.01"
						placeholder="Porcentaje de descuento"
						value={form.discountPercentage}
						onChange={(event) =>
							setForm((current) => ({
								...current,
								discountPercentage: event.target.value,
							}))
						}
						className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
					/>
				) : null}
				{form.promotionDiscountTypeCode === "volume_percentage_discount" ? (
					<input
						required
						type="number"
						min="0"
						step="0.01"
						placeholder="Importe mínimo del pedido"
						value={form.minimumOrderAmount}
						onChange={(event) =>
							setForm((current) => ({
								...current,
								minimumOrderAmount: event.target.value,
							}))
						}
						className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
					/>
				) : null}
				{form.promotionDiscountTypeCode === "gift_product" ? (
					<>
						<ProductSearchField
							id="promotion-gift-product"
							placeholder="Producto de regalo opcional"
							value={form.giftProductId}
							query={giftProductQuery}
							products={products}
							onChange={(nextProductId) =>
								setForm((current) => ({
									...current,
									giftProductId: nextProductId,
								}))
							}
							onQueryChange={onGiftProductQueryChange}
						/>
						<input
							placeholder="Regalo externo o merchandising"
							value={form.giftDescription}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									giftDescription: event.target.value,
								}))
							}
							className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
						/>
					</>
				) : null}
				<input
					required
					type="date"
					value={form.startDate}
					onChange={(event) =>
						setForm((current) => ({
							...current,
							startDate: event.target.value,
						}))
					}
					className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
				/>
				<input
					required
					type="date"
					value={form.endDate}
					onChange={(event) =>
						setForm((current) => ({
							...current,
							endDate: event.target.value,
						}))
					}
					className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
				/>
				<select
					value={form.status}
					onChange={(event) =>
						setForm((current) => ({
							...current,
							status: event.target.value,
						}))
					}
					className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
				>
					<option value="draft">Borrador</option>
					<option value="active">Activa</option>
					<option value="archived">Archivada</option>
				</select>
				<select
					value={form.productLineId}
					onChange={(event) =>
						setForm((current) => ({
							...current,
							productLineId: event.target.value,
						}))
					}
					className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
				>
					<option value="">Línea opcional</option>
					{productLines.map((productLine) => (
						<option key={productLine.id} value={productLine.id}>
							{productLine.name}
						</option>
					))}
				</select>
				<ProductSearchField
					id="promotion-target-product"
					placeholder="Producto opcional"
					value={form.productId}
					query={productQuery}
					products={products}
					onChange={(nextProductId) =>
						setForm((current) => ({
							...current,
							productId: nextProductId,
						}))
					}
					onQueryChange={onProductQueryChange}
				/>
				<select
					value={form.clientId}
					onChange={(event) =>
						setForm((current) => ({
							...current,
							clientId: event.target.value,
							customerSegmentId: "",
						}))
					}
					className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
				>
					<option value="">Cliente opcional</option>
					{clients.map((client) => (
						<option key={client.id} value={client.id}>
							{client.name}
						</option>
					))}
				</select>
				<select
					value={form.customerSegmentId}
					onChange={(event) =>
						setForm((current) => ({
							...current,
							customerSegmentId: event.target.value,
							clientId: "",
						}))
					}
					className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
				>
					<option value="">Rango opcional</option>
					{segments.map((segment) => (
						<option key={segment.id} value={segment.id}>
							{segment.name}
						</option>
					))}
				</select>
			</div>
			<div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
				<div>
					<p className="text-sm font-semibold text-slate-900">
						Imagen de la promoción
					</p>
					<p className="mt-1 text-xs text-slate-500">
						Se muestra junto al texto en el listado de promociones.
					</p>
					<div className="mt-3 flex flex-wrap items-center gap-2">
						<label className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
							{pendingAction === "promotion-upload-image"
								? "Subiendo..."
								: form.imageUrl
									? "Cambiar imagen"
									: "Adjuntar imagen"}
							<input
								type="file"
								accept="image/*"
								onChange={(event) => onAttachmentUpload(event, "image")}
								className="sr-only"
							/>
						</label>
						{form.imageUrl ? (
							<button
								type="button"
								onClick={() =>
									setForm((current) => ({
										...current,
										imageUrl: "",
									}))
								}
								className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
							>
								Quitar
							</button>
						) : null}
					</div>
					{form.imageUrl ? (
						<Image
							src={form.imageUrl}
							alt="Imagen de la promoción"
							width={640}
							height={240}
							unoptimized
							className="mt-3 h-28 w-full rounded-2xl object-cover"
						/>
					) : null}
				</div>
				<div>
					<p className="text-sm font-semibold text-slate-900">PDF adjunto</p>
					<p className="mt-1 text-xs text-slate-500">
						Permite conservar bases, folleto o documento comercial.
					</p>
					<div className="mt-3 flex flex-wrap items-center gap-2">
						<label className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
							{pendingAction === "promotion-upload-pdf"
								? "Subiendo..."
								: form.attachmentUrl
									? "Cambiar PDF"
									: "Adjuntar PDF"}
							<input
								type="file"
								accept="application/pdf"
								onChange={(event) => onAttachmentUpload(event, "pdf")}
								className="sr-only"
							/>
						</label>
						{form.attachmentUrl ? (
							<>
								<a
									href={getPromotionAttachmentHref(form)}
									download={sanitizeDownloadFileName(
										form.attachmentName || `${form.title}.pdf`,
										"promocion.pdf",
										{ ensurePdfExtension: true },
									)}
									className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
								>
									Descargar PDF
								</a>
								<button
									type="button"
									onClick={() =>
										setForm((current) => ({
											...current,
											attachmentUrl: "",
											attachmentName: "",
											attachmentMimeType: "",
										}))
									}
									className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
								>
									Quitar
								</button>
							</>
						) : null}
					</div>
					{form.attachmentName ? (
						<p className="mt-3 truncate text-xs font-medium text-slate-600">
							{form.attachmentName}
						</p>
					) : null}
				</div>
			</div>
			<DeliveryChannelsField
				deliveryChannels={form.deliveryChannels}
				onChange={(deliveryChannels) =>
					setForm((current) => ({
						...current,
						deliveryChannels,
					}))
				}
			/>
			<div className="flex flex-wrap gap-2">
				<button
					type="submit"
					disabled={isSubmitPending}
					className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
				>
					{isEditing ? "Guardar cambios" : "Crear promoción"}
				</button>
				{isEditing ? (
					<button
						type="button"
						onClick={onClose}
						className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
					>
						Cancelar edición
					</button>
				) : null}
			</div>
		</form>
	);
}
