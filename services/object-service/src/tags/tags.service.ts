import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@lifeos/db';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { AuthenticatedActor } from '../auth/session.guard';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTagDto, actor: AuthenticatedActor) {
    try {
      return await this.prisma.tag.create({
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
          `A tag named "${dto.name}" already exists in this workspace`,
        );
      }
      throw err;
    }
  }

  /** `query` powers the Search Service's cross-object keyword search — see
   * the identical note on FoldersService.findAll. */
  findAll(actor: AuthenticatedActor, query?: string) {
    return this.prisma.tag.findMany({
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
    const tag = await this.prisma.tag.findFirst({
      where: { id, workspaceId: actor.workspaceId, deletedAt: null },
    });
    if (!tag) throw new NotFoundException(`No tag with id "${id}"`);
    return tag;
  }

  async update(id: string, dto: UpdateTagDto, actor: AuthenticatedActor) {
    await this.findOne(id, actor);
    return this.prisma.tag.update({
      where: { id },
      data: { ...dto, updatedBy: actor.id, version: { increment: 1 } },
    });
  }

  async remove(id: string, actor: AuthenticatedActor) {
    await this.findOne(id, actor);
    await this.prisma.tag.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: actor.id },
    });
  }
}
