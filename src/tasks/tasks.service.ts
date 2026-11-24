import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, FindOptionsWhere, In, Repository } from "typeorm";
import { Task, TaskStatus } from "./entities/task.entity";
import { GroupsService } from "../groups/groups.service";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { RequestUser } from "../auth/decorators/current-user.decorator";
import { NotificationsService } from "../notifications/notifications.service";
import { NotificationType } from "../notifications/entities/notification.entity";
import { GroupMember } from "../groups/entities/group-member.entity";

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    private readonly groupsService: GroupsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private resolveTargetGroupId(
    requester: RequestUser,
    explicitGroupId?: string,
  ): string {
    const groupId = explicitGroupId ?? requester.activeGroupId;
    if (!groupId) {
      throw new BadRequestException(
        "No tienes un grupo activo seleccionado ni enviaste groupId",
      );
    }
    return groupId;
  }

  private buildDayRange(day: string): { start: Date; end: Date } {
    const start = new Date(day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(day);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  async create(dto: CreateTaskDto, requester: RequestUser): Promise<Task> {
    const targetGroupId = this.resolveTargetGroupId(requester, dto.groupId);
    const requesterMembership = await this.groupsService.requireMembership(
      requester.id,
      targetGroupId,
    );

    if (
      !requesterMembership.role.canAssignTasks &&
      dto.assignedToId !== requester.id
    ) {
      throw new ForbiddenException(
        `Tu rol (${requesterMembership.role.name}) en este grupo no tiene permisos para asignar tareas a otros integrantes`,
      );
    }

    const assignedMembership = await this.groupsService.getMembership(
      dto.assignedToId,
      targetGroupId,
    );
    if (!assignedMembership) {
      throw new NotFoundException(
        "El integrante asignado no pertenece a este grupo",
      );
    }

    const task = this.tasksRepository.create({
      title: dto.title.trim(),
      description: dto.description?.trim() ?? "",
      dueDate: new Date(dto.dueDate),
      priority: dto.priority,
      assignedToId: dto.assignedToId,
      createdById: requester.id,
      groupId: targetGroupId,
      status: TaskStatus.PENDIENTE,
    });
    const saved = await this.tasksRepository.save(task);

    if (dto.assignedToId !== requester.id) {
      await this.notificationsService.createForUser(
        dto.assignedToId,
        NotificationType.TASK_ASSIGNED,
        `${requester.name} te asignó la tarea "${saved.title}"`,
        saved.id,
        targetGroupId,
      );
    }

    return this.findOneOrFail(saved.id);
  }

  async findMyTasksAcrossAllGroups(
    requester: RequestUser,
    filters?: { day?: string; status?: TaskStatus },
  ): Promise<Task[]> {
    const memberships = await this.groupsService.getUserMemberships(
      requester.id,
    );
    const groupIds = memberships.map((m) => m.groupId);
    if (groupIds.length === 0) {
      return [];
    }

    const where: FindOptionsWhere<Task> = {
      assignedToId: requester.id,
      groupId: In(groupIds),
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.day) {
      const { start, end } = this.buildDayRange(filters.day);
      where.dueDate = Between(start, end);
    }

    return this.tasksRepository.find({
      where,
      relations: { group: true, assignedTo: true },
      order: { dueDate: "ASC" },
    });
  }

  async findMyTasksByGroup(
    requester: RequestUser,
    groupId?: string,
    filters?: { day?: string; status?: TaskStatus },
  ): Promise<Task[]> {
    const targetGroupId = this.resolveTargetGroupId(requester, groupId);
    await this.groupsService.requireMembership(requester.id, targetGroupId);

    const where: FindOptionsWhere<Task> = {
      assignedToId: requester.id,
      groupId: targetGroupId,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.day) {
      const { start, end } = this.buildDayRange(filters.day);
      where.dueDate = Between(start, end);
    }

    return this.tasksRepository.find({
      where,
      relations: { group: true, assignedTo: true },
      order: { dueDate: "ASC" },
    });
  }

  async findByUser(
    userId: string,
    requester: RequestUser,
    groupId?: string,
  ): Promise<Task[]> {
    const targetGroupId = this.resolveTargetGroupId(requester, groupId);
    await this.groupsService.requireMembership(requester.id, targetGroupId);

    return this.tasksRepository.find({
      where: { assignedToId: userId, groupId: targetGroupId },
      relations: { group: true, assignedTo: true },
      order: { dueDate: "ASC" },
    });
  }

  async findByUserAndDay(
    userId: string,
    day: string,
    requester: RequestUser,
    groupId?: string,
  ): Promise<Task[]> {
    const targetGroupId = this.resolveTargetGroupId(requester, groupId);
    await this.groupsService.requireMembership(requester.id, targetGroupId);
    const { start, end } = this.buildDayRange(day);

    return this.tasksRepository.find({
      where: {
        assignedToId: userId,
        groupId: targetGroupId,
        dueDate: Between(start, end),
      },
      relations: { group: true, assignedTo: true },
      order: { dueDate: "ASC" },
    });
  }

  async findAllByGroup(
    requester: RequestUser,
    groupId?: string,
    filters?: { day?: string; status?: TaskStatus; assignedToId?: string },
  ): Promise<Task[]> {
    const targetGroupId = this.resolveTargetGroupId(requester, groupId);
    await this.groupsService.requireMembership(requester.id, targetGroupId);

    const where: FindOptionsWhere<Task> = {
      groupId: targetGroupId,
    };

    if (filters?.assignedToId) {
      where.assignedToId = filters.assignedToId;
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.day) {
      const { start, end } = this.buildDayRange(filters.day);
      where.dueDate = Between(start, end);
    }

    return this.tasksRepository.find({
      where,
      relations: { group: true, assignedTo: true },
      order: { dueDate: "ASC" },
    });
  }

  async findOneOrFail(id: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: { group: true, assignedTo: true },
    });
    if (!task) throw new NotFoundException("Tarea no encontrada");
    return task;
  }

  async update(
    id: string,
    dto: UpdateTaskDto,
    requester: RequestUser,
  ): Promise<Task> {
    const task = await this.findOneOrFail(id);
    const membership = await this._assertGroupMemberAndCanModify(
      task,
      requester,
    );

    if (dto.assignedToId && dto.assignedToId !== task.assignedToId) {
      if (
        !membership.role.canAssignTasks &&
        dto.assignedToId !== requester.id
      ) {
        throw new ForbiddenException(
          `Tu rol (${membership.role.name}) no tiene permisos para reasignar tareas a otros integrantes`,
        );
      }

      const assignedMembership = await this.groupsService.getMembership(
        dto.assignedToId,
        task.groupId,
      );
      if (!assignedMembership) {
        throw new NotFoundException(
          "El integrante asignado no pertenece a este grupo",
        );
      }
    }

    Object.assign(task, {
      ...(dto.title !== undefined && { title: dto.title.trim() }),
      ...(dto.description !== undefined && {
        description: dto.description.trim(),
      }),
      ...(dto.dueDate !== undefined && { dueDate: new Date(dto.dueDate) }),
      ...(dto.priority !== undefined && { priority: dto.priority }),
      ...(dto.assignedToId !== undefined && { assignedToId: dto.assignedToId }),
      ...(dto.status !== undefined && { status: dto.status }),
    });

    await this.tasksRepository.save(task);
    return this.findOneOrFail(task.id);
  }

  async toggleStatus(id: string, requester: RequestUser): Promise<Task> {
    const task = await this.findOneOrFail(id);
    await this._assertGroupMemberAndCanModify(task, requester);

    const wasCompleted = task.status === TaskStatus.PENDIENTE;
    task.status = wasCompleted ? TaskStatus.COMPLETADA : TaskStatus.PENDIENTE;
    const saved = await this.tasksRepository.save(task);

    if (wasCompleted && task.createdById !== requester.id) {
      await this.notificationsService.createForUser(
        task.createdById,
        NotificationType.TASK_COMPLETED,
        `${requester.name} completó la tarea "${task.title}"`,
        task.id,
        task.groupId,
      );
    }

    return saved;
  }

  async remove(id: string, requester: RequestUser): Promise<void> {
    const task = await this.findOneOrFail(id);
    await this._assertGroupMemberAndCanModify(task, requester);
    await this.tasksRepository.remove(task);
  }

  private async _assertGroupMemberAndCanModify(
    task: Task,
    requester: RequestUser,
  ): Promise<GroupMember> {
    const membership = await this.groupsService.getMembership(
      requester.id,
      task.groupId,
    );
    if (!membership) {
      throw new NotFoundException("Tarea no encontrada en tus grupos");
    }

    const isOwnerOrAssignee =
      task.createdById === requester.id || task.assignedToId === requester.id;
    const canModify = isOwnerOrAssignee || membership.role.canAssignTasks;
    if (!canModify) {
      throw new ForbiddenException(
        "No tienes permiso para modificar esta tarea",
      );
    }
    return membership;
  }
}
