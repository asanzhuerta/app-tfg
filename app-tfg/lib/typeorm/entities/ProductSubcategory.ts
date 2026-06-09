import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
	OneToMany,
	JoinColumn,
	CreateDateColumn,
	UpdateDateColumn,
	Index,
} from "typeorm";
import type { Relation } from "typeorm";
import { ProductLine } from "./ProductLine";
import { Product } from "./Product";

@Entity("product_subcategories")
@Index("product_subcategories_product_line_id_index", ["product_line_id"])
@Index("product_subcategories_parent_subcategory_id_index", ["parent_subcategory_id"])
@Index("product_subcategories_display_order_index", ["display_order"])
@Index("product_subcategories_id_product_line_id_unique", ["id", "product_line_id"], {
	unique: true,
})
@Index("product_subcategories_product_line_id_name_unique", ["product_line_id", "name"], {
	unique: true,
})
export class ProductSubcategory {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column({ type: "uuid" })
	product_line_id!: string;

	@Column({ type: "text" })
	name!: string;

	@Column({ type: "text", nullable: true })
	description!: string | null;

	@Column({ type: "uuid", nullable: true })
	parent_subcategory_id!: string | null;

	@Column({ type: "integer", default: 0 })
	display_order!: number;

	@ManyToOne(() => ProductLine, {
		onDelete: "RESTRICT",
		onUpdate: "CASCADE",
	})
	@JoinColumn({ name: "product_line_id" })
	productLine!: Relation<ProductLine>;

	@ManyToOne(() => ProductSubcategory, (productSubcategory) => productSubcategory.childSubcategories, {
		onDelete: "SET NULL",
		onUpdate: "CASCADE",
		nullable: true,
	})
	@JoinColumn([
		{ name: "parent_subcategory_id", referencedColumnName: "id" },
		{ name: "product_line_id", referencedColumnName: "product_line_id" },
	])
	parentSubcategory!: Relation<ProductSubcategory | null>;

	@OneToMany(
		() => ProductSubcategory,
		(productSubcategory) => productSubcategory.parentSubcategory,
	)
	childSubcategories!: Relation<ProductSubcategory[]>;

	@OneToMany(() => Product, (product) => product.productSubcategory)
	products!: Relation<Product[]>;

	@CreateDateColumn({ type: "timestamptz" })
	created_at!: Date;

	@UpdateDateColumn({ type: "timestamptz" })
	updated_at!: Date;
}
