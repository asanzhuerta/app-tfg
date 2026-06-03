import { MigrationInterface, QueryRunner } from "typeorm";

export class M5AddSalonColorReferencesAndResultImages1780478751187
	implements MigrationInterface
{
	name = "M5AddSalonColorReferencesAndResultImages1780478751187";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			ALTER TABLE "salon_service_product_usages"
			ADD COLUMN "color_reference_id" uuid NULL
		`);
		await queryRunner.query(`
			CREATE INDEX "salon_service_product_usages_color_reference_id_index"
			ON "salon_service_product_usages" ("color_reference_id")
		`);
		await queryRunner.query(`
			ALTER TABLE "salon_service_product_usages"
			ADD CONSTRAINT "FK_salon_service_product_usages_color_reference_id"
			FOREIGN KEY ("color_reference_id")
			REFERENCES "color_references"("id")
			ON DELETE SET NULL
			ON UPDATE CASCADE
		`);
		await queryRunner.query(`
			ALTER TABLE "salon_service_template_product_usages"
			ADD COLUMN "color_reference_id" uuid NULL
		`);
		await queryRunner.query(`
			CREATE INDEX "salon_service_template_product_usages_color_reference_id_index"
			ON "salon_service_template_product_usages" ("color_reference_id")
		`);
		await queryRunner.query(`
			ALTER TABLE "salon_service_template_product_usages"
			ADD CONSTRAINT "FK_salon_service_template_product_usages_color_reference_id"
			FOREIGN KEY ("color_reference_id")
			REFERENCES "color_references"("id")
			ON DELETE SET NULL
			ON UPDATE CASCADE
		`);
		await queryRunner.query(`
			CREATE TABLE "salon_service_result_images" (
				"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
				"service_id" uuid NOT NULL,
				"image_url" text NOT NULL,
				"display_order" integer NOT NULL DEFAULT 0,
				"created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
				CONSTRAINT "CHK_salon_service_result_images_display_order_non_negative"
					CHECK ("display_order" >= 0),
				CONSTRAINT "PK_salon_service_result_images" PRIMARY KEY ("id"),
				CONSTRAINT "FK_salon_service_result_images_service_id"
					FOREIGN KEY ("service_id") REFERENCES "salon_services"("id")
					ON DELETE CASCADE ON UPDATE CASCADE
			)
		`);
		await queryRunner.query(`
			CREATE INDEX "salon_service_result_images_service_id_index"
			ON "salon_service_result_images" ("service_id")
		`);
		await queryRunner.query(`
			CREATE INDEX "salon_service_result_images_service_id_display_order_index"
			ON "salon_service_result_images" ("service_id", "display_order")
		`);
		await queryRunner.query(`
			WITH product_single_color_reference AS (
				SELECT
					"product_id",
					MIN("id"::text)::uuid AS "color_reference_id"
				FROM "color_references"
				WHERE "product_id" IS NOT NULL
				GROUP BY "product_id"
				HAVING COUNT(*) = 1
			)
			UPDATE "salon_service_product_usages" AS "usage"
			SET "color_reference_id" = "singleRef"."color_reference_id"
			FROM product_single_color_reference AS "singleRef"
			WHERE "usage"."product_id" = "singleRef"."product_id"
				AND "usage"."color_reference_id" IS NULL
		`);
		await queryRunner.query(`
			WITH product_single_color_reference AS (
				SELECT
					"product_id",
					MIN("id"::text)::uuid AS "color_reference_id"
				FROM "color_references"
				WHERE "product_id" IS NOT NULL
				GROUP BY "product_id"
				HAVING COUNT(*) = 1
			)
			UPDATE "salon_service_template_product_usages" AS "usage"
			SET "color_reference_id" = "singleRef"."color_reference_id"
			FROM product_single_color_reference AS "singleRef"
			WHERE "usage"."product_id" = "singleRef"."product_id"
				AND "usage"."color_reference_id" IS NULL
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			DROP INDEX "salon_service_result_images_service_id_display_order_index"
		`);
		await queryRunner.query(`
			DROP INDEX "salon_service_result_images_service_id_index"
		`);
		await queryRunner.query(`
			DROP TABLE "salon_service_result_images"
		`);
		await queryRunner.query(`
			ALTER TABLE "salon_service_template_product_usages"
			DROP CONSTRAINT "FK_salon_service_template_product_usages_color_reference_id"
		`);
		await queryRunner.query(`
			DROP INDEX "salon_service_template_product_usages_color_reference_id_index"
		`);
		await queryRunner.query(`
			ALTER TABLE "salon_service_template_product_usages"
			DROP COLUMN "color_reference_id"
		`);
		await queryRunner.query(`
			ALTER TABLE "salon_service_product_usages"
			DROP CONSTRAINT "FK_salon_service_product_usages_color_reference_id"
		`);
		await queryRunner.query(`
			DROP INDEX "salon_service_product_usages_color_reference_id_index"
		`);
		await queryRunner.query(`
			ALTER TABLE "salon_service_product_usages"
			DROP COLUMN "color_reference_id"
		`);
	}
}
