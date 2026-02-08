import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
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
import { GetCompanyUsersQueryDto } from './dto/get-company-users-query.dto';
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
  @Roles('GROUP_ADMIN', 'COMPANY_ADMIN', 'DIVISION_ADMIN', 'DEPARTMENT_ADMIN')
  @ApiOperation({
    summary: 'Invite a user to a company, division, or department',
    description:
      'Invites a user to a company, division, or department. Exactly one of company_id, division_id, or department_id must be provided. Creates a user account, generates a random password, assigns a role, and sends an invitation email with credentials. GROUP_ADMIN can invite to any resource. COMPANY_ADMIN can invite to their company or its divisions/departments. DIVISION_ADMIN can invite to their division or its departments. DEPARTMENT_ADMIN can invite to their department.',
  })
  @ApiResponse({
    status: 201,
    description: 'User invitation sent successfully',
    type: InviteUserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - validation error, exactly one of company_id/division_id/department_id must be provided, or resource is inactive',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have required role, or cannot invite to this resource',
  })
  @ApiResponse({
    status: 404,
    description: 'Company, division, department, or role not found',
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
  @Roles('GROUP_ADMIN', 'COMPANY_ADMIN', 'DIVISION_ADMIN', 'DEPARTMENT_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'companyId',
    description: 'Company ID (UUID) to retrieve users for',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Get all users of a company with invitation status and roles',
    description:
      'Retrieves all users associated with a company, including their invitation status and assigned roles. Supports optional filtering by division_id and department_id. GROUP_ADMIN can view any company users. COMPANY_ADMIN can view users of their own company. DIVISION_ADMIN can view users of their division. DEPARTMENT_ADMIN can view users of their department. If division_id is provided, returns only users assigned to that division. If department_id is provided, division_id must also be provided and returns only users assigned to that department.',
  })
  @ApiQuery({
    name: 'division_id',
    required: false,
    description:
      'Optional filter by division ID (UUID). Returns only users assigned to this division. Must belong to the specified company.',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'department_id',
    required: false,
    description:
      'Optional filter by department ID (UUID). Returns only users assigned to this department. Requires division_id to be provided and must belong to the specified division.',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Company users retrieved successfully',
    type: CompanyUsersResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - company/division/department is inactive, department_id provided without division_id, or division_id does not match department',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - user does not have required role or cannot access this company/division/department',
  })
  @ApiResponse({
    status: 404,
    description: 'Company, division, or department not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getCompanyUsers(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Query() query: GetCompanyUsersQueryDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<CompanyUsersResponseDto> {
    return this.userInvitesService.getCompanyUsers(
      companyId,
      req.user.id,
      req.userRoles,
      query.division_id,
      query.department_id,
    );
  }
}
