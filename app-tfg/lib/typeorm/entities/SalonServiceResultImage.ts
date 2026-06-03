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

@Entity("salon_service_result_images")
@Index("salon_service_result_images_service_id_index", ["service_id"])
@Index("salon_service_result_images_service_id_display_order_index", [
	"service_id",
	"display_order",
])
export class SalonServiceResultImage {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column({ type: "uuid" })
	service_id!: string;

	@Column({ type: "text" })
	image_url!: string;

	@Column({ type: "integer", default: 0 })
	display_order!: number;

	@ManyToOne(() => SalonService, {
		onDelete: "CASCADE",
		onUpdate: "CASCADE",
	})
	@JoinColumn({ name: "service_id" })
	service!: Relation<SalonService>;

	@CreateDateColumn({ type: "timestamptz" })
	created_at!: Date;
}
