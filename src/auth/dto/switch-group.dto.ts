import { IsUUID } from "class-validator";

export class SwitchGroupDto {
  @IsUUID("4", { message: "groupId debe ser un UUID válido" })
  groupId!: string;
}
