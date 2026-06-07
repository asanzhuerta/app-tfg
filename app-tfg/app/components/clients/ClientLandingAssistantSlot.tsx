"use client";

import { usePathname } from "next/navigation";
import AssistantCard from "@/app/components/AssistantCard";

export default function ClientLandingAssistantSlot() {
	const pathname = usePathname();

	if (pathname !== "/clients") {
		return null;
	}

	return (
		<div className="relative z-20 mb-5 flex justify-center lg:absolute lg:right-0 lg:top-1/2 lg:mb-0 lg:w-[min(26rem,38vw)] lg:-translate-y-1/2 lg:justify-end">
			<AssistantCard compact />
		</div>
	);
}
