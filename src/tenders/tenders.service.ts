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

  async findAll(companyId?: string): Promise<TenderResponseDto[]> {
    try {
      const where: { company_id?: string } = {};
      if (companyId) {
        where.company_id = companyId;
      }

      const tenders = await this.tenderRepository.find({
        where,
        relations: ['company'],
        order: { created_at: 'DESC' },
      });

      return tenders.map((tender) => this.mapToResponseDto(tender));
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
