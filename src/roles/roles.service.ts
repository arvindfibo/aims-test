import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { RoleResponseDto } from './dto/role-response.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async findAll(): Promise<RoleResponseDto[]> {
    const roles = await this.roleRepository.find({
      order: {
        name: 'ASC',
      },
    });

    return roles.map((role) => this.mapToResponseDto(role));
  }

  async findOne(id: string): Promise<RoleResponseDto> {
    const role = await this.roleRepository.findOne({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return this.mapToResponseDto(role);
  }

  private mapToResponseDto(role: Role): RoleResponseDto {
    return {
      id: role.id,
      name: role.name,
      permissions: role.permissions,
      created_at: role.created_at,
      updated_at: role.updated_at,
    };
  }
}
