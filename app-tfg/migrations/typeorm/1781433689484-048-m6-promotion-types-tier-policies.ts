import { MigrationInterface, QueryRunner } from "typeorm";

export class M6PromotionTypesTierPolicies1781433689484 implements MigrationInterface {
	name = "M6PromotionTypesTierPolicies1781433689484";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			CREATE TABLE "promotion_discount_types" (
				"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
				"code" text NOT NULL,
				"name" text NOT NULL,
				"description" text,
				"display_order" integer NOT NULL DEFAULT 0,
				"is_active" boolean NOT NULL DEFAULT true,
				"created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
				CONSTRAINT "PK_promotion_discount_types" PRIMARY KEY ("id")
			)
		`);
		await queryRunner.query(`
			CREATE UNIQUE INDEX "promotion_discount_types_code_unique"
			ON "promotion_discount_types" ("code")
		`);
		await queryRunner.query(`
			CREATE INDEX "promotion_discount_types_display_order_index"
			ON "promotion_discount_types" ("display_order")
		`);
		await queryRunner.query(`
			INSERT INTO "promotion_discount_types"
				("code", "name", "description", "display_order")
			VALUES
				(
					'percentage_discount',
					'Descuento porcentual',
					'Descuento directo aplicado a los productos incluidos en la promoción.',
					10
				),
				(
					'volume_percentage_discount',
					'Descuento por volumen',
					'Descuento porcentual que se activa cuando el pedido alcanza un importe mínimo.',
					20
				),
				(
					'gift_product',
					'Producto de regalo',
					'Promoción informativa que asocia un producto o regalo de merchandising al pedido.',
					30
				)
			ON CONFLICT ("code") DO NOTHING
		`);
		await queryRunner.query(`
			ALTER TABLE "promotions"
			ADD "promotion_discount_type_id" uuid
		`);
		await queryRunner.query(`
			ALTER TABLE "promotions"
			ADD "discount_percentage" numeric(5,2)
		`);
		await queryRunner.query(`
			ALTER TABLE "promotions"
			ADD "minimum_order_amount" numeric(12,2)
		`);
		await queryRunner.query(`
			ALTER TABLE "promotions"
			ADD "gift_product_id" uuid
		`);
		await queryRunner.query(`
			ALTER TABLE "promotions"
			ADD "gift_description" text
		`);
		await queryRunner.query(`
			ALTER TABLE "promotions"
			ADD "image_url" text
		`);
		await queryRunner.query(`
			ALTER TABLE "promotions"
			ADD "attachment_url" text
		`);
		await queryRunner.query(`
			ALTER TABLE "promotions"
			ADD "attachment_name" text
		`);
		await queryRunner.query(`
			ALTER TABLE "promotions"
			ADD "attachment_mime_type" text
		`);
		await queryRunner.query(`
			UPDATE "promotions"
			SET "promotion_discount_type_id" = (
				SELECT "id"
				FROM "promotion_discount_types"
				WHERE "code" = 'percentage_discount'
				LIMIT 1
			)
			WHERE "promotion_discount_type_id" IS NULL
		`);
		await queryRunner.query(`
			WITH parsed_promotions AS (
				SELECT
					"id",
					substring(replace("benefit", ',', '.') from '([0-9]+(\\.[0-9]+)?)')::numeric AS parsed_discount
				FROM "promotions"
				WHERE lower("promotion_type") LIKE '%descuento%'
					OR lower("promotion_type") LIKE '%discount%'
			)
			UPDATE "promotions" promotion
			SET "discount_percentage" = parsed.parsed_discount
			FROM parsed_promotions parsed
			WHERE promotion."id" = parsed."id"
				AND parsed.parsed_discount > 0
				AND parsed.parsed_discount <= 100
		`);
		await queryRunner.query(`
			ALTER TABLE "promotions"
			ALTER COLUMN "promotion_discount_type_id" SET NOT NULL
		`);
		await queryRunner.query(`
			ALTER TABLE "promotions"
			ADD CONSTRAINT "promotions_discount_percentage_check"
			CHECK (
				"discount_percentage" IS NULL
				OR ("discount_percentage" > 0 AND "discount_percentage" <= 100)
			)
		`);
		await queryRunner.query(`
			ALTER TABLE "promotions"
			ADD CONSTRAINT "promotions_minimum_order_amount_check"
			CHECK (
				"minimum_order_amount" IS NULL
				OR "minimum_order_amount" >= 0
			)
		`);
		await queryRunner.query(`
			ALTER TABLE "promotions"
			ADD CONSTRAINT "FK_promotions_discount_type_id"
			FOREIGN KEY ("promotion_discount_type_id")
			REFERENCES "promotion_discount_types"("id")
			ON DELETE RESTRICT ON UPDATE CASCADE
		`);
		await queryRunner.query(`
			ALTER TABLE "promotions"
			ADD CONSTRAINT "FK_promotions_gift_product_id"
			FOREIGN KEY ("gift_product_id")
			REFERENCES "products"("id")
			ON DELETE SET NULL ON UPDATE CASCADE
		`);
		await queryRunner.query(`
			CREATE INDEX "promotions_discount_type_id_index"
			ON "promotions" ("promotion_discount_type_id")
		`);
		await queryRunner.query(`
			CREATE INDEX "promotions_gift_product_id_index"
			ON "promotions" ("gift_product_id")
		`);
		await queryRunner.query(`
			INSERT INTO "system_configurations" ("key", "value", "description")
			VALUES
				(
					'client_tiers.threshold.silver',
					'0.00',
					'Compra anual mínima para rango Plata.'
				),
				(
					'client_tiers.threshold.gold',
					'1000.00',
					'Compra anual mínima para rango Oro.'
				),
				(
					'client_tiers.threshold.platinum',
					'2500.00',
					'Compra anual mínima para rango Platino.'
				),
				(
					'client_tiers.recalculation.frequency',
					'annual',
					'Frecuencia de actualizacion automatica de rangos.'
				),
				(
					'client_tiers.recalculation.month',
					'12',
					'Mes programado para recalcular rangos si la frecuencia es anual.'
				),
				(
					'client_tiers.recalculation.day',
					'31',
					'Dia programado para recalcular rangos.'
				)
			ON CONFLICT ("key") DO NOTHING
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			DELETE FROM "system_configurations"
			WHERE "key" IN (
				'client_tiers.threshold.silver',
				'client_tiers.threshold.gold',
				'client_tiers.threshold.platinum',
				'client_tiers.recalculation.frequency',
				'client_tiers.recalculation.month',
				'client_tiers.recalculation.day'
			)
		`);
		await queryRunner.query(`DROP INDEX "promotions_gift_product_id_index"`);
		await queryRunner.query(`DROP INDEX "promotions_discount_type_id_index"`);
		await queryRunner.query(`
			ALTER TABLE "promotions"
			DROP CONSTRAINT "FK_promotions_gift_product_id"
		`);
		await queryRunner.query(`
			ALTER TABLE "promotions"
			DROP CONSTRAINT "FK_promotions_discount_type_id"
		`);
		await queryRunner.query(`
			ALTER TABLE "promotions"
			DROP CONSTRAINT "promotions_minimum_order_amount_check"
		`);
		await queryRunner.query(`
			ALTER TABLE "promotions"
			DROP CONSTRAINT "promotions_discount_percentage_check"
		`);
		await queryRunner.query(`
			ALTER TABLE "promotions"
			DROP COLUMN "attachment_mime_type"
		`);
		await queryRunner.query(`
			ALTER TABLE "promotions"
			DROP COLUMN "attachment_name"
		`);
		await queryRunner.query(`
			ALTER TABLE "promotions"
			DROP COLUMN "attachment_url"
		`);
		await queryRunner.query(`
			ALTER TABLE "promotions"
			DROP COLUMN "image_url"
		`);
		await queryRunner.query(`
			ALTER TABLE "promotions"
			DROP COLUMN "gift_description"
		`);
		await queryRunner.query(`
			ALTER TABLE "promotions"
			DROP COLUMN "gift_product_id"
		`);
		await queryRunner.query(`
			ALTER TABLE "promotions"
			DROP COLUMN "minimum_order_amount"
		`);
		await queryRunner.query(`
			ALTER TABLE "promotions"
			DROP COLUMN "discount_percentage"
		`);
		await queryRunner.query(`
			ALTER TABLE "promotions"
			DROP COLUMN "promotion_discount_type_id"
		`);
		await queryRunner.query(`
			DROP INDEX "promotion_discount_types_display_order_index"
		`);
		await queryRunner.query(`
			DROP INDEX "promotion_discount_types_code_unique"
		`);
		await queryRunner.query(`DROP TABLE "promotion_discount_types"`);
	}

}
