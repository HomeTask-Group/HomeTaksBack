import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as crypto from "crypto";
import { Group, GroupType } from "./entities/group.entity";
import { GroupRole } from "./entities/group-role.entity";
import { GroupMember } from "./entities/group-member.entity";
import { User } from "../users/entities/user.entity";
import { CreateGroupDto } from "./dto/create-group.dto";
import { JoinGroupDto } from "./dto/join-group.dto";
import { CreateGroupRoleDto } from "./dto/create-group-role.dto";
import { UpdateGroupRoleDto } from "./dto/update-group-role.dto";

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupsRepository: Repository<Group>,
    @InjectRepository(GroupRole)
    private readonly rolesRepository: Repository<GroupRole>,
    @InjectRepository(GroupMember)
    private readonly membersRepository: Repository<GroupMember>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  private generateInviteCode(): string {
    return crypto.randomBytes(4).toString("hex").toUpperCase();
  }

  private getDefaultRoleTemplates(type: GroupType): Array<{
    name: string;
    canAssignTasks: boolean;
    canManageGroup: boolean;
    isDefault: boolean;
  }> {
    switch (type) {
      case GroupType.FAMILY:
        return [
          {
            name: "Tutor / Padre",
            canAssignTasks: true,
            canManageGroup: true,
            isDefault: false,
          },
          {
            name: "Integrante",
            canAssignTasks: false,
            canManageGroup: false,
            isDefault: true,
          },
        ];
      case GroupType.ROOMMATES:
        return [
          {
            name: "Roomie Admin",
            canAssignTasks: true,
            canManageGroup: true,
            isDefault: false,
          },
          {
            name: "Roomie",
            canAssignTasks: true,
            canManageGroup: false,
            isDefault: true,
          },
        ];
      case GroupType.COUPLE:
        return [
          {
            name: "Pareja",
            canAssignTasks: true,
            canManageGroup: true,
            isDefault: true,
          },
        ];
      case GroupType.CUSTOM:
      default:
        return [
          {
            name: "Coordinador",
            canAssignTasks: true,
            canManageGroup: true,
            isDefault: false,
          },
          {
            name: "Miembro",
            canAssignTasks: false,
            canManageGroup: false,
            isDefault: true,
          },
        ];
    }
  }

  async createGroupWithRoles(
    name: string,
    type: GroupType = GroupType.CUSTOM,
    creatorRoleName?: string,
  ): Promise<{ group: Group; creatorRole: GroupRole; roles: GroupRole[] }> {
    const group = await this.groupsRepository.save(
      this.groupsRepository.create({
        name: name.trim(),
        type,
        inviteCode: this.generateInviteCode(),
      }),
    );

    const templates = this.getDefaultRoleTemplates(type);
    const createdRoles: GroupRole[] = [];

    for (const tpl of templates) {
      const role = await this.rolesRepository.save(
        this.rolesRepository.create({
          groupId: group.id,
          name: tpl.name,
          canAssignTasks: tpl.canAssignTasks,
          canManageGroup: tpl.canManageGroup,
          isDefault: tpl.isDefault,
        }),
      );
      createdRoles.push(role);
    }

    let creatorRole =
      createdRoles.find((r) => r.canManageGroup) ?? createdRoles[0];

    if (creatorRoleName && creatorRoleName.trim()) {
      const normalized = creatorRoleName.trim();
      const existing = createdRoles.find(
        (r) => r.name.toLowerCase() === normalized.toLowerCase(),
      );
      if (existing) {
        existing.canAssignTasks = true;
        existing.canManageGroup = true;
        creatorRole = await this.rolesRepository.save(existing);
      } else {
        creatorRole = await this.rolesRepository.save(
          this.rolesRepository.create({
            groupId: group.id,
            name: normalized,
            canAssignTasks: true,
            canManageGroup: true,
            isDefault: false,
          }),
        );
        createdRoles.push(creatorRole);
      }
    }

    return { group, creatorRole, roles: createdRoles };
  }

  async createForUser(userId: string, dto: CreateGroupDto) {
    const { group, creatorRole } = await this.createGroupWithRoles(
      dto.name,
      dto.type ?? GroupType.CUSTOM,
      dto.roleName,
    );

    const membership = await this.membersRepository.save(
      this.membersRepository.create({
        userId,
        groupId: group.id,
        roleId: creatorRole.id,
      }),
    );
    membership.role = creatorRole;

    await this.usersRepository.update({ id: userId }, { activeGroupId: group.id });

    return {
      group,
      role: creatorRole,
      activeGroupId: group.id,
    };
  }

  async findByInviteCode(code: string): Promise<Group> {
    const group = await this.groupsRepository.findOne({
      where: { inviteCode: code.trim().toUpperCase() },
      relations: { roles: true },
    });
    if (!group) {
      throw new NotFoundException("Código de invitación no válido");
    }
    return group;
  }

  async resolveJoinRole(
    group: Group,
    options?: { roleId?: string; roleName?: string },
  ): Promise<GroupRole> {
    const roles =
      group.roles && group.roles.length > 0
        ? group.roles
        : await this.rolesRepository.find({ where: { groupId: group.id } });

    if (options?.roleId) {
      const found = roles.find((r) => r.id === options.roleId);
      if (!found) {
        throw new BadRequestException("El rol seleccionado no pertenece a este grupo");
      }
      return found;
    }

    if (options?.roleName && options.roleName.trim()) {
      const normalized = options.roleName.trim();
      const existing = roles.find(
        (r) => r.name.toLowerCase() === normalized.toLowerCase(),
      );
      if (existing) {
        return existing;
      }

      const defaultTpl = roles.find((r) => r.isDefault) ?? roles[0];
      return this.rolesRepository.save(
        this.rolesRepository.create({
          groupId: group.id,
          name: normalized,
          canAssignTasks: defaultTpl ? defaultTpl.canAssignTasks : false,
          canManageGroup: defaultTpl ? defaultTpl.canManageGroup : false,
          isDefault: false,
        }),
      );
    }

    const defaultRole = roles.find((r) => r.isDefault) ?? roles[0];
    if (!defaultRole) {
      return this.rolesRepository.save(
        this.rolesRepository.create({
          groupId: group.id,
          name: "Miembro",
          canAssignTasks: false,
          canManageGroup: false,
          isDefault: true,
        }),
      );
    }
    return defaultRole;
  }

  async addMemberToGroup(
    userId: string,
    groupId: string,
    roleId: string,
  ): Promise<GroupMember> {
    const existing = await this.membersRepository.findOne({
      where: { userId, groupId },
    });
    if (existing) {
      throw new ConflictException("Ya perteneces a este grupo");
    }

    const member = this.membersRepository.create({
      userId,
      groupId,
      roleId,
    });
    const saved = await this.membersRepository.save(member);
    return this.requireMembership(userId, groupId) ?? saved;
  }

  async joinByInviteCode(userId: string, dto: JoinGroupDto) {
    const group = await this.findByInviteCode(dto.inviteCode);
    const existing = await this.membersRepository.findOne({
      where: { userId, groupId: group.id },
    });
    if (existing) {
      throw new ConflictException("Ya perteneces a este grupo");
    }

    const role = await this.resolveJoinRole(group, {
      roleId: dto.roleId,
      roleName: dto.roleName,
    });

    await this.membersRepository.save(
      this.membersRepository.create({
        userId,
        groupId: group.id,
        roleId: role.id,
      }),
    );

    await this.usersRepository.update({ id: userId }, { activeGroupId: group.id });

    return {
      group: {
        id: group.id,
        name: group.name,
        type: group.type,
        inviteCode: group.inviteCode,
      },
      role,
      activeGroupId: group.id,
    };
  }

  async getMembership(
    userId: string,
    groupId: string,
  ): Promise<GroupMember | null> {
    return this.membersRepository.findOne({
      where: { userId, groupId },
      relations: { role: true, group: true },
    });
  }

  async requireMembership(
    userId: string,
    groupId: string,
  ): Promise<GroupMember> {
    const membership = await this.getMembership(userId, groupId);
    if (!membership) {
      throw new ForbiddenException("No perteneces a este grupo");
    }
    return membership;
  }

  async getUserMemberships(userId: string): Promise<GroupMember[]> {
    return this.membersRepository.find({
      where: { userId },
      relations: { group: true, role: true },
      order: { joinedAt: "ASC" },
    });
  }

  async getUserGroups(userId: string, activeGroupId?: string | null) {
    const memberships = await this.getUserMemberships(userId);
    return memberships.map((m) => ({
      id: m.group.id,
      name: m.group.name,
      type: m.group.type,
      inviteCode: m.group.inviteCode,
      createdAt: m.group.createdAt,
      joinedAt: m.joinedAt,
      isActive: m.groupId === activeGroupId,
      myRole: {
        id: m.role.id,
        name: m.role.name,
        canAssignTasks: m.role.canAssignTasks,
        canManageGroup: m.role.canManageGroup,
      },
    }));
  }

  async switchActiveGroup(userId: string, groupId: string) {
    const membership = await this.requireMembership(userId, groupId);
    await this.usersRepository.update({ id: userId }, { activeGroupId: groupId });

    return {
      activeGroupId: groupId,
      group: {
        id: membership.group.id,
        name: membership.group.name,
        type: membership.group.type,
        inviteCode: membership.group.inviteCode,
      },
      myRole: {
        id: membership.role.id,
        name: membership.role.name,
        canAssignTasks: membership.role.canAssignTasks,
        canManageGroup: membership.role.canManageGroup,
      },
    };
  }

  async findByIdForMember(groupId: string, userId: string) {
    const membership = await this.requireMembership(userId, groupId);
    const group = await this.groupsRepository.findOne({
      where: { id: groupId },
      relations: { roles: true },
    });
    if (!group) {
      throw new NotFoundException("Grupo no encontrado");
    }

    const members = await this.membersRepository.find({
      where: { groupId },
      relations: { user: true, role: true },
      order: { joinedAt: "ASC" },
    });

    return {
      id: group.id,
      name: group.name,
      type: group.type,
      inviteCode: group.inviteCode,
      createdAt: group.createdAt,
      myRole: {
        id: membership.role.id,
        name: membership.role.name,
        canAssignTasks: membership.role.canAssignTasks,
        canManageGroup: membership.role.canManageGroup,
      },
      roles: group.roles,
      members: members.map((m) => ({
        membershipId: m.id,
        userId: m.userId,
        name: m.user.name,
        email: m.user.email,
        profilePicture: m.user.profilePicture,
        joinedAt: m.joinedAt,
        role: {
          id: m.role.id,
          name: m.role.name,
          canAssignTasks: m.role.canAssignTasks,
          canManageGroup: m.role.canManageGroup,
        },
      })),
    };
  }

  async getGroupRoles(groupId: string, userId: string): Promise<GroupRole[]> {
    await this.requireMembership(userId, groupId);
    return this.rolesRepository.find({
      where: { groupId },
      order: { createdAt: "ASC" },
    });
  }

  async createGroupRole(
    groupId: string,
    userId: string,
    dto: CreateGroupRoleDto,
  ): Promise<GroupRole> {
    const membership = await this.requireMembership(userId, groupId);
    if (!membership.role.canManageGroup) {
      throw new ForbiddenException(
        "Tu rol en este grupo no tiene permisos para administrar roles",
      );
    }

    if (dto.isDefault) {
      await this.rolesRepository.update({ groupId }, { isDefault: false });
    }

    const role = this.rolesRepository.create({
      groupId,
      name: dto.name.trim(),
      canAssignTasks: dto.canAssignTasks ?? false,
      canManageGroup: dto.canManageGroup ?? false,
      isDefault: dto.isDefault ?? false,
    });
    return this.rolesRepository.save(role);
  }

  async updateGroupRole(
    groupId: string,
    roleId: string,
    userId: string,
    dto: UpdateGroupRoleDto,
  ): Promise<GroupRole> {
    const membership = await this.requireMembership(userId, groupId);
    if (!membership.role.canManageGroup) {
      throw new ForbiddenException(
        "Tu rol en este grupo no tiene permisos para administrar roles",
      );
    }

    const role = await this.rolesRepository.findOne({
      where: { id: roleId, groupId },
    });
    if (!role) {
      throw new NotFoundException("Rol no encontrado en este grupo");
    }

    if (dto.isDefault) {
      await this.rolesRepository.update({ groupId }, { isDefault: false });
    }

    Object.assign(role, {
      ...(dto.name !== undefined && { name: dto.name.trim() }),
      ...(dto.canAssignTasks !== undefined && {
        canAssignTasks: dto.canAssignTasks,
      }),
      ...(dto.canManageGroup !== undefined && {
        canManageGroup: dto.canManageGroup,
      }),
      ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
    });

    return this.rolesRepository.save(role);
  }

  async removeGroupRole(
    groupId: string,
    roleId: string,
    userId: string,
  ): Promise<void> {
    const membership = await this.requireMembership(userId, groupId);
    if (!membership.role.canManageGroup) {
      throw new ForbiddenException(
        "Tu rol en este grupo no tiene permisos para eliminar roles",
      );
    }

    const role = await this.rolesRepository.findOne({
      where: { id: roleId, groupId },
    });
    if (!role) {
      throw new NotFoundException("Rol no encontrado en este grupo");
    }

    const assignedCount = await this.membersRepository.count({
      where: { groupId, roleId },
    });
    if (assignedCount > 0) {
      throw new BadRequestException(
        "No puedes eliminar un rol que está asignado a miembros del grupo",
      );
    }

    await this.rolesRepository.remove(role);
  }

  async assignMemberRole(
    groupId: string,
    targetUserId: string,
    roleId: string,
    requesterId: string,
  ) {
    const requesterMembership = await this.requireMembership(
      requesterId,
      groupId,
    );
    if (!requesterMembership.role.canManageGroup) {
      throw new ForbiddenException(
        "Tu rol en este grupo no tiene permisos para cambiar el rol de los miembros",
      );
    }

    const targetMembership = await this.membersRepository.findOne({
      where: { groupId, userId: targetUserId },
    });
    if (!targetMembership) {
      throw new NotFoundException("El usuario no pertenece a este grupo");
    }

    const role = await this.rolesRepository.findOne({
      where: { id: roleId, groupId },
    });
    if (!role) {
      throw new NotFoundException("El rol indicado no pertenece a este grupo");
    }

    targetMembership.roleId = role.id;
    targetMembership.role = role;
    await this.membersRepository.save(targetMembership);

    return {
      userId: targetUserId,
      groupId,
      role: {
        id: role.id,
        name: role.name,
        canAssignTasks: role.canAssignTasks,
        canManageGroup: role.canManageGroup,
      },
    };
  }
}
