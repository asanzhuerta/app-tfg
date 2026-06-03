import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	ManyToOne,
	JoinColumn,
	Index,
} from "typeorm";
import type { Relation } from "typeorm";
import { Product } from "./Product";
import { SalonServiceTemplate } from "./SalonServiceTemplate";
import { ColorReference } from "./ColorReference";

@Entity("salon_service_template_product_usages")
@Index("salon_service_template_product_usages_template_id_index", ["template_id"])
@Index("salon_service_template_product_usages_product_id_index", ["product_id"])
@Index("salon_service_template_product_usages_color_reference_id_index", [
	"color_reference_id",
])
export class SalonServiceTemplateProductUsage {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column({ type: "uuid" })
	template_id!: string;

	@Column({ type: "uuid" })
	product_id!: string;

	@Column({ type: "uuid", nullable: true })
	color_reference_id!: string | null;

	@Column({ type: "numeric", precision: 10, scale: 2, nullable: true })
	quantity_used!: string | null;

	@Column({ type: "text", nullable: true })
	notes!: string | null;

	@ManyToOne(() => SalonServiceTemplate, {
		onDelete: "CASCADE",
		onUpdate: "CASCADE",
	})
	@JoinColumn({ name: "template_id" })
	template!: Relation<SalonServiceTemplate>;

	@ManyToOne(() => Product, {
		onDelete: "RESTRICT",
		onUpdate: "CASCADE",
	})
	@JoinColumn({ name: "product_id" })
	product!: Relation<Product>;

	@ManyToOne(() => ColorReference, {
		onDelete: "SET NULL",
		onUpdate: "CASCADE",
		nullable: true,
	})
	@JoinColumn({ name: "color_reference_id" })
	colorReference!: Relation<ColorReference | null>;

	@CreateDateColumn({ type: "timestamptz" })
	created_at!: Date;
}
