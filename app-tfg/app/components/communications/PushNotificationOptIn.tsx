"use client";

import { useEffect, useState } from "react";
import { ApiClientError, requestJson } from "@/lib/api/client";

type PushKeyResponse = {
	configured: boolean;
	publicKey: string | null;
};

type PushStatus =
	| "checking"
	| "unsupported"
	| "not_configured"
	| "available"
	| "enabled"
	| "denied";

function getErrorMessage(error: unknown, fallback: string) {
	return error instanceof ApiClientError ? error.message : fallback;
}

function urlBase64ToUint8Array(base64String: string) {
	const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
	const base64 = `${base64String}${padding}`
		.replace(/-/g, "+")
		.replace(/_/g, "/");
	const rawData = window.atob(base64);
	const outputArray = new Uint8Array(rawData.length);

	for (let index = 0; index < rawData.length; index += 1) {
		outputArray[index] = rawData.charCodeAt(index);
	}

	return outputArray;
}

function isPushSupported() {
	return (
		typeof window !== "undefined" &&
		"isSecureContext" in window &&
		window.isSecureContext &&
		"Notification" in window &&
		"serviceWorker" in navigator &&
		"PushManager" in window
	);
}

export default function PushNotificationOptIn() {
	const [status, setStatus] = useState<PushStatus>("checking");
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const [pending, setPending] = useState(false);

	useEffect(() => {
		let mounted = true;

		async function loadStatus() {
			if (!isPushSupported()) {
				if (mounted) setStatus("unsupported");
				return;
			}

			if (Notification.permission === "denied") {
				if (mounted) setStatus("denied");
				return;
			}

			try {
				const keyResponse = await requestJson<PushKeyResponse>(
					"/api/communications/push-subscriptions/public-key",
					{ fallbackMessage: "No se pudo comprobar la configuración push" },
				);

				if (!keyResponse?.configured || !keyResponse.publicKey) {
					if (mounted) setStatus("not_configured");
					return;
				}

				const registration = await navigator.serviceWorker.ready;
				const subscription = await registration.pushManager.getSubscription();

				if (mounted) setStatus(subscription ? "enabled" : "available");
			} catch (error) {
				if (mounted) {
					setError(
						getErrorMessage(error, "No se pudo comprobar el estado push"),
					);
					setStatus("available");
				}
			}
		}

		void loadStatus();

		return () => {
			mounted = false;
		};
	}, []);

	async function enablePush() {
		setPending(true);
		setMessage("");
		setError("");

		try {
			const keyResponse = await requestJson<PushKeyResponse>(
				"/api/communications/push-subscriptions/public-key",
				{ fallbackMessage: "No se pudo obtener la clave push" },
			);

			if (!keyResponse?.configured || !keyResponse.publicKey) {
				setStatus("not_configured");
				return;
			}

			const permission = await Notification.requestPermission();

			if (permission !== "granted") {
				setStatus(permission === "denied" ? "denied" : "available");
				return;
			}

			const registration = await navigator.serviceWorker.ready;
			const subscription = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(keyResponse.publicKey),
			});

			await requestJson("/api/communications/push-subscriptions", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(subscription.toJSON()),
				fallbackMessage: "No se pudo activar push",
			});

			setStatus("enabled");
			setMessage("Push activado en este dispositivo");
		} catch (error) {
			setError(getErrorMessage(error, "No se pudo activar push"));
		} finally {
			setPending(false);
		}
	}

	async function disablePush() {
		setPending(true);
		setMessage("");
		setError("");

		try {
			const registration = await navigator.serviceWorker.ready;
			const subscription = await registration.pushManager.getSubscription();
			const endpoint = subscription?.endpoint ?? null;

			if (subscription) {
				await subscription.unsubscribe();
			}

			await requestJson("/api/communications/push-subscriptions", {
				method: "DELETE",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ endpoint }),
				fallbackMessage: "No se pudo desactivar push",
			});

			setStatus("available");
			setMessage("Push desactivado en este dispositivo");
		} catch (error) {
			setError(getErrorMessage(error, "No se pudo desactivar push"));
		} finally {
			setPending(false);
		}
	}

	const statusLabel: Record<PushStatus, string> = {
		checking: "Comprobando",
		unsupported: "No disponible",
		not_configured: "Pendiente de configurar",
		available: "Disponible",
		enabled: "Activo",
		denied: "Bloqueado",
	};

	return (
		<section className="rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-sm">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
						Push PWA
					</p>
					<h3 className="mt-1 text-lg font-semibold text-slate-900">
						Notificaciones del dispositivo
					</h3>
				</div>
				<span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
					{statusLabel[status]}
				</span>
			</div>

			<div className="mt-4 flex flex-wrap gap-2">
				{status === "available" ? (
					<button
						type="button"
						onClick={enablePush}
						disabled={pending}
						className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
					>
						Activar push
					</button>
				) : null}
				{status === "enabled" ? (
					<button
						type="button"
						onClick={disablePush}
						disabled={pending}
						className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
					>
						Desactivar push
					</button>
				) : null}
			</div>

			{message ? (
				<p className="mt-3 text-sm text-emerald-700">{message}</p>
			) : null}
			{error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
			{status === "denied" ? (
				<p className="mt-3 text-sm text-slate-500">
					Permiso bloqueado en este navegador.
				</p>
			) : null}
		</section>
	);
}
