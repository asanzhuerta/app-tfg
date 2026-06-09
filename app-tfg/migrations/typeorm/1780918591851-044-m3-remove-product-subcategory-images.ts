import { MigrationInterface, QueryRunner } from "typeorm";

export class M3RemoveProductSubcategoryImages1780918591851 implements MigrationInterface {
	name = "M3RemoveProductSubcategoryImages1780918591851";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "product_subcategories" DROP COLUMN "image_url"`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "product_subcategories" ADD "image_url" text`,
		);
	}

}
