import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getEstateUsers(estateId: string, requestingUserRole: UserRole) {
    // Only SUPER_ADMIN and ESTATE_ADMIN can view estate users
    if (requestingUserRole !== UserRole.SUPER_ADMIN && requestingUserRole !== UserRole.ESTATE_ADMIN) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return this.prisma.user.findMany({
      where: {
        estateId,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
        estate: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' },
        { firstName: 'asc' },
      ],
    });
  }

  async getAllUsers(requestingUserRole: UserRole) {
    // Only SUPER_ADMIN can view all users
    if (requestingUserRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return this.prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
        estate: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' },
        { firstName: 'asc' },
      ],
    });
  }

  async deactivateUser(userId: string, requestingUserRole: UserRole, requestingUserId: string) {
    const userToDeactivate = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToDeactivate) {
      throw new NotFoundException('User not found');
    }

    // Users cannot deactivate themselves
    if (userId === requestingUserId) {
      throw new ForbiddenException('Cannot deactivate yourself');
    }

    // Role-based permissions
    if (requestingUserRole === UserRole.SUPER_ADMIN) {
      // Super admin can deactivate anyone except other super admins
      if (userToDeactivate.role === UserRole.SUPER_ADMIN) {
        throw new ForbiddenException('Cannot deactivate another super admin');
      }
    } else if (requestingUserRole === UserRole.ESTATE_ADMIN) {
      // Estate admin can only deactivate security users in their estate
      if (userToDeactivate.role !== UserRole.SECURITY) {
        throw new ForbiddenException('Estate admins can only deactivate security users');
      }
    } else {
      throw new ForbiddenException('Insufficient permissions');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
  }

  async updateUser(userId: string, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
  }, requestingUserRole: UserRole, requestingUserId: string) {
    const userToUpdate = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToUpdate) {
      throw new NotFoundException('User not found');
    }

    // Users can update themselves, or admins can update their subordinates
    const canUpdate = 
      userId === requestingUserId || // Self update
      requestingUserRole === UserRole.SUPER_ADMIN || // Super admin can update anyone
      (requestingUserRole === UserRole.ESTATE_ADMIN && userToUpdate.role === UserRole.SECURITY); // Estate admin can update security

    if (!canUpdate) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
      },
    });
  }
}