import { getDataSource } from "@/lib/typeorm/data-source";
import { ProductStatus } from "@/lib/typeorm/entities/ProductStatus";
import { SupportResourceType } from "@/lib/typeorm/entities/SupportResourceType";

export async function listProductStatuses() {
	const ds = await getDataSource();
	const repo = ds.getRepository(ProductStatus);

	return repo.find({
		order: {
			id: "ASC",
		},
	});
}

export async function listSupportResourceTypes() {
	const ds = await getDataSource();
	const repo = ds.getRepository(SupportResourceType);

	return repo.find({
		order: {
			id: "ASC",
		},
	});
}
