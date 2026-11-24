import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { SwitchGroupDto } from "./dto/switch-group.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { CurrentUser } from "./decorators/current-user.decorator";
import type { RequestUser } from "./decorators/current-user.decorator";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post("switch-group")
  @UseGuards(JwtAuthGuard)
  switchGroup(
    @CurrentUser() requester: RequestUser,
    @Body() dto: SwitchGroupDto,
  ) {
    return this.authService.switchGroup(requester.id, dto.groupId);
  }
}
