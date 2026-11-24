import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { RequestUser } from "../auth/decorators/current-user.decorator";
import { GroupsService } from "./groups.service";
import { CreateGroupDto } from "./dto/create-group.dto";
import { JoinGroupDto } from "./dto/join-group.dto";
import { CreateGroupRoleDto } from "./dto/create-group-role.dto";
import { UpdateGroupRoleDto } from "./dto/update-group-role.dto";
import { AssignMemberRoleDto } from "./dto/assign-member-role.dto";

@Controller("groups")
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  async getMyGroups(@CurrentUser() requester: RequestUser) {
    return this.groupsService.getUserGroups(
      requester.id,
      requester.activeGroupId,
    );
  }

  @Get("my-groups")
  async getMyGroupsAlias(@CurrentUser() requester: RequestUser) {
    return this.groupsService.getUserGroups(
      requester.id,
      requester.activeGroupId,
    );
  }

  @Get("active")
  async getActiveGroup(@CurrentUser() requester: RequestUser) {
    if (!requester.activeGroupId) {
      throw new BadRequestException("No tienes ningún grupo activo seleccionado");
    }
    return this.groupsService.findByIdForMember(
      requester.activeGroupId,
      requester.id,
    );
  }

  @Get("me")
  async getMyActiveGroupAlias(@CurrentUser() requester: RequestUser) {
    return this.getActiveGroup(requester);
  }

  @Post()
  async create(
    @CurrentUser() requester: RequestUser,
    @Body() dto: CreateGroupDto,
  ) {
    return this.groupsService.createForUser(requester.id, dto);
  }

  @Post("join")
  async join(
    @CurrentUser() requester: RequestUser,
    @Body() dto: JoinGroupDto,
  ) {
    return this.groupsService.joinByInviteCode(requester.id, dto);
  }

  @Patch("active/:groupId")
  async switchActiveGroup(
    @CurrentUser() requester: RequestUser,
    @Param("groupId") groupId: string,
  ) {
    return this.groupsService.switchActiveGroup(requester.id, groupId);
  }

  @Get(":groupId")
  async getGroupById(
    @CurrentUser() requester: RequestUser,
    @Param("groupId") groupId: string,
  ) {
    return this.groupsService.findByIdForMember(groupId, requester.id);
  }

  @Get(":groupId/roles")
  async getGroupRoles(
    @CurrentUser() requester: RequestUser,
    @Param("groupId") groupId: string,
  ) {
    return this.groupsService.getGroupRoles(groupId, requester.id);
  }

  @Post(":groupId/roles")
  async createGroupRole(
    @CurrentUser() requester: RequestUser,
    @Param("groupId") groupId: string,
    @Body() dto: CreateGroupRoleDto,
  ) {
    return this.groupsService.createGroupRole(groupId, requester.id, dto);
  }

  @Patch(":groupId/roles/:roleId")
  async updateGroupRole(
    @CurrentUser() requester: RequestUser,
    @Param("groupId") groupId: string,
    @Param("roleId") roleId: string,
    @Body() dto: UpdateGroupRoleDto,
  ) {
    return this.groupsService.updateGroupRole(
      groupId,
      roleId,
      requester.id,
      dto,
    );
  }

  @Delete(":groupId/roles/:roleId")
  async removeGroupRole(
    @CurrentUser() requester: RequestUser,
    @Param("groupId") groupId: string,
    @Param("roleId") roleId: string,
  ) {
    await this.groupsService.removeGroupRole(groupId, roleId, requester.id);
    return { deleted: true };
  }

  @Patch(":groupId/members/:userId/role")
  async assignMemberRole(
    @CurrentUser() requester: RequestUser,
    @Param("groupId") groupId: string,
    @Param("userId") targetUserId: string,
    @Body() dto: AssignMemberRoleDto,
  ) {
    return this.groupsService.assignMemberRole(
      groupId,
      targetUserId,
      dto.roleId,
      requester.id,
    );
  }
}
