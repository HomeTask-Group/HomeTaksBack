import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Message } from "./entities/message.entity";
import { ChatService } from "./chat.service";
import { ChatController } from "./chat.controller";
import { GroupsModule } from "../groups/groups.module";

@Module({
  imports: [TypeOrmModule.forFeature([Message]), GroupsModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
