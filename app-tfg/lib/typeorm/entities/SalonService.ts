import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	ManyToOne,
	OneToMany,
	OneToOne,
	JoinColumn,
	Index,
} from "typeorm";
import type { Relation } from "typeorm";
import { Client } from "./Client";
import { User } from "./User";
import { SalonClient } from "./SalonClient";
import { SalonServiceTechnicalSheet } from "./SalonServiceTechnicalSheet";
import { SalonServiceProductUsage } from "./SalonServiceProductUsage";
import { SalonServiceResultImage } from "./SalonServiceResultImage";

@Entity("salon_services")
@Index("salon_services_salon_client_id_index", ["salon_client_id"])
@Index("salon_services_client_id_index", ["client_id"])
@Index("salon_services_recorded_by_user_id_index", ["recorded_by_user_id"])
@Index("salon_services_service_date_index", ["service_date"])
export class SalonService {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column({ type: "uuid" })
	salon_client_id!: string;

	@Column({ type: "uuid" })
	client_id!: string;

	@Column({ type: "uuid" })
	recorded_by_user_id!: string;

	@Column({ type: "date" })
	service_date!: string;

	@Column({ type: "text" })
	service_type!: string;

	@Column({ type: "text", nullable: true })
	notes!: string | null;

	@Column({ type: "text", nullable: true })
	result!: string | null;

	@ManyToOne(() => SalonClient, {
		onDelete: "CASCADE",
		onUpdate: "CASCADE",
	})
	@JoinColumn({ name: "salon_client_id" })
	salonClient!: Relation<SalonClient>;

	@ManyToOne(() => Client, {
		onDelete: "CASCADE",
		onUpdate: "CASCADE",
	})
	@JoinColumn({ name: "client_id" })
	client!: Relation<Client>;

	@ManyToOne(() => User, {
		onDelete: "RESTRICT",
		onUpdate: "CASCADE",
	})
	@JoinColumn({ name: "recorded_by_user_id" })
	recordedByUser!: Relation<User>;

	@OneToOne(() => SalonServiceTechnicalSheet, (technicalSheet) => technicalSheet.service)
	technicalSheet!: Relation<SalonServiceTechnicalSheet | null>;

	@OneToMany(() => SalonServiceProductUsage, (productUsage) => productUsage.service)
	productUsages!: Relation<SalonServiceProductUsage[]>;

	@OneToMany(() => SalonServiceResultImage, (resultImage) => resultImage.service)
	resultImages!: Relation<SalonServiceResultImage[]>;

	@CreateDateColumn({ type: "timestamptz" })
	created_at!: Date;

	@UpdateDateColumn({ type: "timestamptz" })
	updated_at!: Date;
}
