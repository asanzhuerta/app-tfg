import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
	JoinColumn,
	Index,
} from "typeorm";
import type { Relation } from "typeorm";
import { Order } from "./Order";
import { Product } from "./Product";

@Entity("order_lines")
@Index("order_lines_order_id_index", ["order_id"])
@Index("order_lines_product_id_index", ["product_id"])
@Index("order_lines_order_id_product_id_unique", ["order_id", "product_id"], {
	unique: true,
})
export class OrderLine {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column({ type: "uuid" })
	order_id!: string;

	@Column({ type: "uuid" })
	product_id!: string;

	@Column({ type: "integer" })
	quantity!: number;

	@Column({ type: "numeric", precision: 12, scale: 2 })
	unit_price_snapshot!: string;

	@Column({ type: "numeric", precision: 5, scale: 2, default: "0.00" })
	discount_percentage!: string;

	@Column({ type: "numeric", precision: 12, scale: 2 })
	line_total!: string;

	@ManyToOne(() => Order, {
		onDelete: "CASCADE",
		onUpdate: "CASCADE",
	})
	@JoinColumn({ name: "order_id" })
	order!: Relation<Order>;

	@ManyToOne(() => Product, {
		onDelete: "RESTRICT",
		onUpdate: "CASCADE",
	})
	@JoinColumn({ name: "product_id" })
	product!: Relation<Product>;
}
