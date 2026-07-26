import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { AuthenticatedActor } from '../auth/session.guard';

@Injectable()
export class FoldersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFolderDto, actor: AuthenticatedActor) {
    return this.prisma.folder.create({
      data: {
        workspaceId: actor.workspaceId,
        ownerId: actor.id,
        name: dto.name,
        parentFolderId: dto.parentFolderId,
        priority: dto.priority,
        status: dto.status,
        location: dto.location,
        createdBy: actor.id,
        updatedBy: actor.id,
      },
    });
  }

  async findAll(actor: AuthenticatedActor) {
    return this.prisma.folder.findMany({
      where: { workspaceId: actor.workspaceId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, actor: AuthenticatedActor) {
    const folder = await this.prisma.folder.findFirst({
      where: { id, workspaceId: actor.workspaceId, deletedAt: null },
    });
    if (!folder) throw new NotFoundException(`No folder with id "${id}"`);
    return folder;
  }

  async update(id: string, dto: UpdateFolderDto, actor: AuthenticatedActor) {
    await this.findOne(id, actor);
    return this.prisma.folder.update({
      where: { id },
      data: { ...dto, updatedBy: actor.id, version: { increment: 1 } },
    });
  }

  async archive(id: string, actor: AuthenticatedActor) {
    await this.findOne(id, actor);
    return this.prisma.folder.update({
      where: { id },
      data: { archivedAt: new Date(), updatedBy: actor.id },
    });
  }

  /** Soft-delete per Round 5 Decision 7 — never physically removed by
   * default. Child folders remain intact (their parentFolderId still
   * points here; a deleted parent doesn't cascade-delete children). */
  async remove(id: string, actor: AuthenticatedActor) {
    await this.findOne(id, actor);
    await this.prisma.folder.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: actor.id },
    });
  }
}
