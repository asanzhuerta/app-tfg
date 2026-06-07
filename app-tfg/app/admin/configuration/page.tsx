import NavCard from "../../components/NavCard";
import PageTransition from "../../components/animations/PageTransition";
import { ReportsIcon, SettingsIcon } from "../../components/IconsSVGs";

const navItems = [
	{
		title: "Integraciones",
		icon: <SettingsIcon className="h-6 w-6" />,
		href: "/admin/integrations",
	},
	{
		title: "Soporte técnico",
		icon: <ReportsIcon className="h-6 w-6" />,
		href: "/admin/support",
	},
	{
		title: "Ajustes globales",
		icon: <SettingsIcon className="h-6 w-6" />,
		href: "/admin/settings",
	},
];

export default function AdminConfigurationHome() {
	return (
		<PageTransition>
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
				{navItems.map((item) => (
					<NavCard
						key={item.title}
						title={item.title}
						icon={item.icon}
						href={item.href}
					/>
				))}
			</div>
		</PageTransition>
	);
}
