import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UsersService } from "../../users/users.service";
import { GroupsService } from "../../groups/groups.service";
import { RequestUser } from "../decorators/current-user.decorator";

export interface JwtPayload {
  sub: string;
  email: string;
  activeGroupId?: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
    private readonly groupsService: GroupsService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>("JWT_SECRET", "dev_secret_change_me"),
    });
  }

  async validate(payload: JwtPayload): Promise<RequestUser> {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException("Usuario no encontrado");
    }

    let activeGroupId = user.activeGroupId ?? payload.activeGroupId ?? null;
    let membership = activeGroupId
      ? await this.groupsService.getMembership(user.id, activeGroupId)
      : null;

    if (!membership && user.memberships && user.memberships.length > 0) {
      const fallback = user.memberships[0];
      activeGroupId = fallback.groupId;
      membership = fallback;
      await this.usersService.setActiveGroup(user.id, activeGroupId);
    }

    if (!membership) {
      activeGroupId = null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      activeGroupId,
      role: membership?.role
        ? {
            id: membership.role.id,
            name: membership.role.name,
            canAssignTasks: membership.role.canAssignTasks,
            canManageGroup: membership.role.canManageGroup,
          }
        : null,
    };
  }
}
