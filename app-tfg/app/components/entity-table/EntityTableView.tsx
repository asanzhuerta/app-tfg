"use client";

import Link from "next/link";
import {
	AnimatePresence,
	LazyMotion,
	domAnimation,
	m,
	useReducedMotion,
} from "framer-motion";
import UserAvatar from "@/app/components/users/UserAvatar";
import type {
	EntityTableCardVariant,
	EntityTableConfig,
	EntityTableItem,
} from "./entity-table-types";

type Props = {
	items: EntityTableItem[];
	emptyMessage?: string;
	config?: EntityTableConfig;
};

// Devuelve las clases visuales del boton segun el tipo de accion.
function getActionClasses(variant?: "primary" | "secondary" | "warning") {
	if (variant === "warning") {
		return "bg-amber-100 text-amber-700 hover:bg-amber-200";
	}

	if (variant === "secondary") {
		return "bg-slate-100 text-slate-700 hover:bg-slate-200";
	}

	return "bg-sky-600 text-white hover:bg-sky-700";
}

// Tarjeta reutilizable que representa un unico elemento del listado.
function EntityCard({
	item,
	shouldReduceMotion,
	cardVariant = "default",
}: {
	item: EntityTableItem;
	shouldReduceMotion: boolean;
	cardVariant?: EntityTableCardVariant;
}) {
	const isHeadlineVariant = cardVariant === "headline";
	const isMediaVariant = cardVariant === "media";
	const motionProps = shouldReduceMotion
		? {
				initial: false,
				animate: { opacity: 1, y: 0, scale: 1 },
				exit: { opacity: 1, y: 0, scale: 1 },
				transition: { duration: 0 },
			}
		: {
				initial: { opacity: 0, y: 12, scale: 0.98 },
				animate: { opacity: 1, y: 0, scale: 0.98 },
				exit: { opacity: 0, y: -12, scale: 0.98 },
				transition: { duration: 0.28, ease: "easeInOut" as const },
			};

	return (
		<m.div
			layout
			{...motionProps}
			className={`rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md ${
				isHeadlineVariant
					? "flex min-h-[136px] flex-col justify-between p-5"
					: isMediaVariant
						? "flex min-h-[168px] flex-col justify-between p-4"
						: "p-3.5"
			}`}
		>
			<div
				className={`flex items-start gap-3 ${
					isHeadlineVariant
						? "min-h-0"
						: isMediaVariant
							? "gap-4"
							: ""
				}`}
			>
				{!isHeadlineVariant ? (
					<UserAvatar
						name={item.title}
						imageUrl={item.imageUrl}
						size={isMediaVariant ? "xl" : "md"}
						shape={isMediaVariant ? "soft-square" : "circle"}
						className="flex-shrink-0"
					/>
				) : null}

				<div className="min-w-0 flex-1">
					{isMediaVariant && item.badges?.length ? (
						<div className="mb-2 flex flex-wrap gap-2">
							{item.badges.map((badge) => (
								<span
									key={`${item.id}-${badge.label}`}
									className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.className ?? "bg-slate-100 text-slate-700"}`}
								>
									{badge.label}
								</span>
							))}
						</div>
					) : null}

					<p
						className={
							isHeadlineVariant
								? "text-lg font-semibold leading-tight text-slate-800"
								: isMediaVariant
									? "text-lg font-semibold leading-tight text-slate-800"
									: "truncate text-sm font-semibold text-slate-800"
						}
					>
						{item.title}
					</p>
					<p
						className={
							isHeadlineVariant
								? "mt-1 text-sm leading-snug text-slate-600"
								: isMediaVariant
									? "mt-1 text-sm leading-snug text-slate-600"
									: "truncate text-xs text-slate-600"
						}
					>
						{item.subtitle}
					</p>
				</div>

				{!isMediaVariant && item.badges?.length ? (
					<div className="ml-auto flex flex-col items-end gap-2">
						{item.badges.map((badge) => (
							<span
								key={`${item.id}-${badge.label}`}
								className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.className ?? "bg-slate-100 text-slate-700"}`}
							>
								{badge.label}
							</span>
						))}
					</div>
				) : null}
			</div>

			{!isHeadlineVariant && !isMediaVariant ? (
				<div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-600">
					{item.fields.map((field) => (
						<div key={`${item.id}-${field.label}`}>
							<span className="font-medium text-slate-700">{field.label}:</span>{" "}
							{field.value || "-"}
						</div>
					))}
				</div>
			) : null}

			{item.actions?.length ? (
				<div
					className={
						isHeadlineVariant || isMediaVariant
							? "mt-5 flex flex-wrap gap-2"
							: "mt-3 flex flex-wrap gap-2"
					}
				>
					{item.actions.map((action) => (
						<Link
							key={`${item.id}-${action.label}`}
							href={action.href}
							className={`rounded-md px-2.5 py-1.5 text-[11px] font-medium transition ${getActionClasses(
								action.variant,
							)}`}
						>
							{action.label}
						</Link>
					))}
				</div>
			) : null}
		</m.div>
	);
}

// Vista principal del listado reutilizable.
// Muestra una rejilla de tarjetas o un mensaje vacio si no hay resultados.
export default function EntityTableView({
	items,
	emptyMessage = "No hay elementos que coincidan con los filtros.",
	config,
}: Props) {
	const shouldReduceMotion = useReducedMotion() ?? false;

	return (
		<div className="rounded-2xl border border-gray-200 bg-white shadow-md">
			{items.length === 0 ? (
				<div className="px-4 py-10 text-center text-slate-500">
					{emptyMessage}
				</div>
			) : (
				<LazyMotion features={domAnimation}>
					<m.div
						layout
						className={
							config?.gridClassName ??
							"grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3"
						}
					>
						<AnimatePresence initial={false} mode="popLayout">
							{items.map((item) => (
								<EntityCard
									key={item.id}
									item={item}
									shouldReduceMotion={shouldReduceMotion}
									cardVariant={config?.cardVariant}
								/>
							))}
						</AnimatePresence>
					</m.div>
				</LazyMotion>
			)}
		</div>
	);
}
