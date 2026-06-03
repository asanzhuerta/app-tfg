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
import { SalonService } from "./SalonService";
import { Product } from "./Product";
import { ColorReference } from "./ColorReference";

@Entity("salon_service_product_usages")
@Index("salon_service_product_usages_service_id_index", ["service_id"])
@Index("salon_service_product_usages_product_id_index", ["product_id"])
@Index("salon_service_product_usages_color_reference_id_index", [
	"color_reference_id",
])
export class SalonServiceProductUsage {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column({ type: "uuid" })
	service_id!: string;

	@Column({ type: "uuid" })
	product_id!: string;

	@Column({ type: "uuid", nullable: true })
	color_reference_id!: string | null;

	@Column({ type: "numeric", precision: 10, scale: 2, nullable: true })
	quantity_used!: string | null;

	@Column({ type: "text", nullable: true })
	notes!: string | null;

	@ManyToOne(() => SalonService, {
		onDelete: "CASCADE",
		onUpdate: "CASCADE",
	})
	@JoinColumn({ name: "service_id" })
	service!: Relation<SalonService>;

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
