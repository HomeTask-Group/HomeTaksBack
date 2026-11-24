import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { RequestUser } from "../auth/decorators/current-user.decorator";
import { ChatService } from "./chat.service";
import { CreateMessageDto } from "./dto/create-message.dto";

@UseGuards(JwtAuthGuard)
@Controller("chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  send(@CurrentUser() user: RequestUser, @Body() dto: CreateMessageDto) {
    return this.chatService.send(user.id, user.activeGroupId, dto);
  }

  @Get()
  getActiveGroupMessages(
    @CurrentUser() user: RequestUser,
    @Query("groupId") queryGroupId?: string,
    @Query("limit") limit?: string,
  ) {
    const targetGroupId = queryGroupId ?? user.activeGroupId;
    if (!targetGroupId) {
      throw new BadRequestException(
        "No tienes un grupo activo seleccionado ni enviaste groupId",
      );
    }
    return this.chatService.getGroupMessages(
      user.id,
      targetGroupId,
      limit ? +limit : 50,
    );
  }

  @Get("group/:groupId")
  getMessagesByGroup(
    @CurrentUser() user: RequestUser,
    @Param("groupId") groupId: string,
    @Query("limit") limit?: string,
  ) {
    return this.chatService.getGroupMessages(
      user.id,
      groupId,
      limit ? +limit : 50,
    );
  }
}
