import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

export interface Permission {
  resource: string;
  action: string;
}

export const Permissions = (...permissions: (string | Permission)[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
