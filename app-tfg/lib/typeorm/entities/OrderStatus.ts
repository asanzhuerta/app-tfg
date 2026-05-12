import { Entity, PrimaryColumn, Column, OneToMany } from "typeorm";
import type { Relation } from "typeorm";
import { Order } from "./Order";

@Entity({ name: "order_statuses" })
export class OrderStatus {
	@PrimaryColumn({ type: "smallint" })
	id!: number;

	@Column({ type: "text", unique: true })
	code!: string;

	@Column({ type: "text", unique: true })
	name!: string;

	@OneToMany(() => Order, (order) => order.status)
	orders!: Relation<Order[]>;
}
