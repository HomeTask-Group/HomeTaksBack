import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Message } from "./entities/message.entity";
import { CreateMessageDto } from "./dto/create-message.dto";
import { GroupsService } from "../groups/groups.service";

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    private readonly groupsService: GroupsService,
  ) {}

  async send(
    senderId: string,
    activeGroupId: string | null,
    dto: CreateMessageDto,
  ): Promise<Message> {
    const targetGroupId = dto.groupId ?? activeGroupId;
    if (!targetGroupId) {
      throw new BadRequestException(
        "No tienes un grupo activo seleccionado ni enviaste groupId",
      );
    }

    await this.groupsService.requireMembership(senderId, targetGroupId);

    const message = this.messageRepo.create({
      content: dto.content,
      senderId,
      groupId: targetGroupId,
    });
    return this.messageRepo.save(message);
  }

  async getGroupMessages(
    userId: string,
    groupId: string,
    limit = 50,
  ): Promise<Message[]> {
    await this.groupsService.requireMembership(userId, groupId);
    return this.messageRepo.find({
      where: { groupId },
      order: { createdAt: "ASC" },
      take: limit,
    });
  }
}
