import { MigrationInterface, QueryRunner } from "typeorm";

export class M3AddProductSubcategoryHierarchy1777728928988
	implements MigrationInterface
{
	name = "M3AddProductSubcategoryHierarchy1777728928988";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			ALTER TABLE "product_subcategories"
			ADD COLUMN "parent_subcategory_id" uuid
		`);

		await queryRunner.query(`
			CREATE INDEX "product_subcategories_parent_subcategory_id_index"
			ON "product_subcategories" ("parent_subcategory_id")
		`);

		await queryRunner.query(`
			ALTER TABLE "product_subcategories"
			ADD CONSTRAINT "FK_product_subcategories_parent_subcategory_id_product_line_id"
			FOREIGN KEY ("parent_subcategory_id", "product_line_id")
			REFERENCES "product_subcategories"("id", "product_line_id")
			ON DELETE SET NULL
			ON UPDATE CASCADE
		`);

		await queryRunner.query(`
			UPDATE "product_subcategories" AS "child"
			SET "parent_subcategory_id" = "parent"."id"
			FROM "product_subcategories" AS "parent",
				"product_lines" AS "productLine"
			WHERE "child"."product_line_id" = "parent"."product_line_id"
				AND "productLine"."id" = "child"."product_line_id"
				AND "productLine"."name" = 'KINACTIF'
				AND (
					"parent"."name" = 'Nº8 SCALP - Equilibrio y bienestar del cuero cabelludo'
					OR "parent"."name" = 'NÂº8 SCALP - Equilibrio y bienestar del cuero cabelludo'
					OR "parent"."name" ILIKE 'N%8 SCALP - %'
				)
				AND "child"."name" IN (
					'ANTI-HAIR LOSS - Cabellos con tendencia a la caida',
					'ANTI-DANDRUFF - Cabellos con todo tipo de caspa',
					'OIL CONTROL - Para cuero cabelludo graso',
					'COMFORT - Para cuero cabelludo sensible'
				)
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			ALTER TABLE "product_subcategories"
			DROP CONSTRAINT "FK_product_subcategories_parent_subcategory_id_product_line_id"
		`);

		await queryRunner.query(`
			DROP INDEX "public"."product_subcategories_parent_subcategory_id_index"
		`);

		await queryRunner.query(`
			ALTER TABLE "product_subcategories"
			DROP COLUMN "parent_subcategory_id"
		`);
	}
}
