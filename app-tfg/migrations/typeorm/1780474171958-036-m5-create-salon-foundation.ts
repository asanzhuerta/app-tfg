import { MigrationInterface, QueryRunner } from "typeorm";

export class M5CreateSalonFoundation1780474171958
	implements MigrationInterface
{
	name = "M5CreateSalonFoundation1780474171958";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			CREATE TABLE "salon_clients" (
				"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
				"client_id" uuid NOT NULL,
				"name" text NOT NULL,
				"phone" text,
				"email" text,
				"notes" text,
				"created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
				CONSTRAINT "PK_salon_clients" PRIMARY KEY ("id"),
				CONSTRAINT "FK_salon_clients_client_id" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE
			)
		`);
		await queryRunner.query(`
			CREATE INDEX "salon_clients_client_id_index"
			ON "salon_clients" ("client_id")
		`);
		await queryRunner.query(`
			CREATE INDEX "salon_clients_name_index"
			ON "salon_clients" ("name")
		`);
		await queryRunner.query(`
			CREATE TABLE "salon_services" (
				"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
				"salon_client_id" uuid NOT NULL,
				"client_id" uuid NOT NULL,
				"recorded_by_user_id" uuid NOT NULL,
				"service_date" date NOT NULL,
				"service_type" text NOT NULL,
				"notes" text,
				"result" text,
				"created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
				CONSTRAINT "PK_salon_services" PRIMARY KEY ("id"),
				CONSTRAINT "FK_salon_services_salon_client_id" FOREIGN KEY ("salon_client_id") REFERENCES "salon_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE,
				CONSTRAINT "FK_salon_services_client_id" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE,
				CONSTRAINT "FK_salon_services_recorded_by_user_id" FOREIGN KEY ("recorded_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
			)
		`);
		await queryRunner.query(`
			CREATE INDEX "salon_services_salon_client_id_index"
			ON "salon_services" ("salon_client_id")
		`);
		await queryRunner.query(`
			CREATE INDEX "salon_services_client_id_index"
			ON "salon_services" ("client_id")
		`);
		await queryRunner.query(`
			CREATE INDEX "salon_services_recorded_by_user_id_index"
			ON "salon_services" ("recorded_by_user_id")
		`);
		await queryRunner.query(`
			CREATE INDEX "salon_services_service_date_index"
			ON "salon_services" ("service_date")
		`);
		await queryRunner.query(`
			CREATE TABLE "salon_service_technical_sheets" (
				"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
				"service_id" uuid NOT NULL,
				"technical_description" text,
				"formula" text,
				"technical_notes" text,
				"created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
				CONSTRAINT "PK_salon_service_technical_sheets" PRIMARY KEY ("id"),
				CONSTRAINT "FK_salon_service_technical_sheets_service_id" FOREIGN KEY ("service_id") REFERENCES "salon_services"("id") ON DELETE CASCADE ON UPDATE CASCADE
			)
		`);
		await queryRunner.query(`
			CREATE UNIQUE INDEX "salon_service_technical_sheets_service_id_index"
			ON "salon_service_technical_sheets" ("service_id")
		`);
		await queryRunner.query(`
			CREATE TABLE "salon_service_product_usages" (
				"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
				"service_id" uuid NOT NULL,
				"product_id" uuid NOT NULL,
				"quantity_used" numeric(10,2),
				"notes" text,
				"created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
				CONSTRAINT "PK_salon_service_product_usages" PRIMARY KEY ("id"),
				CONSTRAINT "FK_salon_service_product_usages_service_id" FOREIGN KEY ("service_id") REFERENCES "salon_services"("id") ON DELETE CASCADE ON UPDATE CASCADE,
				CONSTRAINT "FK_salon_service_product_usages_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE
			)
		`);
		await queryRunner.query(`
			CREATE INDEX "salon_service_product_usages_service_id_index"
			ON "salon_service_product_usages" ("service_id")
		`);
		await queryRunner.query(`
			CREATE INDEX "salon_service_product_usages_product_id_index"
			ON "salon_service_product_usages" ("product_id")
		`);
		await queryRunner.query(`
			CREATE TABLE "salon_product_suggestions" (
				"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
				"salon_client_id" uuid NOT NULL,
				"product_id" uuid NOT NULL,
				"reason" text NOT NULL,
				"generated_at" TIMESTAMPTZ NOT NULL,
				"created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
				CONSTRAINT "PK_salon_product_suggestions" PRIMARY KEY ("id"),
				CONSTRAINT "FK_salon_product_suggestions_salon_client_id" FOREIGN KEY ("salon_client_id") REFERENCES "salon_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE,
				CONSTRAINT "FK_salon_product_suggestions_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE
			)
		`);
		await queryRunner.query(`
			CREATE INDEX "salon_product_suggestions_salon_client_id_index"
			ON "salon_product_suggestions" ("salon_client_id")
		`);
		await queryRunner.query(`
			CREATE INDEX "salon_product_suggestions_product_id_index"
			ON "salon_product_suggestions" ("product_id")
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			DROP INDEX "salon_product_suggestions_product_id_index"
		`);
		await queryRunner.query(`
			DROP INDEX "salon_product_suggestions_salon_client_id_index"
		`);
		await queryRunner.query(`
			DROP TABLE "salon_product_suggestions"
		`);
		await queryRunner.query(`
			DROP INDEX "salon_service_product_usages_product_id_index"
		`);
		await queryRunner.query(`
			DROP INDEX "salon_service_product_usages_service_id_index"
		`);
		await queryRunner.query(`
			DROP TABLE "salon_service_product_usages"
		`);
		await queryRunner.query(`
			DROP INDEX "salon_service_technical_sheets_service_id_index"
		`);
		await queryRunner.query(`
			DROP TABLE "salon_service_technical_sheets"
		`);
		await queryRunner.query(`
			DROP INDEX "salon_services_service_date_index"
		`);
		await queryRunner.query(`
			DROP INDEX "salon_services_recorded_by_user_id_index"
		`);
		await queryRunner.query(`
			DROP INDEX "salon_services_client_id_index"
		`);
		await queryRunner.query(`
			DROP INDEX "salon_services_salon_client_id_index"
		`);
		await queryRunner.query(`
			DROP TABLE "salon_services"
		`);
		await queryRunner.query(`
			DROP INDEX "salon_clients_name_index"
		`);
		await queryRunner.query(`
			DROP INDEX "salon_clients_client_id_index"
		`);
		await queryRunner.query(`
			DROP TABLE "salon_clients"
		`);
	}
}
