"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
	useEffect(() => {
		if (!("serviceWorker" in navigator)) {
			return;
		}

		if (process.env.NODE_ENV !== "production") {
			navigator.serviceWorker
				.getRegistrations()
				.then((registrations) =>
					Promise.all(registrations.map((registration) => registration.unregister())),
				)
				.catch((error) =>
					console.error("Error desregistrando SW en desarrollo:", error),
				);
			return;
		}

			navigator.serviceWorker
				.register("/sw.js")
				.catch((error) => console.error("Error registrando SW:", error));
	}, []);

	return null;
}
