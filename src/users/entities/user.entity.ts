import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { Task } from "../../tasks/entities/task.entity";
import { Group } from "../../groups/entities/group.entity";
import { GroupMember } from "../../groups/entities/group-member.entity";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "varchar", length: 150, unique: true })
  email!: string;

  @Column({ name: "password_hash", type: "varchar" })
  passwordHash!: string;

  @ManyToOne(() => Group, { nullable: true, eager: false, onDelete: "SET NULL" })
  @JoinColumn({ name: "active_group_id" })
  activeGroup?: Group | null;

  @Column({ name: "active_group_id", type: "uuid", nullable: true })
  activeGroupId!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @OneToMany(() => GroupMember, (membership) => membership.user)
  memberships!: GroupMember[];

  @OneToMany(() => Task, (task) => task.assignedTo)
  assignedTasks!: Task[];

  @Column({ type: "text", nullable: true, name: "profile_picture" })
  profilePicture!: string;
}
