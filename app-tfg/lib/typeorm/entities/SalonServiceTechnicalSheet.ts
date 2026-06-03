import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	OneToOne,
	JoinColumn,
	Index,
} from "typeorm";
import type { Relation } from "typeorm";
import { SalonService } from "./SalonService";

@Entity("salon_service_technical_sheets")
@Index("salon_service_technical_sheets_service_id_index", ["service_id"], {
	unique: true,
})
export class SalonServiceTechnicalSheet {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column({ type: "uuid" })
	service_id!: string;

	@Column({ type: "text", nullable: true })
	technical_description!: string | null;

	@Column({ type: "text", nullable: true })
	formula!: string | null;

	@Column({ type: "text", nullable: true })
	technical_notes!: string | null;

	@OneToOne(() => SalonService, {
		onDelete: "CASCADE",
		onUpdate: "CASCADE",
	})
	@JoinColumn({ name: "service_id" })
	service!: Relation<SalonService>;

	@CreateDateColumn({ type: "timestamptz" })
	created_at!: Date;

	@UpdateDateColumn({ type: "timestamptz" })
	updated_at!: Date;
}
