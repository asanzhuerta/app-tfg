import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { OrderProductOption, OrderSummary } from "@/lib/contracts/order";
import {
	fetchOrderDraft,
	fetchOrderProductOptionsForClient,
	getOrderRequestErrorMessage,
} from "./order-workspace-api";

export type OrderWorkspaceFeedback = {
	type: "success" | "error";
	message: string;
} | null;

type UseOrderWorkspaceRemoteStateInput = {
	apiPath: string;
	mode: "client" | "commercial";
	productOptions: OrderProductOption[];
	selectedClientId: string;
	showOrderForm: boolean;
	setCurrentProductOptions: Dispatch<SetStateAction<OrderProductOption[]>>;
	setFeedback: Dispatch<SetStateAction<OrderWorkspaceFeedback>>;
	syncDraftState: (nextDraftOrder: OrderSummary | null) => void;
};

export function useOrderWorkspaceRemoteState({
	apiPath,
	mode,
	productOptions,
	selectedClientId,
	showOrderForm,
	setCurrentProductOptions,
	setFeedback,
	syncDraftState,
}: UseOrderWorkspaceRemoteStateInput) {
	const [loadingDraft, setLoadingDraft] = useState(false);
	const [loadingProductOptions, setLoadingProductOptions] = useState(false);

	useEffect(() => {
		setCurrentProductOptions(productOptions);
	}, [productOptions, setCurrentProductOptions]);

	useEffect(() => {
		if (mode !== "client" || !showOrderForm) {
			return;
		}

		let isCancelled = false;

		async function loadDraft() {
			setLoadingDraft(true);

			try {
				const draft = await fetchOrderDraft(apiPath);

				if (!isCancelled) {
					syncDraftState(draft && "id" in draft ? draft : null);
				}
			} catch (error) {
				console.error("[orders][client-draft][load] error:", error);

				if (!isCancelled) {
					setFeedback({
						type: "error",
						message: getOrderRequestErrorMessage(
							error,
							"Ha ocurrido un error inesperado al cargar el pedido en curso.",
						),
					});
				}
			} finally {
				if (!isCancelled) {
					setLoadingDraft(false);
				}
			}
		}

		loadDraft();

		return () => {
			isCancelled = true;
		};
	}, [apiPath, mode, setFeedback, showOrderForm, syncDraftState]);

	useEffect(() => {
		if (mode !== "commercial") {
			return;
		}

		if (!selectedClientId) {
			setCurrentProductOptions(productOptions);
			return;
		}

		let isCancelled = false;

		async function loadProductOptions() {
			setLoadingProductOptions(true);

			try {
				const nextProductOptions = await fetchOrderProductOptionsForClient(
					apiPath,
					selectedClientId,
				);

				if (!isCancelled) {
					setCurrentProductOptions(Array.isArray(nextProductOptions)
						? nextProductOptions
						: productOptions);
				}
			} catch (error) {
				console.error("[orders][product-options][load] error:", error);

				if (!isCancelled) {
					setFeedback({
						type: "error",
						message: getOrderRequestErrorMessage(
							error,
							"Ha ocurrido un error inesperado al cargar las promociones del cliente.",
						),
					});
				}
			} finally {
				if (!isCancelled) {
					setLoadingProductOptions(false);
				}
			}
		}

		loadProductOptions();

		return () => {
			isCancelled = true;
		};
	}, [
		apiPath,
		mode,
		productOptions,
		selectedClientId,
		setCurrentProductOptions,
		setFeedback,
	]);

	useEffect(() => {
		if (mode !== "commercial") {
			return;
		}

		if (!selectedClientId) {
			syncDraftState(null);
			return;
		}

		let isCancelled = false;

		async function loadDraft() {
			setLoadingDraft(true);

			try {
				const draft = await fetchOrderDraft(apiPath, selectedClientId);

				if (!isCancelled) {
					syncDraftState(draft && "id" in draft ? draft : null);
				}
			} catch (error) {
				console.error("[orders][draft][load] error:", error);

				if (!isCancelled) {
					setFeedback({
						type: "error",
						message: getOrderRequestErrorMessage(
							error,
							"Ha ocurrido un error inesperado al cargar el pedido en curso.",
						),
					});
				}
			} finally {
				if (!isCancelled) {
					setLoadingDraft(false);
				}
			}
		}

		loadDraft();

		return () => {
			isCancelled = true;
		};
	}, [apiPath, mode, selectedClientId, setFeedback, syncDraftState]);

	return {
		loadingDraft,
		loadingProductOptions,
	};
}
