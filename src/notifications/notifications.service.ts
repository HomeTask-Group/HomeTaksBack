import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOptionsWhere, Repository } from "typeorm";
import { Notification, NotificationType } from "./entities/notification.entity";

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
  ) {}

  async createForUser(
    userId: string,
    type: NotificationType,
    message: string,
    taskId: string | null = null,
    groupId: string | null = null,
  ): Promise<Notification> {
    const notification = this.notificationsRepository.create({
      userId,
      type,
      message,
      taskId,
      groupId,
    });
    return this.notificationsRepository.save(notification);
  }

  async getAll(userId: string, groupId?: string): Promise<Notification[]> {
    const where: FindOptionsWhere<Notification> = { userId };
    if (groupId) {
      where.groupId = groupId;
    }
    return this.notificationsRepository.find({
      where,
      relations: { group: true },
      order: { createdAt: "DESC" },
    });
  }

  async getUnread(userId: string, groupId?: string): Promise<Notification[]> {
    const where: FindOptionsWhere<Notification> = { userId, isRead: false };
    if (groupId) {
      where.groupId = groupId;
    }
    return this.notificationsRepository.find({
      where,
      relations: { group: true },
      order: { createdAt: "DESC" },
    });
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({
      where: { id, userId },
    });
    if (!notification) {
      throw new NotFoundException("Notificación no encontrada");
    }
    notification.isRead = true;
    return this.notificationsRepository.save(notification);
  }

  async markAllAsRead(userId: string, groupId?: string) {
    const criteria: FindOptionsWhere<Notification> = { userId, isRead: false };
    if (groupId) {
      criteria.groupId = groupId;
    }
    return this.notificationsRepository.update(criteria, { isRead: true });
  }
}
