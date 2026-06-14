import AdminClientTierPolicySettingsForm from "@/app/components/admin/AdminClientTierPolicySettingsForm";
import AdminNotificationSettingsForm from "@/app/components/admin/AdminNotificationSettingsForm";
import AdminOrderBusinessSettingsForm from "@/app/components/admin/AdminOrderBusinessSettingsForm";
import PageTransition from "@/app/components/animations/PageTransition";
import H1Title from "@/app/components/H1Title";
import { getClientTierPolicySettings } from "@/lib/typeorm/services/clients/client-tier-settings";
import { getOrderBusinessSettings } from "@/lib/typeorm/services/orders/order-settings";

export default async function AdminSettingsPage() {
	const [orderSettings, clientTierSettings] = await Promise.all([
		getOrderBusinessSettings(),
		getClientTierPolicySettings(),
	]);

	return (
		<PageTransition>
			<div className="space-y-5">
				<H1Title title="Ajustes globales" subtitle="Canales de avisos" />

				<AdminOrderBusinessSettingsForm initialSettings={orderSettings} />
				<AdminClientTierPolicySettingsForm
					initialSettings={clientTierSettings}
				/>
				<AdminNotificationSettingsForm />
			</div>
		</PageTransition>
	);
}
