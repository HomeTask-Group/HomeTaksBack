import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Task } from "./entities/task.entity";
import { TasksService } from "./tasks.service";
import { TasksController } from "./tasks.controller";
import { GroupsModule } from "../groups/groups.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Task]),
    GroupsModule,
    NotificationsModule,
  ],
  providers: [TasksService],
  controllers: [TasksController],
})
export class TasksModule {}
