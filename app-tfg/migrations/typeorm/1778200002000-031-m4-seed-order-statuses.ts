import { MigrationInterface, QueryRunner } from "typeorm";

export class M4SeedOrderStatuses1778200002000 implements MigrationInterface {
	name = "M4SeedOrderStatuses1778200002000";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			INSERT INTO "order_statuses" ("id", "code", "name")
			VALUES
				(1, 'created', 'Creado'),
				(2, 'confirmed', 'Confirmado'),
				(3, 'delivered', 'Entregado'),
				(4, 'cancelled', 'Cancelado')
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DELETE FROM "order_statuses"`);
	}
}
