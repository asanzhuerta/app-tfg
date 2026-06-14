import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import type { Relation } from "typeorm";
import { Promotion } from "./Promotion";

export type PromotionDiscountTypeCode =
	| "percentage_discount"
	| "volume_percentage_discount"
	| "gift_product";

@Entity("promotion_discount_types")
@Index("promotion_discount_types_code_unique", ["code"], { unique: true })
@Index("promotion_discount_types_display_order_index", ["display_order"])
export class PromotionDiscountType {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column({ type: "text" })
	code!: PromotionDiscountTypeCode | string;

	@Column({ type: "text" })
	name!: string;

	@Column({ type: "text", nullable: true })
	description!: string | null;

	@Column({ type: "integer", default: 0 })
	display_order!: number;

	@Column({ type: "boolean", default: true })
	is_active!: boolean;

	@OneToMany(() => Promotion, (promotion) => promotion.discountType)
	promotions!: Relation<Promotion[]>;

	@CreateDateColumn({ type: "timestamptz" })
	created_at!: Date;

	@UpdateDateColumn({ type: "timestamptz" })
	updated_at!: Date;
}
