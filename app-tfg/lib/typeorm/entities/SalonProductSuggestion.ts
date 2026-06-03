import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	ManyToOne,
	JoinColumn,
	Index,
} from "typeorm";
import type { Relation } from "typeorm";
import { SalonClient } from "./SalonClient";
import { Product } from "./Product";

@Entity("salon_product_suggestions")
@Index("salon_product_suggestions_salon_client_id_index", ["salon_client_id"])
@Index("salon_product_suggestions_product_id_index", ["product_id"])
export class SalonProductSuggestion {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column({ type: "uuid" })
	salon_client_id!: string;

	@Column({ type: "uuid" })
	product_id!: string;

	@Column({ type: "text" })
	reason!: string;

	@Column({ type: "timestamptz" })
	generated_at!: Date;

	@ManyToOne(() => SalonClient, {
		onDelete: "CASCADE",
		onUpdate: "CASCADE",
	})
	@JoinColumn({ name: "salon_client_id" })
	salonClient!: Relation<SalonClient>;

	@ManyToOne(() => Product, {
		onDelete: "RESTRICT",
		onUpdate: "CASCADE",
	})
	@JoinColumn({ name: "product_id" })
	product!: Relation<Product>;

	@CreateDateColumn({ type: "timestamptz" })
	created_at!: Date;

	@UpdateDateColumn({ type: "timestamptz" })
	updated_at!: Date;
}
