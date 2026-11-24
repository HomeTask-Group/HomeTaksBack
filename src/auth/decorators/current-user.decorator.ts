import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export interface RequestUserRole {
  id: string;
  name: string;
  canAssignTasks: boolean;
  canManageGroup: boolean;
}

export interface RequestUser {
  id: string;
  name: string;
  email: string;
  activeGroupId: string | null;
  role: RequestUserRole | null;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
