import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateGroupRoleDto {
  @IsNotEmpty({ message: "El nombre del rol es obligatorio" })
  @IsString()
  @MaxLength(60)
  name!: string;

  @IsOptional()
  @IsBoolean()
  canAssignTasks?: boolean;

  @IsOptional()
  @IsBoolean()
  canManageGroup?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
