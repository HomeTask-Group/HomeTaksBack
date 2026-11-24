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
import { Task } from "../../tasks/entities/task.entity";

export enum NotificationType {
  TASK_ASSIGNED = "task_assigned",
  TASK_DUE_SOON = "task_due_soon",
  TASK_COMPLETED = "task_completed",
}

@Entity("notifications")
export class Notification {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "enum", enum: NotificationType })
  type!: NotificationType;

  @Column({ type: "varchar", length: 200 })
  message!: string;

  @Column({ name: "is_read", type: "boolean", default: false })
  isRead!: boolean;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @ManyToOne(() => Group, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "group_id" })
  group?: Group | null;

  @Column({ name: "group_id", type: "uuid", nullable: true })
  groupId!: string | null;

  @ManyToOne(() => Task, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "task_id" })
  task?: Task | null;

  @Column({ name: "task_id", type: "uuid", nullable: true })
  taskId!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
