import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Group } from "../../groups/entities/group.entity";

@Entity("messages")
export class Message {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "text" })
  content!: string;

  @ManyToOne(() => User, { eager: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "sender_id" })
  sender!: User;

  @Column({ name: "sender_id", type: "uuid" })
  senderId!: string;

  @ManyToOne(() => Group, { onDelete: "CASCADE" })
  @JoinColumn({ name: "group_id" })
  group!: Group;

  @Column({ name: "group_id", type: "uuid" })
  groupId!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
