import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	ManyToOne,
	OneToMany,
	JoinColumn,
	Index,
} from "typeorm";
import type { Relation } from "typeorm";
import { Client } from "./Client";
import { User } from "./User";
import { SalonServiceTemplateProductUsage } from "./SalonServiceTemplateProductUsage";

@Entity("salon_service_templates")
@Index("salon_service_templates_client_id_index", ["client_id"])
@Index("salon_service_templates_created_by_user_id_index", ["created_by_user_id"])
@Index("salon_service_templates_name_index", ["name"])
export class SalonServiceTemplate {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column({ type: "uuid" })
	client_id!: string;

	@Column({ type: "uuid" })
	created_by_user_id!: string;

	@Column({ type: "text" })
	name!: string;

	@Column({ type: "text" })
	service_type!: string;

	@Column({ type: "text", nullable: true })
	notes!: string | null;

	@Column({ type: "text", nullable: true })
	result!: string | null;

	@Column({ type: "text", nullable: true })
	technical_description!: string | null;

	@Column({ type: "text", nullable: true })
	formula!: string | null;

	@Column({ type: "text", nullable: true })
	technical_notes!: string | null;

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
	@JoinColumn({ name: "created_by_user_id" })
	createdByUser!: Relation<User>;

	@OneToMany(
		() => SalonServiceTemplateProductUsage,
		(productUsage) => productUsage.template,
	)
	productUsages!: Relation<SalonServiceTemplateProductUsage[]>;

	@CreateDateColumn({ type: "timestamptz" })
	created_at!: Date;

	@UpdateDateColumn({ type: "timestamptz" })
	updated_at!: Date;
}
