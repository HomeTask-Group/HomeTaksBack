import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entities/user.entity";
import { GroupMember } from "../groups/entities/group-member.entity";
import * as bcrypt from "bcrypt";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(GroupMember)
    private readonly membersRepository: Repository<GroupMember>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email: email.toLowerCase() },
      relations: {
        activeGroup: true,
        memberships: {
          group: true,
          role: true,
        },
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations: {
        activeGroup: true,
        memberships: {
          group: true,
          role: true,
        },
      },
    });
  }

  async findAllByGroup(groupId: string): Promise<User[]> {
    if (!groupId) {
      throw new BadRequestException("Debes tener un grupo activo o indicar groupId");
    }

    const memberships = await this.membersRepository.find({
      where: { groupId },
      relations: {
        user: {
          memberships: {
            group: true,
            role: true,
          },
        },
        role: true,
        group: true,
      },
    });

    return memberships
      .map((m) => m.user)
      .filter((u): u is User => !!u)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async setActiveGroup(userId: string, groupId: string | null): Promise<void> {
    await this.usersRepository.update({ id: userId }, { activeGroupId: groupId });
  }

  async create(data: {
    name: string;
    email: string;
    passwordHash: string;
    activeGroupId?: string | null;
  }): Promise<User> {
    const email = data.email.toLowerCase();
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new ConflictException("Ya existe una cuenta con ese correo");
    }

    const user = this.usersRepository.create({
      name: data.name.trim(),
      email,
      passwordHash: data.passwordHash,
      activeGroupId: data.activeGroupId ?? null,
    });
    return this.usersRepository.save(user);
  }

  async updateProfilePicture(id: string, base64Image: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException("Usuario no encontrado");
    }

    user.profilePicture = base64Image;
    return this.usersRepository.save(user);
  }

  async updateProfile(
    id: string,
    dto: {
      name?: string;
      email?: string;
      password?: string;
      currentPassword?: string;
    },
  ): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException("Usuario no encontrado");
    }

    if (dto.name) {
      user.name = dto.name.trim();
    }

    if (dto.email && dto.email.toLowerCase() !== user.email) {
      const newEmail = dto.email.toLowerCase();
      const existing = await this.findByEmail(newEmail);
      if (existing) {
        throw new ConflictException("Ya existe una cuenta con ese correo");
      }
      user.email = newEmail;
    }

    if (dto.password) {
      const validCurrent = await bcrypt.compare(
        dto.currentPassword ?? "",
        user.passwordHash,
      );
      if (!validCurrent) {
        throw new UnauthorizedException("La contraseña actual es incorrecta");
      }
      user.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    return this.usersRepository.save(user);
  }
}
