import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { Group } from "./group.entity";

@Entity("group_roles")
export class GroupRole {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Group, (group) => group.roles, { onDelete: "CASCADE" })
  @JoinColumn({ name: "group_id" })
  group!: Group;

  @Column({ name: "group_id", type: "uuid" })
  groupId!: string;

  @Column({ type: "varchar", length: 60 })
  name!: string;

  @Column({ name: "can_assign_tasks", type: "boolean", default: false })
  canAssignTasks!: boolean;

  @Column({ name: "can_manage_group", type: "boolean", default: false })
  canManageGroup!: boolean;

  @Column({ name: "is_default", type: "boolean", default: false })
  isDefault!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
