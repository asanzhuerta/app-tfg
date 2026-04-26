import NavCard from "../../components/NavCard";
import PageTransition from "../../components/animations/PageTransition";
import { ClientsIcon, RegisterRequestsIcon } from "../../components/IconsSVGs";

// Opciones de navegación para la gestión de clientes en el admin panel
const navItems = [
	{
		title: "Lista de clientes",
		icon: <ClientsIcon className="h-6 w-6" />,
		href: "/admin/clients/list",
	},
	{
		title: "Asignaciones comerciales",
		icon: <RegisterRequestsIcon className="h-6 w-6" />,
		href: "/admin/clients/assignments",
	},
];

// Página de inicio para la gestión de clientes en el admin panel.
export default function AdminClientsHome() {
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
