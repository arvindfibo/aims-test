import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsUUID,
  IsString,
  IsOptional,
  MaxLength,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'exactlyOneResource', async: false })
class ExactlyOneResourceConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments) {
    const obj = args.object as InviteUserDto;
    const resourceIds = [obj.company_id, obj.division_id, obj.department_id].filter(
      (id) => id !== undefined && id !== null,
    );

    return resourceIds.length === 1;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaultMessage(_args: ValidationArguments) {
    return 'Exactly one of company_id, division_id, or department_id must be provided';
  }
}

export class InviteUserDto {
  @ApiProperty({
    description: 'Email address of the user to invite',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;

  @ApiPropertyOptional({
    description:
      'Company ID (UUID) to invite the user to. Exactly one of company_id, division_id, or department_id must be provided.',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Company ID must be a valid UUID' })
  company_id?: string;

  @ApiPropertyOptional({
    description:
      'Division ID (UUID) to invite the user to. Exactly one of company_id, division_id, or department_id must be provided.',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Division ID must be a valid UUID' })
  division_id?: string;

  @ApiPropertyOptional({
    description:
      'Department ID (UUID) to invite the user to. Exactly one of company_id, division_id, or department_id must be provided.',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Department ID must be a valid UUID' })
  department_id?: string;

  @Validate(ExactlyOneResourceConstraint)
  _validateExactlyOneResource?: never;

  @ApiProperty({
    description: 'Role ID (UUID) to assign to the user',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
    format: 'uuid',
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
}

export class InviteUserResponseDto {
  @ApiProperty({
    description: 'Invite ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Email address of the invited user',
    example: 'user@example.com',
  })
  email: string;

  @ApiPropertyOptional({
    description: 'Company ID (UUID) - present if invitation is for company level',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
    format: 'uuid',
    nullable: true,
  })
  company_id?: string | null;

  @ApiPropertyOptional({
    description: 'Division ID (UUID) - present if invitation is for division level',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
    format: 'uuid',
    nullable: true,
  })
  division_id?: string | null;

  @ApiPropertyOptional({
    description: 'Department ID (UUID) - present if invitation is for department level',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
    format: 'uuid',
    nullable: true,
  })
  department_id?: string | null;

  @ApiProperty({
    description: 'Invitation status',
    example: 'pending',
    enum: ['pending', 'accepted', 'expired', 'rejected'],
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
