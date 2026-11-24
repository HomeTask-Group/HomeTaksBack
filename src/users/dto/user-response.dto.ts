import { User } from "../entities/user.entity";

export interface UserGroupSummaryDto {
  id: string;
  name: string;
  type: string;
  inviteCode: string;
  isActive: boolean;
  role: {
    id: string;
    name: string;
    canAssignTasks: boolean;
    canManageGroup: boolean;
  };
}

export class UserResponseDto {
  id!: string;
  name!: string;
  email!: string;
  profilePicture?: string;
  activeGroupId!: string | null;
  activeGroupName?: string;
  activeGroupType?: string;
  activeGroupInviteCode?: string;
  activeRole?: {
    id: string;
    name: string;
    canAssignTasks: boolean;
    canManageGroup: boolean;
  } | null;
  groups?: UserGroupSummaryDto[];

  static fromEntity(user: User, contextGroupId?: string | null): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.name = user.name;
    dto.email = user.email;
    dto.profilePicture = user.profilePicture;

    const effectiveGroupId =
      contextGroupId !== undefined ? contextGroupId : user.activeGroupId;
    dto.activeGroupId = effectiveGroupId ?? null;

    if (user.memberships && user.memberships.length > 0) {
      dto.groups = user.memberships
        .filter((m) => !!m.group && !!m.role)
        .map((m) => ({
          id: m.group.id,
          name: m.group.name,
          type: m.group.type,
          inviteCode: m.group.inviteCode,
          isActive: m.groupId === effectiveGroupId,
          role: {
            id: m.role.id,
            name: m.role.name,
            canAssignTasks: m.role.canAssignTasks,
            canManageGroup: m.role.canManageGroup,
          },
        }));

      const activeMembership =
        user.memberships.find((m) => m.groupId === effectiveGroupId) ??
        user.memberships[0];

      if (activeMembership) {
        dto.activeGroupId = activeMembership.groupId;
        if (activeMembership.group) {
          dto.activeGroupName = activeMembership.group.name;
          dto.activeGroupType = activeMembership.group.type;
          dto.activeGroupInviteCode = activeMembership.group.inviteCode;
        }
        if (activeMembership.role) {
          dto.activeRole = {
            id: activeMembership.role.id,
            name: activeMembership.role.name,
            canAssignTasks: activeMembership.role.canAssignTasks,
            canManageGroup: activeMembership.role.canManageGroup,
          };
        }
      }
    } else if (user.activeGroup) {
      dto.activeGroupName = user.activeGroup.name;
      dto.activeGroupType = user.activeGroup.type;
      dto.activeGroupInviteCode = user.activeGroup.inviteCode;
    }

    return dto;
  }
}
