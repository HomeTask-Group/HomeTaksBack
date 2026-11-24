import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { RequestUser } from "../auth/decorators/current-user.decorator";
import { TasksService } from "./tasks.service";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { TaskStatus } from "./entities/task.entity";

@Controller("tasks")
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Body() dto: CreateTaskDto, @CurrentUser() user: RequestUser) {
    return this.tasksService.create(dto, user);
  }

  @Get()
  findAll(
    @CurrentUser() user: RequestUser,
    @Query("groupId") groupId?: string,
    @Query("day") day?: string,
    @Query("status") status?: TaskStatus,
    @Query("assignedToId") assignedToId?: string,
  ) {
    return this.tasksService.findAllByGroup(user, groupId, {
      day,
      status,
      assignedToId,
    });
  }

  @Get("my/all")
  findMyTasksAcrossAllGroups(
    @CurrentUser() user: RequestUser,
    @Query("day") day?: string,
    @Query("status") status?: TaskStatus,
  ) {
    return this.tasksService.findMyTasksAcrossAllGroups(user, { day, status });
  }

  @Get("all-groups")
  findMyTasksAcrossAllGroupsAlias(
    @CurrentUser() user: RequestUser,
    @Query("day") day?: string,
    @Query("status") status?: TaskStatus,
  ) {
    return this.tasksService.findMyTasksAcrossAllGroups(user, { day, status });
  }

  @Get("my")
  findMyTasksInActiveOrSpecifiedGroup(
    @CurrentUser() user: RequestUser,
    @Query("groupId") groupId?: string,
    @Query("day") day?: string,
    @Query("status") status?: TaskStatus,
  ) {
    return this.tasksService.findMyTasksByGroup(user, groupId, { day, status });
  }

  @Get("my/group/:groupId")
  findMyTasksByGroupParam(
    @Param("groupId") groupId: string,
    @CurrentUser() user: RequestUser,
    @Query("day") day?: string,
    @Query("status") status?: TaskStatus,
  ) {
    return this.tasksService.findMyTasksByGroup(user, groupId, { day, status });
  }

  @Get("group/:groupId")
  findAllByGroupParam(
    @Param("groupId") groupId: string,
    @CurrentUser() user: RequestUser,
    @Query("day") day?: string,
    @Query("status") status?: TaskStatus,
    @Query("assignedToId") assignedToId?: string,
  ) {
    return this.tasksService.findAllByGroup(user, groupId, {
      day,
      status,
      assignedToId,
    });
  }

  @Get("user/:userId")
  findByUser(
    @Param("userId") userId: string,
    @Query("day") day: string | undefined,
    @Query("groupId") groupId: string | undefined,
    @CurrentUser() user: RequestUser,
  ) {
    if (day) {
      return this.tasksService.findByUserAndDay(userId, day, user, groupId);
    }
    return this.tasksService.findByUser(userId, user, groupId);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.tasksService.update(id, dto, user);
  }

  @Patch(":id/toggle")
  toggleStatus(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.tasksService.toggleStatus(id, user);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.tasksService.remove(id, user);
  }
}
