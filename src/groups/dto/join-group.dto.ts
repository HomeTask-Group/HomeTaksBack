import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class JoinGroupDto {
  @IsNotEmpty({ message: "El código de invitación es obligatorio" })
  @IsString()
  inviteCode!: string;

  @IsOptional()
  @IsUUID("4", { message: "roleId debe ser un UUID válido" })
  roleId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  roleName?: string;
}
