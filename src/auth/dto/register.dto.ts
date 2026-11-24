import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";
import { GroupType } from "../../groups/entities/group.entity";

export class RegisterDto {
  @IsNotEmpty({ message: "El nombre es obligatorio" })
  @IsString()
  name!: string;

  @IsEmail({}, { message: "Correo no válido" })
  email!: string;

  @MinLength(6, { message: "La contraseña debe tener al menos 6 caracteres" })
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  groupName?: string;

  @IsOptional()
  @IsEnum(GroupType, {
    message: "Tipo de grupo no válido (family, roommates, couple, custom)",
  })
  groupType?: GroupType;

  @IsOptional()
  @IsString()
  inviteCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  roleName?: string;

  @IsOptional()
  @IsUUID("4", { message: "roleId debe ser un UUID válido" })
  roleId?: string;
}
