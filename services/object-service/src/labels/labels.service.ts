import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@lifeos/db';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';
import { AuthenticatedActor } from '../auth/session.guard';

@Injectable()
export class LabelsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLabelDto, actor: AuthenticatedActor) {
    try {
      return await this.prisma.label.create({
        data: {
          workspaceId: actor.workspaceId,
          ownerId: actor.id,
          name: dto.name,
          color: dto.color,
          createdBy: actor.id,
          updatedBy: actor.id,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(
          `A label named "${dto.name}" already exists in this workspace`,
        );
      }
      throw err;
    }
  }

  /** `query` powers the Search Service's cross-object keyword search — see
   * the identical note on FoldersService.findAll. */
  findAll(actor: AuthenticatedActor, query?: string) {
    return this.prisma.label.findMany({
      where: {
        workspaceId: actor.workspaceId,
        deletedAt: null,
        ...(query
          ? { name: { contains: query, mode: 'insensitive' as const } }
          : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, actor: AuthenticatedActor) {
    const label = await this.prisma.label.findFirst({
      where: { id, workspaceId: actor.workspaceId, deletedAt: null },
    });
    if (!label) throw new NotFoundException(`No label with id "${id}"`);
    return label;
  }

  async update(id: string, dto: UpdateLabelDto, actor: AuthenticatedActor) {
    await this.findOne(id, actor);
    return this.prisma.label.update({
      where: { id },
      data: { ...dto, updatedBy: actor.id, version: { increment: 1 } },
    });
  }

  async remove(id: string, actor: AuthenticatedActor) {
    await this.findOne(id, actor);
    await this.prisma.label.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: actor.id },
    });
  }
}
