import NavCard from "../../components/NavCard";
import PageTransition from "../../components/animations/PageTransition";
import {
	RegisterRequestsIcon,
	UserListIcon,
	UserPlusIcon,
} from "../../components/IconsSVGs";

// Opciones de navegación para la gestión de usuarios en el admin panel
const navItems = [
	{
		title: "Solicitudes de registro",
		icon: <RegisterRequestsIcon className="h-6 w-6" />,
		href: "/admin/users/requests",
	},
	{
		title: "Lista de usuarios",
		icon: <UserListIcon className="h-6 w-6" />,
		href: "/admin/users/list",
	},
	{
		title: "Registrar nuevo usuario",
		icon: <UserPlusIcon className="h-6 w-6" />,
		href: "/admin/users/register",
	},
];

// Página de inicio para el admin panel.
export default function AdminHome() {
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
