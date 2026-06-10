"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

type PageTransitionProps = {
	children: React.ReactNode;
	isLeaving?: boolean;
	className?: string;
	durationMs?: number;
	onExited?: () => void;
};

type TransitionPhase = "entering" | "entered" | "leaving";

function isIOSDevice() {
	if (typeof window === "undefined") return false;

	const ua = window.navigator.userAgent;
	const platform = window.navigator.platform;

	return (
		/iPad|iPhone|iPod/.test(ua) ||
		(platform === "MacIntel" && navigator.maxTouchPoints > 1)
	);
}

export default function PageTransition({
	children,
	isLeaving = false,
	className = "",
	durationMs = 500,
	onExited,
}: PageTransitionProps) {
	const [phase, setPhase] = useState<TransitionPhase>("entering");
	const isIOS = useSyncExternalStore(
		() => () => {},
		() => isIOSDevice(),
		() => false,
	);
	const exitCallbackCalledRef = useRef(false);

	// Detecta iOS y lanza la animación de entrada al montar
	useEffect(() => {
		const enterTimer = window.setTimeout(() => {
			setPhase("entered");
		}, 30);

		// Failsafe extra para Safari/PWA:
		// aunque algo raro ocurra con el primer timeout o con la hidratación,
		// forzamos igualmente el estado visible poco después.
		const visibleFallbackTimer = window.setTimeout(() => {
			setPhase((current) => (current === "entering" ? "entered" : current));
		}, 220);

		return () => {
			window.clearTimeout(enterTimer);
			window.clearTimeout(visibleFallbackTimer);
		};
	}, []);

	// Cuando isLeaving pasa a true, activa la fase de salida
	useEffect(() => {
		if (!isLeaving) {
			exitCallbackCalledRef.current = false;
			return;
		}

		const leaveTimer = window.setTimeout(() => {
			setPhase("leaving");
		}, 0);

		const exitTimer = window.setTimeout(() => {
			if (!exitCallbackCalledRef.current) {
				exitCallbackCalledRef.current = true;
				onExited?.();
			}
		}, durationMs);

		return () => {
			window.clearTimeout(leaveTimer);
			window.clearTimeout(exitTimer);
		};
	}, [isLeaving, durationMs, onExited]);

	const baseTransition = isIOS
		? "transition-opacity ease-out"
		: "transition-all ease-out";
	const transitionHint = !isIOS && phase !== "entered" ? "will-change-transform" : "";

	const durationStyle = {
		transitionDuration: `${durationMs}ms`,
	};

	// ============================================================================
	// ESTADOS VISUALES
	// ============================================================================
	// iOS: mejor limitarse a opacidad para evitar glitches
	// Resto: opacidad + pequeña escala + desplazamiento vertical
	let transitionClass = "";

	if (isIOS) {
		if (phase === "entering") {
			transitionClass = "opacity-0";
		} else if (phase === "entered") {
			transitionClass = "opacity-100";
		} else {
			transitionClass = "opacity-0";
		}
	} else {
		if (phase === "entering") {
			transitionClass = "opacity-0 scale-95 translate-y-4";
		} else if (phase === "entered") {
			transitionClass = "opacity-100";
		} else {
			transitionClass = "opacity-0 scale-95 -translate-y-2";
		}
	}

	return (
		<div
			className={`${baseTransition} ${transitionHint} ${transitionClass} ${className}`}
			style={durationStyle}
		>
			{children}
		</div>
	);
}
