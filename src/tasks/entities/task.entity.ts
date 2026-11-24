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

export enum TaskPriority {
  BAJA = "baja",
  MEDIA = "media",
  ALTA = "alta",
}

export enum TaskStatus {
  PENDIENTE = "pendiente",
  COMPLETADA = "completada",
}

@Entity("tasks")
export class Task {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 150 })
  title!: string;

  @Column({ type: "text", nullable: true, default: "" })
  description!: string;

  @Column({ name: "due_date", type: "timestamptz" })
  dueDate!: Date;

  @Column({ type: "enum", enum: TaskPriority, default: TaskPriority.MEDIA })
  priority!: TaskPriority;

  @Column({ type: "enum", enum: TaskStatus, default: TaskStatus.PENDIENTE })
  status!: TaskStatus;

  @ManyToOne(() => User, (user) => user.assignedTasks, {
    eager: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "assigned_to_id" })
  assignedTo!: User;

  @Column({ name: "assigned_to_id", type: "uuid" })
  assignedToId!: string;

  @ManyToOne(() => User, { eager: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "created_by_id" })
  createdBy!: User;

  @Column({ name: "created_by_id", type: "uuid" })
  createdById!: string;

  @ManyToOne(() => Group, { eager: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "group_id" })
  group!: Group;

  @Column({ name: "group_id", type: "uuid" })
  groupId!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
