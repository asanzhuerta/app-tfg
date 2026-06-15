"use client";

import type { NotificationDeliveryChannel } from "@/lib/contracts/communications";
import {
	hasDeliveryChannel,
	updateDeliveryChannels,
} from "./admin-communication-utils";

type Props = {
	deliveryChannels: NotificationDeliveryChannel[];
	onChange: (deliveryChannels: NotificationDeliveryChannel[]) => void;
};

export default function DeliveryChannelsField({
	deliveryChannels,
	onChange,
}: Props) {
	const form = { deliveryChannels };

	return (
		<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
			<p className="text-sm font-semibold text-slate-900">Canales de aviso</p>
			<div className="mt-3 grid gap-2 sm:grid-cols-3">
				<label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
					<input
						type="checkbox"
						checked
						disabled
						className="h-4 w-4 rounded border-slate-300"
					/>
					Interna
				</label>
				<label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
					<input
						type="checkbox"
						checked={hasDeliveryChannel(form, "email")}
						onChange={(event) =>
							onChange(
								updateDeliveryChannels(
									deliveryChannels,
									"email",
									event.target.checked,
								),
							)
						}
						className="h-4 w-4 rounded border-slate-300"
					/>
					Email
				</label>
				<label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
					<input
						type="checkbox"
						checked={hasDeliveryChannel(form, "push")}
						onChange={(event) =>
							onChange(
								updateDeliveryChannels(
									deliveryChannels,
									"push",
									event.target.checked,
								),
							)
						}
						className="h-4 w-4 rounded border-slate-300"
					/>
					Push
				</label>
			</div>
		</div>
	);
}
