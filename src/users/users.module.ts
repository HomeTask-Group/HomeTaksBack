import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { GroupMember } from "../groups/entities/group-member.entity";
import { GroupsModule } from "../groups/groups.module";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";

@Module({
  imports: [TypeOrmModule.forFeature([User, GroupMember]), GroupsModule],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
