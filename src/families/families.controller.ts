import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  CurrentUser
} from "../auth/decorators/current-user.decorator";
import type { RequestUser } from "../auth/decorators/current-user.decorator";
import { FamiliesService } from "./families.service";
import { Family } from "./entities/family.entity";

@Controller("families")
@UseGuards(JwtAuthGuard)
export class FamiliesController {
  constructor(private readonly familiesService: FamiliesService) {}

  @Get("me")
  async getMyFamily(@CurrentUser() requester: RequestUser): Promise<Family> {
    return this.familiesService.findById(requester.familyId);
  }
}