import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Group } from "./entities/group.entity";
import { GroupRole } from "./entities/group-role.entity";
import { GroupMember } from "./entities/group-member.entity";
import { User } from "../users/entities/user.entity";
import { GroupsService } from "./groups.service";
import { GroupsController } from "./groups.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Group, GroupRole, GroupMember, User])],
  providers: [GroupsService],
  controllers: [GroupsController],
  exports: [GroupsService],
})
export class GroupsModule {}
