import NavCard from "../components/NavCard";
import PageTransition from "../components/animations/PageTransition";
import RouteMapCard from "../components/RouteMapCard";

import {
	CatalogIcon,
	ColorIcon,
	OrderIcon,
	ProductsIcon,
	TrainingIcon,
	ClientsIcon,
	VisitsIcon,
	RouteIcon,
	ActivityIcon,
	PaymentsIcon,
	PromotionsIcon,
	ReportsIcon,
} from "../components/IconsSVGs";

const sections = [
	{
		title: "Gestión comercial",
		module: "M2",
		items: [
			{
				title: "Clientes",
				icon: <ClientsIcon className="h-6 w-6" />,
				href: "/commercials/clients",
			},
			{
				title: "Visitas",
				icon: <VisitsIcon className="h-6 w-6" />,
				href: "/commercials/visits",
			},
			{
				title: "Rutas",
				icon: <RouteIcon className="h-6 w-6" />,
				href: "/commercials/routes",
			},
			{
				title: "Actividad",
				icon: <ActivityIcon className="h-6 w-6" />,
				href: "/commercials/activity",
			},
		],
	},
	{
		title: "Catálogo y operativa comercial",
		module: "M3 · M4",
		items: [
			{
				title: "Catálogo",
				icon: <CatalogIcon className="h-6 w-6" />,
				href: "/commercials/catalog",
			},
			{
				title: "Coloración",
				icon: <ColorIcon className="h-6 w-6" />,
				href: "/commercials/color",
			},
			{
				title: "Productos",
				icon: <ProductsIcon className="h-6 w-6" />,
				href: "/commercials/products",
			},
			{
				title: "Pedidos",
				icon: <OrderIcon className="h-6 w-6" />,
				href: "/commercials/orders",
			},
			{
				title: "Cobros",
				icon: <PaymentsIcon className="h-6 w-6" />,
				href: "/commercials/payments",
			},
		],
	},
	{
		title: "Comunicación y seguimiento",
		module: "M6 · M7",
		items: [
			{
				title: "Promociones",
				icon: <PromotionsIcon className="h-6 w-6" />,
				href: "/commercials/promotions",
			},
			{
				title: "Formaciones",
				icon: <TrainingIcon className="h-6 w-6" />,
				href: "/commercials/training",
			},
			{
				title: "Informes",
				icon: <ReportsIcon className="h-6 w-6" />,
				href: "/commercials/reports",
			},
		],
	},
];

export default function CommercialsHome() {
	return (
		<PageTransition>
			<RouteMapCard />

			<div className="space-y-6">
				{sections.map((section) => (
					<section
						key={section.title}
						className="rounded-3xl border border-white/20 bg-white/10 p-4 backdrop-blur-md"
					>
						<div className="mb-4 px-1">
							<p className="text-xs font-medium uppercase tracking-[0.25em] text-black/50">
								{section.module}
							</p>
							<h2 className="text-lg font-semibold text-black/80">
								{section.title}
							</h2>
						</div>

						<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
							{section.items.map((item) => (
								<NavCard
									key={item.title}
									title={item.title}
									icon={item.icon}
									href={item.href}
								/>
							))}
						</div>
					</section>
				))}
			</div>
		</PageTransition>
	);
}
