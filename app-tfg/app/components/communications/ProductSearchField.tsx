"use client";

import { useMemo, useState } from "react";
import type { ProductOptionView } from "./communication-view-types";

function normalizeSearchValue(value: string) {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.trim();
}

function formatProductOption(product: ProductOptionView) {
	return product.reference
		? `${product.reference} - ${product.name}`
		: product.name;
}

export function findProductOptionLabel(
	products: ProductOptionView[],
	productId: string,
) {
	const product = products.find((item) => item.id === productId);

	return product ? formatProductOption(product) : "";
}

type ProductSearchFieldProps = {
	id: string;
	placeholder: string;
	value: string;
	query: string;
	products: ProductOptionView[];
	onChange: (value: string) => void;
	onQueryChange: (value: string) => void;
};

export default function ProductSearchField({
	id,
	placeholder,
	value,
	query,
	products,
	onChange,
	onQueryChange,
}: ProductSearchFieldProps) {
	const [isOpen, setIsOpen] = useState(false);

	const selectedProduct = useMemo(
		() => products.find((product) => product.id === value) ?? null,
		[products, value],
	);

	const filteredProducts = useMemo(() => {
		const normalizedQuery = normalizeSearchValue(query);

		if (!normalizedQuery) {
			return products.slice(0, 8);
		}

		return products
			.filter((product) =>
				normalizeSearchValue(formatProductOption(product)).includes(
					normalizedQuery,
				),
			)
			.slice(0, 8);
	}, [products, query]);

	return (
		<div className="relative min-w-0">
			<input
				id={id}
				type="search"
				autoComplete="off"
				placeholder={placeholder}
				value={query}
				onFocus={() => setIsOpen(true)}
				onBlur={() => setIsOpen(false)}
				onChange={(event) => {
					const nextQuery = event.target.value;
					onQueryChange(nextQuery);
					setIsOpen(true);

					if (
						selectedProduct &&
						normalizeSearchValue(nextQuery) !==
							normalizeSearchValue(formatProductOption(selectedProduct))
					) {
						onChange("");
					}

					if (!nextQuery.trim()) {
						onChange("");
					}
				}}
				className={`w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-slate-400 ${
					value ? "pr-16" : ""
				}`}
			/>
			{value ? (
				<button
					type="button"
					onClick={() => {
						onChange("");
						onQueryChange("");
						setIsOpen(false);
					}}
					className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 transition hover:text-slate-700"
				>
					Quitar
				</button>
			) : null}
			{isOpen ? (
				<div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-[100] max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-xl">
					{filteredProducts.length > 0 ? (
						filteredProducts.map((product) => (
							<button
								key={product.id}
								type="button"
								onMouseDown={(event) => event.preventDefault()}
								onClick={() => {
									onChange(product.id);
									onQueryChange(formatProductOption(product));
									setIsOpen(false);
								}}
								className="block w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
							>
								<span className="font-semibold text-slate-900">
									{product.name}
								</span>
								{product.reference ? (
									<span className="ml-2 text-xs text-slate-500">
										{product.reference}
									</span>
								) : null}
							</button>
						))
					) : (
						<p className="px-3 py-2 text-sm text-slate-500">
							No hay productos con ese texto.
						</p>
					)}
				</div>
			) : null}
		</div>
	);
}
