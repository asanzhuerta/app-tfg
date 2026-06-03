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
import { SalonService } from "./SalonService";
import { SalonProductSuggestion } from "./SalonProductSuggestion";

@Entity("salon_clients")
@Index("salon_clients_client_id_index", ["client_id"])
@Index("salon_clients_name_index", ["name"])
export class SalonClient {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column({ type: "uuid" })
	client_id!: string;

	@Column({ type: "text" })
	name!: string;

	@Column({ type: "text", nullable: true })
	phone!: string | null;

	@Column({ type: "text", nullable: true })
	email!: string | null;

	@Column({ type: "text", nullable: true })
	notes!: string | null;

	@ManyToOne(() => Client, {
		onDelete: "CASCADE",
		onUpdate: "CASCADE",
	})
	@JoinColumn({ name: "client_id" })
	client!: Relation<Client>;

	@OneToMany(() => SalonService, (service) => service.salonClient)
	services!: Relation<SalonService[]>;

	@OneToMany(() => SalonProductSuggestion, (suggestion) => suggestion.salonClient)
	productSuggestions!: Relation<SalonProductSuggestion[]>;

	@CreateDateColumn({ type: "timestamptz" })
	created_at!: Date;

	@UpdateDateColumn({ type: "timestamptz" })
	updated_at!: Date;
}
