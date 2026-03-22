import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { estate: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Create session
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      estateId: user.estateId,
    });

    await this.prisma.userSession.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        estate: user.estate,
      },
    };
  }

  async logout(token: string) {
    await this.prisma.userSession.delete({
      where: { token },
    });
  }

  async validateToken(token: string) {
    const session = await this.prisma.userSession.findUnique({
      where: { token },
      include: {
        user: {
          include: { estate: true },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    return session.user;
  }

  async createSuperAdmin(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    // Check if super admin already exists
    const existingSuperAdmin = await this.prisma.user.findFirst({
      where: { role: UserRole.SUPER_ADMIN },
    });

    if (existingSuperAdmin) {
      throw new BadRequestException('Super admin already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        role: UserRole.SUPER_ADMIN,
      },
    });
  }

  async createEstateAdmin(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    estateId: string;
  }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        role: UserRole.ESTATE_ADMIN,
      },
      include: { estate: true },
    });
  }

  async createSecurityUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    estateId: string;
  }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        role: UserRole.SECURITY,
      },
      include: { estate: true },
    });
  }
}