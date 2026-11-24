import {
  Controller,
  Get,
  Patch,
  Body,
  Query,
  UseGuards,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { RequestUser } from "../auth/decorators/current-user.decorator";
import { UsersService } from "./users.service";
import { GroupsService } from "../groups/groups.service";
import { UserResponseDto } from "./dto/user-response.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly groupsService: GroupsService,
  ) {}

  @Get("me")
  async findMe(@CurrentUser() requester: RequestUser): Promise<UserResponseDto> {
    const user = await this.usersService.findById(requester.id);
    if (!user) {
      throw new NotFoundException("Usuario no encontrado");
    }
    return UserResponseDto.fromEntity(user, requester.activeGroupId);
  }

  @Get()
  async findAll(
    @CurrentUser() requester: RequestUser,
    @Query("groupId") queryGroupId?: string,
  ): Promise<UserResponseDto[]> {
    const targetGroupId = queryGroupId ?? requester.activeGroupId;
    if (!targetGroupId) {
      throw new BadRequestException(
        "No tienes un grupo activo ni especificaste groupId",
      );
    }

    await this.groupsService.requireMembership(requester.id, targetGroupId);
    const users = await this.usersService.findAllByGroup(targetGroupId);
    return users.map((u) => UserResponseDto.fromEntity(u, targetGroupId));
  }

  @Patch("me/profile-picture")
  async updateProfilePicture(
    @CurrentUser() requester: RequestUser,
    @Body("profilePicture") profilePicture: string,
  ): Promise<UserResponseDto> {
    const updatedUser = await this.usersService.updateProfilePicture(
      requester.id,
      profilePicture,
    );
    return UserResponseDto.fromEntity(updatedUser, requester.activeGroupId);
  }

  @Patch("me")
  async updateProfile(
    @CurrentUser() requester: RequestUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    await this.usersService.updateProfile(requester.id, dto);
    const updatedUser = await this.usersService.findById(requester.id);
    if (!updatedUser) {
      throw new NotFoundException("Usuario no encontrado");
    }
    return UserResponseDto.fromEntity(updatedUser, requester.activeGroupId);
  }
}
