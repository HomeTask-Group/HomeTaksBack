import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";
import { GroupType } from "../entities/group.entity";

export class CreateGroupDto {
  @IsNotEmpty({ message: "El nombre del grupo es obligatorio" })
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsEnum(GroupType, {
    message: "Tipo de grupo no válido (family, roommates, couple, custom)",
  })
  type?: GroupType;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  roleName?: string;
}
