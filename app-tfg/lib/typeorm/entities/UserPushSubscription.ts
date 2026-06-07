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
import { User } from "./User";

@Entity("user_push_subscriptions")
@Index("user_push_subscriptions_user_id_index", ["user_id"])
@Index("user_push_subscriptions_endpoint_unique", ["endpoint"], { unique: true })
@Index("user_push_subscriptions_user_active_index", ["user_id", "revoked_at"])
export class UserPushSubscription {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column({ type: "uuid" })
	user_id!: string;

	@Column({ type: "text" })
	endpoint!: string;

	@Column({ type: "text" })
	p256dh!: string;

	@Column({ type: "text" })
	auth!: string;

	@Column({ type: "timestamptz", nullable: true })
	expiration_time!: Date | null;

	@Column({ type: "text", nullable: true })
	user_agent!: string | null;

	@Column({ type: "timestamptz", nullable: true })
	last_used_at!: Date | null;

	@Column({ type: "timestamptz", nullable: true })
	revoked_at!: Date | null;

	@ManyToOne(() => User, {
		onDelete: "CASCADE",
		onUpdate: "CASCADE",
	})
	@JoinColumn({ name: "user_id" })
	user!: Relation<User>;

	@CreateDateColumn({ type: "timestamptz" })
	created_at!: Date;

	@UpdateDateColumn({ type: "timestamptz" })
	updated_at!: Date;
}
