import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Tender, Currency } from '../entities/tender.entity';
import { Company } from '../entities/company.entity';
import { CreateTenderDto, TenderResponseDto } from './dto/create-tender.dto';
import { UpdateTenderDto } from './dto/update-tender.dto';
import { DeleteTenderResponseDto } from './dto/delete-tender.dto';
import { GetTendersQueryDto } from './dto/get-tenders-query.dto';
import { PaginatedTendersResponseDto } from './dto/paginated-tenders-response.dto';

@Injectable()
export class TendersService {
  private readonly logger = new Logger(TendersService.name);

  constructor(
    @InjectRepository(Tender)
    private readonly tenderRepository: Repository<Tender>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createTenderDto: CreateTenderDto, userId: string): Promise<TenderResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verify company exists and is active
      const company = await queryRunner.manager.findOne(Company, {
        where: { id: createTenderDto.company_id },
      });

      if (!company) {
        throw new NotFoundException(`Company with ID ${createTenderDto.company_id} not found`);
      }

      if (!company.is_active) {
        throw new ForbiddenException('Company is not active');
      }

      // Check if tender code already exists
      const existingTender = await queryRunner.manager.findOne(Tender, {
        where: { tender_code: createTenderDto.tender_code },
      });

      if (existingTender) {
        throw new ConflictException(
          `Tender with code "${createTenderDto.tender_code}" already exists`,
        );
      }

      // Create tender entity
      const tender = queryRunner.manager.create(Tender, {
        company_id: createTenderDto.company_id,
        tender_code: createTenderDto.tender_code,
        authority: createTenderDto.authority,
        client_name: createTenderDto.client_name,
        nit_number: createTenderDto.nit_number || null,
        misc_charges: createTenderDto.misc_charges || null,
        name_of_work: createTenderDto.name_of_work,
        tender_cost: createTenderDto.tender_cost?.value || null,
        tender_cost_currency: createTenderDto.tender_cost?.currency || Currency.INR,
        processing_fee: createTenderDto.processing_fee?.value || null,
        processing_fee_currency: createTenderDto.processing_fee?.currency || Currency.INR,
        emd: createTenderDto.emd?.value || null,
        emd_currency: createTenderDto.emd?.currency || Currency.INR,
        bank_charges: createTenderDto.bank_charges?.value || null,
        bank_charges_currency: createTenderDto.bank_charges?.currency || Currency.INR,
        documentation_charges: createTenderDto.documentation_charges?.value || null,
        documentation_charges_currency:
          createTenderDto.documentation_charges?.currency || Currency.INR,
        total_tender_value: createTenderDto.total_tender_value?.value || null,
        total_tender_value_currency: createTenderDto.total_tender_value?.currency || Currency.INR,
        last_date_of_submission: createTenderDto.last_date_of_submission
          ? new Date(createTenderDto.last_date_of_submission)
          : null,
        mode_of_emd: createTenderDto.mode_of_emd || null,
        tender_status: createTenderDto.tender_status || null,
        emd_status: createTenderDto.emd_status || null,
        emd_returned: createTenderDto.emd_returned ?? false,
        created_by: userId,
      });

      const savedTender = await queryRunner.manager.save(Tender, tender);

      await queryRunner.commitTransaction();

      // Fetch the complete tender with relations
      const tenderWithRelations = await this.tenderRepository.findOne({
        where: { id: savedTender.id },
        relations: ['company'],
      });

      if (!tenderWithRelations) {
        throw new NotFoundException('Tender not found after creation');
      }

      return this.mapToResponseDto(tenderWithRelations);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error creating tender: ${errorMessage}`, errorStack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    filters: GetTendersQueryDto = {} as GetTendersQueryDto,
  ): Promise<PaginatedTendersResponseDto> {
    try {
      const {
        id,
        company_id,
        tender_code,
        authority,
        client_name,
        nit_number,
        name_of_work,
        tender_status,
        emd_status,
        emd_returned,
        tender_cost_currency,
        processing_fee_currency,
        emd_currency,
        bank_charges_currency,
        documentation_charges_currency,
        total_tender_value_currency,
        created_by,
        updated_by,
        last_date_of_submission_from,
        last_date_of_submission_to,
        created_at_from,
        created_at_to,
        updated_at_from,
        updated_at_to,
        sort_by,
        sort_order,
        offset,
        limit,
      } = filters;

      const qb = this.tenderRepository.createQueryBuilder('tender');
      qb.leftJoinAndSelect('tender.company', 'company');
      qb.where('tender.deleted_at IS NULL');

      // Apply filters dynamically
      if (id) {
        qb.andWhere('tender.id = :id', { id });
      }
      if (company_id) {
        qb.andWhere('tender.company_id = :company_id', { company_id });
      }
      if (tender_code) {
        qb.andWhere('tender.tender_code = :tender_code', { tender_code });
      }
      if (authority) {
        qb.andWhere('tender.authority = :authority', { authority });
      }
      if (client_name) {
        qb.andWhere('tender.client_name = :client_name', { client_name });
      }
      if (nit_number) {
        qb.andWhere('tender.nit_number = :nit_number', { nit_number });
      }
      if (name_of_work) {
        qb.andWhere('tender.name_of_work = :name_of_work', { name_of_work });
      }
      if (tender_status) {
        qb.andWhere('tender.tender_status = :tender_status', { tender_status });
      }
      if (emd_status) {
        qb.andWhere('tender.emd_status = :emd_status', { emd_status });
      }
      if (emd_returned !== undefined) {
        qb.andWhere('tender.emd_returned = :emd_returned', { emd_returned });
      }
      if (tender_cost_currency) {
        qb.andWhere('tender.tender_cost_currency = :tender_cost_currency', {
          tender_cost_currency,
        });
      }
      if (processing_fee_currency) {
        qb.andWhere('tender.processing_fee_currency = :processing_fee_currency', {
          processing_fee_currency,
        });
      }
      if (emd_currency) {
        qb.andWhere('tender.emd_currency = :emd_currency', { emd_currency });
      }
      if (bank_charges_currency) {
        qb.andWhere('tender.bank_charges_currency = :bank_charges_currency', {
          bank_charges_currency,
        });
      }
      if (documentation_charges_currency) {
        qb.andWhere('tender.documentation_charges_currency = :documentation_charges_currency', {
          documentation_charges_currency,
        });
      }
      if (total_tender_value_currency) {
        qb.andWhere('tender.total_tender_value_currency = :total_tender_value_currency', {
          total_tender_value_currency,
        });
      }
      if (created_by) {
        qb.andWhere('tender.created_by = :created_by', { created_by });
      }
      if (updated_by) {
        qb.andWhere('tender.updated_by = :updated_by', { updated_by });
      }
      if (last_date_of_submission_from) {
        qb.andWhere('tender.last_date_of_submission >= :last_date_of_submission_from', {
          last_date_of_submission_from,
        });
      }
      if (last_date_of_submission_to) {
        qb.andWhere('tender.last_date_of_submission <= :last_date_of_submission_to', {
          last_date_of_submission_to,
        });
      }
      if (created_at_from) {
        qb.andWhere('tender.created_at >= :created_at_from', { created_at_from });
      }
      if (created_at_to) {
        qb.andWhere('tender.created_at <= :created_at_to', { created_at_to });
      }
      if (updated_at_from) {
        qb.andWhere('tender.updated_at >= :updated_at_from', { updated_at_from });
      }
      if (updated_at_to) {
        qb.andWhere('tender.updated_at <= :updated_at_to', { updated_at_to });
      }

      // Get total count before applying ordering and pagination
      const total = await qb.getCount();

      // Apply sorting
      const sortFieldMap: Record<string, string> = {
        tender_code: 'tender.tender_code',
        authority: 'tender.authority',
        client_name: 'tender.client_name',
        nit_number: 'tender.nit_number',
        name_of_work: 'tender.name_of_work',
        tender_status: 'tender.tender_status',
        emd_status: 'tender.emd_status',
        emd_returned: 'tender.emd_returned',
        tender_cost: 'tender.tender_cost',
        processing_fee: 'tender.processing_fee',
        emd: 'tender.emd',
        bank_charges: 'tender.bank_charges',
        documentation_charges: 'tender.documentation_charges',
        total_tender_value: 'tender.total_tender_value',
        last_date_of_submission: 'tender.last_date_of_submission',
        created_at: 'tender.created_at',
        updated_at: 'tender.updated_at',
      };

      const sortBy = sort_by && sortFieldMap[sort_by] ? sortFieldMap[sort_by] : 'tender.created_at';
      const sortOrder = sort_order === 'ASC' ? 'ASC' : 'DESC';
      qb.orderBy(sortBy, sortOrder);

      // Apply pagination
      const safeLimit = Math.min(Math.max(limit ?? 10, 1), 100);
      const safeOffset = Math.max(offset ?? 0, 0);
      qb.skip(safeOffset).take(safeLimit);

      const tenders = await qb.getMany();

      const hasMore = safeOffset + tenders.length < total;

      this.logger.log(
        `Found ${tenders.length} tenders (offset: ${safeOffset}, limit: ${safeLimit}, total: ${total}, sortBy: ${sortBy}, sortOrder: ${sortOrder})`,
      );

      return {
        data: tenders.map((tender) => this.mapToResponseDto(tender)),
        pagination: {
          total,
          offset: safeOffset,
          limit: safeLimit,
          hasMore,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error fetching tenders: ${errorMessage}`, errorStack);
      throw new BadRequestException('Failed to fetch tenders');
    }
  }

  async findOne(id: string): Promise<TenderResponseDto> {
    const tender = await this.tenderRepository.findOne({
      where: { id },
      relations: ['company'],
    });

    if (!tender) {
      throw new NotFoundException(`Tender with ID ${id} not found`);
    }

    return this.mapToResponseDto(tender);
  }

  async update(
    id: string,
    updateTenderDto: UpdateTenderDto,
    userId: string,
  ): Promise<TenderResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tender = await queryRunner.manager.findOne(Tender, {
        where: { id },
      });

      if (!tender) {
        throw new NotFoundException(`Tender with ID ${id} not found`);
      }

      // Check if tender code is being updated and if it conflicts
      if (updateTenderDto.tender_code && updateTenderDto.tender_code !== tender.tender_code) {
        const existingTender = await queryRunner.manager.findOne(Tender, {
          where: { tender_code: updateTenderDto.tender_code },
        });

        if (existingTender) {
          throw new ConflictException(
            `Tender with code "${updateTenderDto.tender_code}" already exists`,
          );
        }
      }

      // Update fields
      if (updateTenderDto.tender_code !== undefined) {
        tender.tender_code = updateTenderDto.tender_code;
      }
      if (updateTenderDto.authority !== undefined) {
        tender.authority = updateTenderDto.authority;
      }
      if (updateTenderDto.client_name !== undefined) {
        tender.client_name = updateTenderDto.client_name;
      }
      if (updateTenderDto.nit_number !== undefined) {
        tender.nit_number = updateTenderDto.nit_number;
      }
      if (updateTenderDto.misc_charges !== undefined) {
        tender.misc_charges = updateTenderDto.misc_charges;
      }
      if (updateTenderDto.name_of_work !== undefined) {
        tender.name_of_work = updateTenderDto.name_of_work;
      }

      // Update financial fields
      if (updateTenderDto.tender_cost !== undefined) {
        tender.tender_cost = updateTenderDto.tender_cost.value ?? null;
        tender.tender_cost_currency = updateTenderDto.tender_cost.currency ?? Currency.INR;
      }
      if (updateTenderDto.processing_fee !== undefined) {
        tender.processing_fee = updateTenderDto.processing_fee.value ?? null;
        tender.processing_fee_currency = updateTenderDto.processing_fee.currency ?? Currency.INR;
      }
      if (updateTenderDto.emd !== undefined) {
        tender.emd = updateTenderDto.emd.value ?? null;
        tender.emd_currency = updateTenderDto.emd.currency ?? Currency.INR;
      }
      if (updateTenderDto.bank_charges !== undefined) {
        tender.bank_charges = updateTenderDto.bank_charges.value ?? null;
        tender.bank_charges_currency = updateTenderDto.bank_charges.currency ?? Currency.INR;
      }
      if (updateTenderDto.documentation_charges !== undefined) {
        tender.documentation_charges = updateTenderDto.documentation_charges.value ?? null;
        tender.documentation_charges_currency =
          updateTenderDto.documentation_charges.currency ?? Currency.INR;
      }
      if (updateTenderDto.total_tender_value !== undefined) {
        tender.total_tender_value = updateTenderDto.total_tender_value.value ?? null;
        tender.total_tender_value_currency =
          updateTenderDto.total_tender_value.currency ?? Currency.INR;
      }

      // Update other fields
      if (updateTenderDto.last_date_of_submission !== undefined) {
        tender.last_date_of_submission = updateTenderDto.last_date_of_submission
          ? new Date(updateTenderDto.last_date_of_submission)
          : null;
      }
      if (updateTenderDto.mode_of_emd !== undefined) {
        tender.mode_of_emd = updateTenderDto.mode_of_emd;
      }
      if (updateTenderDto.tender_status !== undefined) {
        tender.tender_status = updateTenderDto.tender_status;
      }
      if (updateTenderDto.emd_status !== undefined) {
        tender.emd_status = updateTenderDto.emd_status;
      }
      if (updateTenderDto.emd_returned !== undefined) {
        tender.emd_returned = updateTenderDto.emd_returned;
      }

      tender.updated_by = userId;

      const updatedTender = await queryRunner.manager.save(Tender, tender);
      await queryRunner.commitTransaction();

      // Fetch the complete tender with relations
      const tenderWithRelations = await this.tenderRepository.findOne({
        where: { id: updatedTender.id },
        relations: ['company'],
      });

      if (!tenderWithRelations) {
        throw new NotFoundException('Tender not found after update');
      }

      return this.mapToResponseDto(tenderWithRelations);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error updating tender: ${errorMessage}`, errorStack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string): Promise<DeleteTenderResponseDto> {
    const tender = await this.tenderRepository.findOne({
      where: { id },
    });

    if (!tender) {
      throw new NotFoundException(`Tender with ID ${id} not found`);
    }

    // Soft delete
    await this.tenderRepository.softDelete(id);

    return {
      message: 'Tender deleted successfully',
      id,
    };
  }

  private mapToResponseDto(tender: Tender): TenderResponseDto {
    return {
      id: tender.id,
      company_id: tender.company_id,
      company: {
        id: tender.company.id,
        name: tender.company.name,
      },
      tender_code: tender.tender_code,
      authority: tender.authority,
      client_name: tender.client_name,
      nit_number: tender.nit_number,
      misc_charges: tender.misc_charges,
      name_of_work: tender.name_of_work,
      tender_cost: tender.tender_cost,
      tender_cost_currency: tender.tender_cost_currency,
      processing_fee: tender.processing_fee,
      processing_fee_currency: tender.processing_fee_currency,
      emd: tender.emd,
      emd_currency: tender.emd_currency,
      bank_charges: tender.bank_charges,
      bank_charges_currency: tender.bank_charges_currency,
      documentation_charges: tender.documentation_charges,
      documentation_charges_currency: tender.documentation_charges_currency,
      total_tender_value: tender.total_tender_value,
      total_tender_value_currency: tender.total_tender_value_currency,
      last_date_of_submission: tender.last_date_of_submission,
      mode_of_emd: tender.mode_of_emd,
      tender_status: tender.tender_status,
      emd_status: tender.emd_status,
      emd_returned: tender.emd_returned,
      created_at: tender.created_at,
      updated_at: tender.updated_at,
    };
  }
}
