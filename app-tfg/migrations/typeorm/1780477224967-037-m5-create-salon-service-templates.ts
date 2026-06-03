import { MigrationInterface, QueryRunner } from "typeorm";

export class M5CreateSalonServiceTemplates1780477224967
	implements MigrationInterface
{
	name = "M5CreateSalonServiceTemplates1780477224967";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			CREATE TABLE "salon_service_templates" (
				"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
				"client_id" uuid NOT NULL,
				"created_by_user_id" uuid NOT NULL,
				"name" text NOT NULL,
				"service_type" text NOT NULL,
				"notes" text,
				"result" text,
				"technical_description" text,
				"formula" text,
				"technical_notes" text,
				"created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
				CONSTRAINT "PK_salon_service_templates" PRIMARY KEY ("id"),
				CONSTRAINT "FK_salon_service_templates_client_id" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE,
				CONSTRAINT "FK_salon_service_templates_created_by_user_id" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
			)
		`);
		await queryRunner.query(`
			CREATE INDEX "salon_service_templates_client_id_index"
			ON "salon_service_templates" ("client_id")
		`);
		await queryRunner.query(`
			CREATE INDEX "salon_service_templates_created_by_user_id_index"
			ON "salon_service_templates" ("created_by_user_id")
		`);
		await queryRunner.query(`
			CREATE INDEX "salon_service_templates_name_index"
			ON "salon_service_templates" ("name")
		`);
		await queryRunner.query(`
			CREATE TABLE "salon_service_template_product_usages" (
				"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
				"template_id" uuid NOT NULL,
				"product_id" uuid NOT NULL,
				"quantity_used" numeric(10,2),
				"notes" text,
				"created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
				CONSTRAINT "PK_salon_service_template_product_usages" PRIMARY KEY ("id"),
				CONSTRAINT "FK_salon_service_template_product_usages_template_id" FOREIGN KEY ("template_id") REFERENCES "salon_service_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE,
				CONSTRAINT "FK_salon_service_template_product_usages_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE
			)
		`);
		await queryRunner.query(`
			CREATE INDEX "salon_service_template_product_usages_template_id_index"
			ON "salon_service_template_product_usages" ("template_id")
		`);
		await queryRunner.query(`
			CREATE INDEX "salon_service_template_product_usages_product_id_index"
			ON "salon_service_template_product_usages" ("product_id")
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			DROP INDEX "salon_service_template_product_usages_product_id_index"
		`);
		await queryRunner.query(`
			DROP INDEX "salon_service_template_product_usages_template_id_index"
		`);
		await queryRunner.query(`
			DROP TABLE "salon_service_template_product_usages"
		`);
		await queryRunner.query(`
			DROP INDEX "salon_service_templates_name_index"
		`);
		await queryRunner.query(`
			DROP INDEX "salon_service_templates_created_by_user_id_index"
		`);
		await queryRunner.query(`
			DROP INDEX "salon_service_templates_client_id_index"
		`);
		await queryRunner.query(`
			DROP TABLE "salon_service_templates"
		`);
	}

}
