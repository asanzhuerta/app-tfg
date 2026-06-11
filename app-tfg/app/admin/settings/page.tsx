import AdminNotificationSettingsForm from "@/app/components/admin/AdminNotificationSettingsForm";
import PageTransition from "@/app/components/animations/PageTransition";
import H1Title from "@/app/components/H1Title";

export default function AdminSettingsPage() {
	return (
		<PageTransition>
			<div className="space-y-5">
				<H1Title title="Ajustes globales" subtitle="Canales de avisos" />

				<AdminNotificationSettingsForm />
			</div>
		</PageTransition>
	);
}
