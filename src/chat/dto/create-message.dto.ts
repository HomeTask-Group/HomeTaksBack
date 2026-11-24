import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  content!: string;

  @IsOptional()
  @IsUUID("4", { message: "groupId debe ser un UUID válido" })
  groupId?: string;
}
