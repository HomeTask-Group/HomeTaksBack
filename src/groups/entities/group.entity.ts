import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from "typeorm";
import { GroupMember } from "./group-member.entity";
import { GroupRole } from "./group-role.entity";

export enum GroupType {
  FAMILY = "family",
  ROOMMATES = "roommates",
  COUPLE = "couple",
  CUSTOM = "custom",
}

@Entity("groups")
export class Group {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({
    type: "enum",
    enum: GroupType,
    default: GroupType.CUSTOM,
  })
  type!: GroupType;

  @Column({ name: "invite_code", type: "varchar", length: 10, unique: true })
  inviteCode!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @OneToMany(() => GroupMember, (member) => member.group)
  members!: GroupMember[];

  @OneToMany(() => GroupRole, (role) => role.group)
  roles!: GroupRole[];
}
