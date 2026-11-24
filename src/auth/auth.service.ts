import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { UsersService } from "../users/users.service";
import { GroupsService } from "../groups/groups.service";
import { UserResponseDto } from "../users/dto/user-response.dto";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { GroupType } from "../groups/entities/group.entity";

const SALT_ROUNDS = 10;

export interface AuthResult {
  accessToken: string;
  user: UserResponseDto;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly groupsService: GroupsService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const createdUser = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
    });

    let groupSummary: {
      id: string;
      name: string;
      type: GroupType;
      inviteCode: string;
    } | null = null;

    if (dto.inviteCode) {
      const joined = await this.groupsService.joinByInviteCode(createdUser.id, {
        inviteCode: dto.inviteCode,
        roleId: dto.roleId,
        roleName: dto.roleName,
      });
      groupSummary = joined.group;
    } else if (dto.groupName) {
      const createdGroup = await this.groupsService.createForUser(
        createdUser.id,
        {
          name: dto.groupName,
          type: dto.groupType ?? GroupType.CUSTOM,
          roleName: dto.roleName,
        },
      );
      groupSummary = {
        id: createdGroup.group.id,
        name: createdGroup.group.name,
        type: createdGroup.group.type,
        inviteCode: createdGroup.group.inviteCode,
      };
    }

    const fullUser = (await this.usersService.findById(createdUser.id)) ?? createdUser;
    const accessToken = this.jwtService.sign({
      sub: fullUser.id,
      email: fullUser.email,
      activeGroupId: fullUser.activeGroupId,
    });

    return {
      accessToken,
      user: UserResponseDto.fromEntity(fullUser),
      group: groupSummary,
    };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    let user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException("No existe una cuenta con ese correo");
    }
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Contraseña incorrecta");
    }

    if (!user.activeGroupId && user.memberships && user.memberships.length > 0) {
      await this.usersService.setActiveGroup(
        user.id,
        user.memberships[0].groupId,
      );
      user = (await this.usersService.findById(user.id)) ?? user;
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      activeGroupId: user.activeGroupId,
    });
    return { accessToken, user: UserResponseDto.fromEntity(user) };
  }

  async switchGroup(userId: string, groupId: string) {
    const switched = await this.groupsService.switchActiveGroup(
      userId,
      groupId,
    );
    const updatedUser = await this.usersService.findById(userId);
    if (!updatedUser) {
      throw new UnauthorizedException("Usuario no encontrado");
    }

    const accessToken = this.jwtService.sign({
      sub: updatedUser.id,
      email: updatedUser.email,
      activeGroupId: groupId,
    });

    return {
      accessToken,
      activeGroupId: groupId,
      group: switched.group,
      myRole: switched.myRole,
      user: UserResponseDto.fromEntity(updatedUser),
    };
  }
}
