import { IsUUID } from "class-validator";

export class AssignMemberRoleDto {
  @IsUUID("4", { message: "roleId debe ser un UUID válido" })
  roleId!: string;
}
