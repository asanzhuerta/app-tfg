import type { EntityManager } from "typeorm";
import { getDataSource } from "@/lib/typeorm/data-source";
import { SystemConfiguration } from "@/lib/typeorm/entities/SystemConfiguration";

export async function getSystemConfigurationRepository(manager?: EntityManager) {
	if (manager) {
		return manager.getRepository(SystemConfiguration);
	}

	const dataSource = await getDataSource();
	return dataSource.getRepository(SystemConfiguration);
}
