import { MigrationInterface, QueryRunner } from "typeorm";

export class M3CreateProductSubcategories1777556519319
	implements MigrationInterface
{
	name = "M3CreateProductSubcategories1777556519319";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			CREATE TABLE "product_subcategories" (
				"id" uuid NOT NULL DEFAULT gen_random_uuid(),
				"product_line_id" uuid NOT NULL,
				"name" text NOT NULL,
				"description" text,
				"image_url" text,
				"display_order" integer NOT NULL DEFAULT 0,
				"created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				CONSTRAINT "CHK_product_subcategories_display_order_non_negative"
					CHECK ("display_order" >= 0),
				CONSTRAINT "PK_product_subcategories" PRIMARY KEY ("id")
			)
		`);

		await queryRunner.query(`
			CREATE INDEX "product_subcategories_product_line_id_index"
			ON "product_subcategories" ("product_line_id")
		`);

		await queryRunner.query(`
			CREATE INDEX "product_subcategories_display_order_index"
			ON "product_subcategories" ("display_order")
		`);

		await queryRunner.query(`
			CREATE UNIQUE INDEX "product_subcategories_id_product_line_id_unique"
			ON "product_subcategories" ("id", "product_line_id")
		`);

		await queryRunner.query(`
			CREATE UNIQUE INDEX "product_subcategories_product_line_id_name_unique"
			ON "product_subcategories" ("product_line_id", "name")
		`);

		await queryRunner.query(`
			ALTER TABLE "product_subcategories"
			ADD CONSTRAINT "FK_product_subcategories_product_line_id"
			FOREIGN KEY ("product_line_id")
			REFERENCES "product_lines"("id")
			ON DELETE RESTRICT
			ON UPDATE CASCADE
		`);

		await queryRunner.query(`
			ALTER TABLE "products"
			ADD COLUMN "product_subcategory_id" uuid
		`);

		await queryRunner.query(`
			CREATE INDEX "products_product_subcategory_id_index"
			ON "products" ("product_subcategory_id")
		`);

		await queryRunner.query(`
			INSERT INTO "product_subcategories" (
				"product_line_id",
				"name",
				"description",
				"image_url",
				"display_order"
			)
			SELECT DISTINCT
				"product_line_id",
				BTRIM("subcategory"),
				NULL,
				NULL,
				0
			FROM "products"
			WHERE NULLIF(BTRIM(COALESCE("subcategory", '')), '') IS NOT NULL
		`);

		await queryRunner.query(`
			UPDATE "products" AS "product"
			SET "product_subcategory_id" = "productSubcategory"."id"
			FROM "product_subcategories" AS "productSubcategory"
			WHERE "product"."product_line_id" = "productSubcategory"."product_line_id"
				AND BTRIM(COALESCE("product"."subcategory", '')) = "productSubcategory"."name"
		`);

		await queryRunner.query(`
			ALTER TABLE "products"
			ADD CONSTRAINT "FK_products_product_subcategory_id_product_line_id"
			FOREIGN KEY ("product_subcategory_id", "product_line_id")
			REFERENCES "product_subcategories"("id", "product_line_id")
			ON DELETE SET NULL
			ON UPDATE CASCADE
		`);

		await queryRunner.query(`
			ALTER TABLE "products"
			DROP COLUMN "subcategory"
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			ALTER TABLE "products"
			ADD COLUMN "subcategory" text
		`);

		await queryRunner.query(`
			UPDATE "products" AS "product"
			SET "subcategory" = "productSubcategory"."name"
			FROM "product_subcategories" AS "productSubcategory"
			WHERE "product"."product_subcategory_id" = "productSubcategory"."id"
		`);

		await queryRunner.query(`
			ALTER TABLE "products"
			DROP CONSTRAINT "FK_products_product_subcategory_id_product_line_id"
		`);

		await queryRunner.query(`
			DROP INDEX "public"."products_product_subcategory_id_index"
		`);

		await queryRunner.query(`
			ALTER TABLE "products"
			DROP COLUMN "product_subcategory_id"
		`);

		await queryRunner.query(`
			ALTER TABLE "product_subcategories"
			DROP CONSTRAINT "FK_product_subcategories_product_line_id"
		`);

		await queryRunner.query(`
			DROP INDEX "public"."product_subcategories_product_line_id_name_unique"
		`);

		await queryRunner.query(`
			DROP INDEX "public"."product_subcategories_id_product_line_id_unique"
		`);

		await queryRunner.query(`
			DROP INDEX "public"."product_subcategories_display_order_index"
		`);

		await queryRunner.query(`
			DROP INDEX "public"."product_subcategories_product_line_id_index"
		`);

		await queryRunner.query(`DROP TABLE "product_subcategories"`);
	}
}
