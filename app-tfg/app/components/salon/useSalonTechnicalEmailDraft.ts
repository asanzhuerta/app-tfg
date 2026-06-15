import { useEffect, useMemo, useState } from "react";
import type {
	SalonServiceSummary,
	SalonTechnicalEmailDraft,
} from "@/lib/contracts/salon";
import {
	fetchSalonTechnicalEmailDraft,
	getSalonRequestErrorMessage,
} from "./salon-client-api";

export type SalonFeedbackState = {
	type: "success" | "error";
	message: string;
} | null;

type UseSalonTechnicalEmailDraftInput = {
	salonClientId: string;
	services: SalonServiceSummary[];
};

export function useSalonTechnicalEmailDraft({
	salonClientId,
	services,
}: UseSalonTechnicalEmailDraftInput) {
	const [technicalEmailDraftServiceId, setTechnicalEmailDraftServiceId] =
		useState<string | null>(null);
	const [technicalEmailDraft, setTechnicalEmailDraft] =
		useState<SalonTechnicalEmailDraft | null>(null);
	const [technicalEmailSubject, setTechnicalEmailSubject] = useState("");
	const [technicalEmailBody, setTechnicalEmailBody] = useState("");
	const [isLoadingTechnicalEmail, setIsLoadingTechnicalEmail] = useState(false);
	const [technicalEmailFeedback, setTechnicalEmailFeedback] =
		useState<SalonFeedbackState>(null);

	function resetTechnicalEmailDraft() {
		setTechnicalEmailDraftServiceId(null);
		setTechnicalEmailDraft(null);
		setTechnicalEmailSubject("");
		setTechnicalEmailBody("");
		setTechnicalEmailFeedback(null);
		setIsLoadingTechnicalEmail(false);
	}

	useEffect(() => {
		if (!technicalEmailDraftServiceId) {
			return;
		}

		const technicalEmailServiceStillExists = services.some(
			(service) => service.id === technicalEmailDraftServiceId,
		);

		if (!technicalEmailServiceStillExists) {
			resetTechnicalEmailDraft();
		}
	}, [services, technicalEmailDraftServiceId]);

	async function handleOpenTechnicalEmailDraft(service: SalonServiceSummary) {
		if (
			technicalEmailDraftServiceId === service.id &&
			!isLoadingTechnicalEmail
		) {
			resetTechnicalEmailDraft();
			return;
		}

		setTechnicalEmailDraftServiceId(service.id);
		setTechnicalEmailDraft(null);
		setTechnicalEmailSubject("");
		setTechnicalEmailBody("");
		setTechnicalEmailFeedback(null);
		setIsLoadingTechnicalEmail(true);

		try {
			const draft = await fetchSalonTechnicalEmailDraft(
				salonClientId,
				service.id,
			);

			setTechnicalEmailDraft(draft);
			setTechnicalEmailSubject(draft.subject);
			setTechnicalEmailBody(draft.body);
		} catch (error) {
			setTechnicalEmailFeedback({
				type: "error",
				message: getSalonRequestErrorMessage(
					error,
					"No se ha podido preparar el correo técnico.",
				),
			});
		} finally {
			setIsLoadingTechnicalEmail(false);
		}
	}

	async function handleCopyTechnicalEmailDraft() {
		if (!technicalEmailDraft) {
			return;
		}

		try {
			await navigator.clipboard.writeText(
				`Asunto: ${technicalEmailSubject}\n\n${technicalEmailBody}`,
			);
			setTechnicalEmailFeedback({
				type: "success",
				message: "Borrador técnico copiado al portapapeles.",
			});
		} catch {
			setTechnicalEmailFeedback({
				type: "error",
				message: "No se ha podido copiar el borrador técnico.",
			});
		}
	}

	const technicalEmailMailtoHref = useMemo(() => {
		if (!technicalEmailDraft?.recipient_email) {
			return null;
		}

		const params = new URLSearchParams({
			subject: technicalEmailSubject,
			body: technicalEmailBody,
		});

		return `mailto:${technicalEmailDraft.recipient_email}?${params.toString()}`;
	}, [technicalEmailBody, technicalEmailDraft, technicalEmailSubject]);

	return {
		technicalEmailDraftServiceId,
		technicalEmailDraft,
		technicalEmailSubject,
		setTechnicalEmailSubject,
		technicalEmailBody,
		setTechnicalEmailBody,
		isLoadingTechnicalEmail,
		technicalEmailFeedback,
		technicalEmailMailtoHref,
		handleOpenTechnicalEmailDraft,
		handleCopyTechnicalEmailDraft,
		resetTechnicalEmailDraft,
	};
}
