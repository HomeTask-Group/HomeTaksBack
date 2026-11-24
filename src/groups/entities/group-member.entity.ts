import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Group } from "./group.entity";
import { GroupRole } from "./group-role.entity";

@Entity("group_members")
@Unique(["userId", "groupId"])
export class GroupMember {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => User, (user) => user.memberships, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @ManyToOne(() => Group, (group) => group.members, { onDelete: "CASCADE" })
  @JoinColumn({ name: "group_id" })
  group!: Group;

  @Column({ name: "group_id", type: "uuid" })
  groupId!: string;

  @ManyToOne(() => GroupRole, { eager: true, onDelete: "RESTRICT" })
  @JoinColumn({ name: "role_id" })
  role!: GroupRole;

  @Column({ name: "role_id", type: "uuid" })
  roleId!: string;

  @CreateDateColumn({ name: "joined_at" })
  joinedAt!: Date;
}
