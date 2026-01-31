import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsUUID, IsString, IsOptional, MaxLength } from 'class-validator';

export class InviteUserDto {
  @ApiProperty({
    description: 'Email address of the user to invite',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;

  @ApiProperty({
    description: 'Company ID to invite the user to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'Company ID must be a valid UUID' })
  company_id: string;

  @ApiProperty({
    description: 'Role ID to assign to the user',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'Role ID must be a valid UUID' })
  role_id: string;

  @ApiPropertyOptional({
    description: 'First name of the user',
    example: 'John',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  @MaxLength(100, { message: 'First name must not exceed 100 characters' })
  first_name?: string;

  @ApiPropertyOptional({
    description: 'Last name of the user',
    example: 'Doe',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  @MaxLength(100, { message: 'Last name must not exceed 100 characters' })
  last_name?: string;

  @ApiPropertyOptional({
    description: 'Phone number of the user',
    example: '+1234567890',
    maxLength: 20,
  })
  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  @MaxLength(20, { message: 'Phone must not exceed 20 characters' })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Division ID (if applicable)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Division ID must be a valid UUID' })
  division_id?: string;

  @ApiPropertyOptional({
    description: 'Department ID (if applicable)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Department ID must be a valid UUID' })
  department_id?: string;
}

export class InviteUserResponseDto {
  @ApiProperty({
    description: 'Invite ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Email address of the invited user',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Company ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  company_id: string;

  @ApiProperty({
    description: 'Invite status',
    example: 'pending',
    enum: ['pending', 'accepted', 'expired'],
  })
  invite_status: string;

  @ApiProperty({
    description: 'Invite expiration timestamp',
    example: '2026-02-05T10:00:00.000Z',
  })
  expires_at: Date | null;

  @ApiProperty({
    description: 'Invite creation timestamp',
    example: '2026-01-29T10:00:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Success message',
    example: 'User invitation sent successfully',
  })
  message: string;
}
