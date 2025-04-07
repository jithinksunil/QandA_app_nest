import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}
  async viewUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        blocked: true,
        _count: { select: { documents: true } },
      },
    });
    const modifiedData = users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      blocked: user.blocked,
      documentCount: user._count.documents,
    }));

    return modifiedData;
  }

  async updateUser({
    blocked,
    id,
    role,
  }: {
    role: UserRole;
    blocked: boolean;
    id: string;
  }) {
    await this.prisma.user.update({
      where: { id },
      data: { role: role, blocked },
    });
    return { message: 'User updated successfully', id, role, blocked };
  }

  async renameUser({ id, name }: { name: string; id: string }) {
    await this.prisma.user.update({ where: { id }, data: { name } });
    return { id, name, message: 'Renamed successfully' };
  }
}
