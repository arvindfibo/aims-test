import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { Request as ExpressRequest } from 'express';
import { UserInvitesService } from './user-invites.service';
import { InviteUserDto, InviteUserResponseDto } from './dto/invite-user.dto';
import {
  AcceptInvitationDto,
  AcceptInvitationResponseDto,
  RejectInvitationDto,
  RejectInvitationResponseDto,
} from './dto/accept-reject-invitation.dto';
import { CompanyUsersResponseDto } from './dto/company-users-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

interface AuthenticatedUser {
  id: string;
  email: string;
  first_name: string;
  last_name?: string | null;
  is_verified: boolean;
  is_active: boolean;
}

interface AuthenticatedRequest extends ExpressRequest {
  user: AuthenticatedUser;
  userRoles?: string[];
}

@ApiTags('User Invites')
@Controller('user-invites')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class UserInvitesController {
  constructor(private readonly userInvitesService: UserInvitesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('GROUP_ADMIN', 'COMPANY_ADMIN')
  @ApiOperation({
    summary: 'Invite a user to a company',
    description:
      'Only GROUP_ADMIN and COMPANY_ADMIN can send invitations. Creates a user account, generates a random password, assigns a role, and sends an invitation email with credentials.',
  })
  @ApiResponse({
    status: 201,
    description: 'User invitation sent successfully',
    type: InviteUserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - user does not have GROUP_ADMIN or COMPANY_ADMIN role, or cannot invite to this company',
  })
  @ApiResponse({
    status: 404,
    description: 'Company or role not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - user already exists or pending invitation exists',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async inviteUser(
    @Body() inviteUserDto: InviteUserDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<InviteUserResponseDto> {
    return this.userInvitesService.inviteUser(inviteUserDto, req.user.id, req.userRoles);
  }

  @Post('accept')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Accept an invitation',
    description:
      'Accepts a user invitation using the invitation token. Marks the invitation as accepted, verifies the user account, and returns a JWT token for immediate login. This is a public endpoint.',
  })
  @ApiResponse({
    status: 200,
    description: 'Invitation accepted successfully',
    type: AcceptInvitationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error, invitation already accepted/rejected, or expired',
  })
  @ApiResponse({
    status: 404,
    description: 'Invitation token not found or invalid',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user account is inactive',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async acceptInvitation(
    @Body() acceptInvitationDto: AcceptInvitationDto,
  ): Promise<AcceptInvitationResponseDto> {
    return this.userInvitesService.acceptInvitation(acceptInvitationDto);
  }

  @Post('reject')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reject an invitation',
    description:
      'Rejects a user invitation using the invitation token. Marks the invitation as rejected. This is a public endpoint.',
  })
  @ApiResponse({
    status: 200,
    description: 'Invitation rejected successfully',
    type: RejectInvitationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error or invitation already accepted',
  })
  @ApiResponse({
    status: 404,
    description: 'Invitation token not found or invalid',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async rejectInvitation(
    @Body() rejectInvitationDto: RejectInvitationDto,
  ): Promise<RejectInvitationResponseDto> {
    return this.userInvitesService.rejectInvitation(rejectInvitationDto);
  }

  @Get('company/:companyId/users')
  @Roles('GROUP_ADMIN', 'COMPANY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all users of a company with invitation status and roles',
    description:
      'Retrieves all users associated with a company, including their invitation status and assigned roles. Only GROUP_ADMIN and COMPANY_ADMIN can access this endpoint. COMPANY_ADMIN can only view users of their own company.',
  })
  @ApiResponse({
    status: 200,
    description: 'Company users retrieved successfully',
    type: CompanyUsersResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - company is inactive',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have required role or cannot access this company',
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getCompanyUsers(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<CompanyUsersResponseDto> {
    return this.userInvitesService.getCompanyUsers(companyId, req.user.id, req.userRoles);
  }
}
