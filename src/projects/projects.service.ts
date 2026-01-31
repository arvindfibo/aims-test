import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, IsNull } from 'typeorm';
import { Project } from '../entities/project.entity';
import { Tender } from '../entities/tender.entity';
import { Company } from '../entities/company.entity';
import { CompanyGroup } from '../entities/company-group.entity';
import {
  CreateProjectDto,
  ProjectResponseDto,
  ProjectStatus,
  ProjectCurrency,
} from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { DeleteProjectResponseDto } from './dto/delete-project.dto';
import { GetProjectsQueryDto } from './dto/get-projects-query.dto';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Tender)
    private readonly tenderRepository: Repository<Tender>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(CompanyGroup)
    private readonly companyGroupRepository: Repository<CompanyGroup>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createProjectDto: CreateProjectDto,
    userId: string,
    userRoles: string[] = [],
  ): Promise<ProjectResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tender = await this.ensureTenderWriteAccess(
        createProjectDto.tender_id,
        userId,
        userRoles,
      );

      const project = this.projectRepository.create({
        tender_id: tender.id,
        project_code: createProjectDto.project_code,
        project_name: createProjectDto.project_name,
        work_order_number_date: createProjectDto.work_order_number_date || null,
        name_of_work: createProjectDto.name_of_work || null,
        stipulated_comencement_date: this.toDate(createProjectDto.stipulated_comencement_date),
        actual_comencement_date: this.toDate(createProjectDto.actual_comencement_date),
        stipulated_completion_date: this.toDate(createProjectDto.stipulated_completion_date),
        actual_completion_date: this.toDate(createProjectDto.actual_completion_date),
        initial_contract_value: this.toNumericString(createProjectDto.initial_contract_value),
        completion_contract_value: this.toNumericString(createProjectDto.completion_contract_value),
        project_manager: createProjectDto.project_manager || null,
        status: createProjectDto.status,
        remarks: createProjectDto.remarks || null,
        client_representative_name: createProjectDto.client_representative_name || null,
        client_representative_phone: createProjectDto.client_representative_phone || null,
        balance_due_against_invoice: this.toNumericString(
          createProjectDto.balance_due_against_invoice,
        ),
        holdover: this.toNumericString(createProjectDto.holdover),
        security: this.toNumericString(createProjectDto.security),
        currency: createProjectDto.currency,
      });

      const savedProject = await queryRunner.manager.save(Project, project);

      if (!savedProject) {
        throw new InternalServerErrorException('Failed to create project');
      }

      await queryRunner.commitTransaction();

      this.logger.log(
        `Project "${savedProject.project_name}" created successfully by user ${userId}`,
      );

      return this.mapToResponseDto(savedProject);
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      this.logger.error(
        `Failed to create project: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException('Failed to create project');
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    filters: GetProjectsQueryDto,
    userId: string,
    userRoles: string[] = [],
  ): Promise<ProjectResponseDto[]> {
    try {
      const {
        tender_id: tenderId,
        sort_by,
        sort_order,
        id,
        status,
        currency,
        project_code,
        project_name,
        work_order_number_date,
        name_of_work,
        project_manager,
        remarks,
        client_representative_name,
        client_representative_phone,
        stipulated_comencement_date_from,
        stipulated_comencement_date_to,
        actual_comencement_date_from,
        actual_comencement_date_to,
        stipulated_completion_date_from,
        stipulated_completion_date_to,
        actual_completion_date_from,
        actual_completion_date_to,
        created_at_from,
        created_at_to,
        updated_at_from,
        updated_at_to,
        initial_contract_value_min,
        initial_contract_value_max,
        completion_contract_value_min,
        completion_contract_value_max,
        balance_due_against_invoice_min,
        balance_due_against_invoice_max,
        holdover_min,
        holdover_max,
        security_min,
        security_max,
      } = filters;

      const qb = this.projectRepository.createQueryBuilder('project');
      qb.where('project.deleted_at IS NULL');

      if (tenderId) {
        await this.ensureTenderReadAccess(tenderId, userId, userRoles);
        qb.andWhere('project.tender_id = :tenderId', { tenderId });
      } else {
        const tenderIds = await this.getAccessibleTenderIds(userId, userRoles);

        if (tenderIds.length === 0) {
          return [];
        }

        qb.andWhere('project.tender_id IN (:...tenderIds)', { tenderIds });
      }

      if (id) {
        qb.andWhere('project.id = :id', { id });
      }

      if (status) {
        qb.andWhere('project.status = :status', { status });
      }

      if (currency) {
        qb.andWhere('project.currency = :currency', { currency });
      }

      if (project_code) {
        qb.andWhere('project.project_code = :project_code', { project_code });
      }

      if (project_name) {
        qb.andWhere('project.project_name = :project_name', { project_name });
      }

      if (work_order_number_date) {
        qb.andWhere('project.work_order_number_date = :work_order_number_date', {
          work_order_number_date,
        });
      }

      if (name_of_work) {
        qb.andWhere('project.name_of_work = :name_of_work', { name_of_work });
      }

      if (project_manager) {
        qb.andWhere('project.project_manager = :project_manager', { project_manager });
      }

      if (remarks) {
        qb.andWhere('project.remarks = :remarks', { remarks });
      }

      if (client_representative_name) {
        qb.andWhere('project.client_representative_name = :client_representative_name', {
          client_representative_name,
        });
      }

      if (client_representative_phone) {
        qb.andWhere('project.client_representative_phone = :client_representative_phone', {
          client_representative_phone,
        });
      }

      if (stipulated_comencement_date_from) {
        qb.andWhere('project.stipulated_comencement_date >= :stipulated_comencement_date_from', {
          stipulated_comencement_date_from,
        });
      }

      if (stipulated_comencement_date_to) {
        qb.andWhere('project.stipulated_comencement_date <= :stipulated_comencement_date_to', {
          stipulated_comencement_date_to,
        });
      }

      if (actual_comencement_date_from) {
        qb.andWhere('project.actual_comencement_date >= :actual_comencement_date_from', {
          actual_comencement_date_from,
        });
      }

      if (actual_comencement_date_to) {
        qb.andWhere('project.actual_comencement_date <= :actual_comencement_date_to', {
          actual_comencement_date_to,
        });
      }

      if (stipulated_completion_date_from) {
        qb.andWhere('project.stipulated_completion_date >= :stipulated_completion_date_from', {
          stipulated_completion_date_from,
        });
      }

      if (stipulated_completion_date_to) {
        qb.andWhere('project.stipulated_completion_date <= :stipulated_completion_date_to', {
          stipulated_completion_date_to,
        });
      }

      if (actual_completion_date_from) {
        qb.andWhere('project.actual_completion_date >= :actual_completion_date_from', {
          actual_completion_date_from,
        });
      }

      if (actual_completion_date_to) {
        qb.andWhere('project.actual_completion_date <= :actual_completion_date_to', {
          actual_completion_date_to,
        });
      }

      if (created_at_from) {
        qb.andWhere('project.created_at >= :created_at_from', { created_at_from });
      }

      if (created_at_to) {
        qb.andWhere('project.created_at <= :created_at_to', { created_at_to });
      }

      if (updated_at_from) {
        qb.andWhere('project.updated_at >= :updated_at_from', { updated_at_from });
      }

      if (updated_at_to) {
        qb.andWhere('project.updated_at <= :updated_at_to', { updated_at_to });
      }

      if (initial_contract_value_min !== undefined) {
        qb.andWhere('project.initial_contract_value >= :initial_contract_value_min', {
          initial_contract_value_min,
        });
      }

      if (initial_contract_value_max !== undefined) {
        qb.andWhere('project.initial_contract_value <= :initial_contract_value_max', {
          initial_contract_value_max,
        });
      }

      if (completion_contract_value_min !== undefined) {
        qb.andWhere('project.completion_contract_value >= :completion_contract_value_min', {
          completion_contract_value_min,
        });
      }

      if (completion_contract_value_max !== undefined) {
        qb.andWhere('project.completion_contract_value <= :completion_contract_value_max', {
          completion_contract_value_max,
        });
      }

      if (balance_due_against_invoice_min !== undefined) {
        qb.andWhere('project.balance_due_against_invoice >= :balance_due_against_invoice_min', {
          balance_due_against_invoice_min,
        });
      }

      if (balance_due_against_invoice_max !== undefined) {
        qb.andWhere('project.balance_due_against_invoice <= :balance_due_against_invoice_max', {
          balance_due_against_invoice_max,
        });
      }

      if (holdover_min !== undefined) {
        qb.andWhere('project.holdover >= :holdover_min', { holdover_min });
      }

      if (holdover_max !== undefined) {
        qb.andWhere('project.holdover <= :holdover_max', { holdover_max });
      }

      if (security_min !== undefined) {
        qb.andWhere('project.security >= :security_min', { security_min });
      }

      if (security_max !== undefined) {
        qb.andWhere('project.security <= :security_max', { security_max });
      }

      const sortFieldMap: Record<string, string> = {
        project_name: 'project.project_name',
        project_code: 'project.project_code',
        status: 'project.status',
        currency: 'project.currency',
        stipulated_comencement_date: 'project.stipulated_comencement_date',
        actual_comencement_date: 'project.actual_comencement_date',
        stipulated_completion_date: 'project.stipulated_completion_date',
        actual_completion_date: 'project.actual_completion_date',
        initial_contract_value: 'project.initial_contract_value',
        completion_contract_value: 'project.completion_contract_value',
        balance_due_against_invoice: 'project.balance_due_against_invoice',
        holdover: 'project.holdover',
        security: 'project.security',
        created_at: 'project.created_at',
        updated_at: 'project.updated_at',
      };

      const sortBy =
        sort_by && sortFieldMap[sort_by] ? sortFieldMap[sort_by] : 'project.project_name';
      const sortOrder = sort_order === 'DESC' ? 'DESC' : 'ASC';
      qb.orderBy(sortBy, sortOrder);

      const offset = filters.offset ?? 0;
      const limit = filters.limit ?? 10;
      const safeLimit = Math.min(Math.max(limit, 1), 100);
      qb.skip(offset).take(safeLimit);

      const projects = await qb.getMany();
      return projects.map((project) => this.mapToResponseDto(project));
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }

      this.logger.error(
        `Failed to get projects: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException('Failed to retrieve projects');
    }
  }

  async findOne(
    projectId: string,
    userId: string,
    userRoles: string[] = [],
  ): Promise<ProjectResponseDto> {
    try {
      const project = await this.projectRepository.findOne({
        where: { id: projectId, deleted_at: IsNull() },
      });

      if (!project) {
        throw new NotFoundException(`Project with ID ${projectId} not found`);
      }

      await this.ensureTenderReadAccess(project.tender_id, userId, userRoles);

      return this.mapToResponseDto(project);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }

      this.logger.error(
        `Failed to get project ${projectId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException('Failed to retrieve project');
    }
  }

  async update(
    projectId: string,
    updateProjectDto: UpdateProjectDto,
    userId: string,
    userRoles: string[] = [],
  ): Promise<ProjectResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const project = await queryRunner.manager.findOne(Project, {
        where: { id: projectId, deleted_at: IsNull() },
      });

      if (!project) {
        throw new NotFoundException(`Project with ID ${projectId} not found`);
      }

      await this.ensureTenderWriteAccess(project.tender_id, userId, userRoles);

      const updatableFields: (keyof UpdateProjectDto)[] = [
        'project_code',
        'project_name',
        'work_order_number_date',
        'name_of_work',
        'stipulated_comencement_date',
        'actual_comencement_date',
        'stipulated_completion_date',
        'actual_completion_date',
        'initial_contract_value',
        'completion_contract_value',
        'project_manager',
        'status',
        'remarks',
        'client_representative_name',
        'client_representative_phone',
        'balance_due_against_invoice',
        'holdover',
        'security',
        'currency',
      ];

      const hasUpdates = updatableFields.some(
        (field) => typeof updateProjectDto[field] !== 'undefined',
      );

      if (!hasUpdates) {
        throw new BadRequestException('No valid fields provided for update');
      }

      if (updateProjectDto.project_code !== undefined) {
        project.project_code = updateProjectDto.project_code;
      }

      if (updateProjectDto.project_name !== undefined) {
        project.project_name = updateProjectDto.project_name;
      }

      if (updateProjectDto.work_order_number_date !== undefined) {
        project.work_order_number_date = updateProjectDto.work_order_number_date || null;
      }

      if (updateProjectDto.name_of_work !== undefined) {
        project.name_of_work = updateProjectDto.name_of_work || null;
      }

      if (updateProjectDto.stipulated_comencement_date !== undefined) {
        project.stipulated_comencement_date = this.toDate(
          updateProjectDto.stipulated_comencement_date,
        );
      }

      if (updateProjectDto.actual_comencement_date !== undefined) {
        project.actual_comencement_date = this.toDate(updateProjectDto.actual_comencement_date);
      }

      if (updateProjectDto.stipulated_completion_date !== undefined) {
        project.stipulated_completion_date = this.toDate(
          updateProjectDto.stipulated_completion_date,
        );
      }

      if (updateProjectDto.actual_completion_date !== undefined) {
        project.actual_completion_date = this.toDate(updateProjectDto.actual_completion_date);
      }

      if (updateProjectDto.initial_contract_value !== undefined) {
        project.initial_contract_value = this.toNumericString(
          updateProjectDto.initial_contract_value,
        );
      }

      if (updateProjectDto.completion_contract_value !== undefined) {
        project.completion_contract_value = this.toNumericString(
          updateProjectDto.completion_contract_value,
        );
      }

      if (updateProjectDto.project_manager !== undefined) {
        project.project_manager = updateProjectDto.project_manager || null;
      }

      if (updateProjectDto.status !== undefined) {
        project.status = updateProjectDto.status;
      }

      if (updateProjectDto.remarks !== undefined) {
        project.remarks = updateProjectDto.remarks || null;
      }

      if (updateProjectDto.client_representative_name !== undefined) {
        project.client_representative_name = updateProjectDto.client_representative_name || null;
      }

      if (updateProjectDto.client_representative_phone !== undefined) {
        project.client_representative_phone = updateProjectDto.client_representative_phone || null;
      }

      if (updateProjectDto.balance_due_against_invoice !== undefined) {
        project.balance_due_against_invoice = this.toNumericString(
          updateProjectDto.balance_due_against_invoice,
        );
      }

      if (updateProjectDto.holdover !== undefined) {
        project.holdover = this.toNumericString(updateProjectDto.holdover);
      }

      if (updateProjectDto.security !== undefined) {
        project.security = this.toNumericString(updateProjectDto.security);
      }

      if (updateProjectDto.currency !== undefined) {
        project.currency = updateProjectDto.currency;
      }

      const savedProject = await queryRunner.manager.save(Project, project);

      if (!savedProject) {
        throw new InternalServerErrorException('Failed to update project');
      }

      await queryRunner.commitTransaction();

      this.logger.log(
        `Project "${savedProject.project_name}" updated successfully by user ${userId}`,
      );

      return this.mapToResponseDto(savedProject);
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      this.logger.error(
        `Failed to update project: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException('Failed to update project');
    } finally {
      await queryRunner.release();
    }
  }

  async remove(
    projectId: string,
    userId: string,
    userRoles: string[] = [],
  ): Promise<DeleteProjectResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const project = await queryRunner.manager.findOne(Project, {
        where: { id: projectId, deleted_at: IsNull() },
      });

      if (!project) {
        throw new NotFoundException(`Project with ID ${projectId} not found`);
      }

      await this.ensureTenderWriteAccess(project.tender_id, userId, userRoles);

      project.deleted_at = new Date();
      const savedProject = await queryRunner.manager.save(Project, project);
      await queryRunner.commitTransaction();

      this.logger.log(`Project "${project.project_name}" deleted successfully by user ${userId}`);

      return {
        id: projectId,
        message: 'Project deleted successfully',
        deleted_at: savedProject.deleted_at ?? new Date(),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }

      this.logger.error(
        `Failed to delete project: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException('Failed to delete project');
    } finally {
      await queryRunner.release();
    }
  }

  private normalizeRoles(userRoles: string[] = []): string[] {
    return Array.isArray(userRoles) ? userRoles : [];
  }

  private async getAccessibleTenderIds(userId: string, userRoles: string[]): Promise<string[]> {
    const normalizedRoles = this.normalizeRoles(userRoles);
    const isGroupAdmin = normalizedRoles.includes('GROUP_ADMIN');

    if (isGroupAdmin) {
      const companyGroup = await this.companyGroupRepository.findOne({
        where: { super_admin_id: userId },
      });

      if (!companyGroup) {
        throw new NotFoundException(
          'Company group not found. User is not a super admin of any company group.',
        );
      }

      if (!companyGroup.is_active) {
        throw new ForbiddenException('Company group is not active');
      }

      const companies = await this.companyRepository.find({
        where: { company_group_id: companyGroup.id, deleted_at: IsNull() },
        select: ['id'],
      });

      if (companies.length === 0) {
        return [];
      }

      const companyIds = companies.map((company) => company.id);

      const tenders = await this.tenderRepository.find({
        where: { company_id: In(companyIds), deleted_at: IsNull() },
        select: ['id'],
      });

      return tenders.map((tender) => tender.id);
    }

    const companies = await this.companyRepository.find({
      where: { company_admin_user_id: userId, deleted_at: IsNull() },
      select: ['id'],
    });

    if (companies.length === 0) {
      throw new NotFoundException('Company not found for the authenticated company admin');
    }

    const companyIds = companies.map((company) => company.id);

    const tenders = await this.tenderRepository.find({
      where: { company_id: In(companyIds), deleted_at: IsNull() },
      select: ['id'],
    });

    return tenders.map((tender) => tender.id);
  }

  private async ensureTenderReadAccess(
    tenderId: string,
    userId: string,
    userRoles: string[],
  ): Promise<Tender> {
    const { tender, company } = await this.getTenderAndCompany(tenderId);
    const normalizedRoles = this.normalizeRoles(userRoles);
    const isGroupAdmin = normalizedRoles.includes('GROUP_ADMIN');

    if (isGroupAdmin) {
      const companyGroup = await this.companyGroupRepository.findOne({
        where: { super_admin_id: userId },
      });

      if (!companyGroup) {
        throw new NotFoundException(
          'Company group not found. User is not a super admin of any company group.',
        );
      }

      if (!companyGroup.is_active) {
        throw new ForbiddenException('Company group is not active');
      }

      if (company.company_group_id !== companyGroup.id) {
        throw new NotFoundException('Tender not found or access denied');
      }

      return tender;
    }

    if (company.company_admin_user_id !== userId) {
      throw new NotFoundException('Tender not found or access denied');
    }

    return tender;
  }

  private async ensureTenderWriteAccess(
    tenderId: string,
    userId: string,
    userRoles: string[],
  ): Promise<Tender> {
    const { tender, company } = await this.getTenderAndCompany(tenderId);
    const normalizedRoles = this.normalizeRoles(userRoles);
    const isGroupAdmin = normalizedRoles.includes('GROUP_ADMIN');

    if (isGroupAdmin) {
      const companyGroup = await this.companyGroupRepository.findOne({
        where: { super_admin_id: userId },
      });

      if (!companyGroup) {
        throw new NotFoundException(
          'Company group not found. User is not a super admin of any company group.',
        );
      }

      if (!companyGroup.is_active) {
        throw new ForbiddenException('Company group is not active');
      }

      if (company.company_group_id !== companyGroup.id) {
        throw new ForbiddenException('Access denied to modify this project');
      }

      return tender;
    }

    if (company.company_admin_user_id !== userId) {
      throw new ForbiddenException('Access denied to modify this project');
    }

    return tender;
  }

  private async getTenderAndCompany(
    tenderId: string,
  ): Promise<{ tender: Tender; company: Company }> {
    const tender = await this.tenderRepository.findOne({
      where: { id: tenderId, deleted_at: IsNull() },
    });

    if (!tender) {
      throw new NotFoundException(`Tender with ID ${tenderId} not found`);
    }

    const company = await this.companyRepository.findOne({
      where: { id: tender.company_id, deleted_at: IsNull() },
    });

    if (!company) {
      throw new NotFoundException('Company not found for the tender');
    }

    return { tender, company };
  }

  private toDate(value?: string): Date | null {
    if (!value) {
      return null;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private toNumericString(value?: number): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    return String(value);
  }

  private toNumber(value: string | null): number | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  private mapToResponseDto(project: Project): ProjectResponseDto {
    return {
      id: project.id,
      tender_id: project.tender_id,
      project_code: project.project_code,
      project_name: project.project_name,
      work_order_number_date: project.work_order_number_date || undefined,
      name_of_work: project.name_of_work || undefined,
      stipulated_comencement_date: project.stipulated_comencement_date || undefined,
      actual_comencement_date: project.actual_comencement_date || undefined,
      stipulated_completion_date: project.stipulated_completion_date || undefined,
      actual_completion_date: project.actual_completion_date || undefined,
      initial_contract_value: this.toNumber(project.initial_contract_value),
      completion_contract_value: this.toNumber(project.completion_contract_value),
      project_manager: project.project_manager || undefined,
      status: project.status as ProjectStatus,
      remarks: project.remarks || undefined,
      client_representative_name: project.client_representative_name || undefined,
      client_representative_phone: project.client_representative_phone || undefined,
      balance_due_against_invoice: this.toNumber(project.balance_due_against_invoice),
      holdover: this.toNumber(project.holdover),
      security: this.toNumber(project.security),
      currency: project.currency as ProjectCurrency,
      created_at: project.created_at,
      updated_at: project.updated_at,
    };
  }
}
