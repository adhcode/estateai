import { Controller, Post, Body, Get, UseGuards, Request, Param, Patch, Delete } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { UserRole } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Public()
  @Post('login')
  async login(@Body() loginDto: { email: string; password: string }) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Request() req) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    return this.authService.logout(token);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    return req.user;
  }

  @Public()
  @Post('setup-super-admin')
  async setupSuperAdmin(@Body() data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    return this.authService.createSuperAdmin(data);
  }

  @Post('create-estate-admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async createEstateAdmin(@Body() data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    estateId: string;
  }) {
    return this.authService.createEstateAdmin(data);
  }

  @Post('create-security')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ESTATE_ADMIN)
  async createSecurity(@Body() data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    estateId: string;
  }) {
    return this.authService.createSecurityUser(data);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async getAllUsers(@Request() req) {
    return this.usersService.getAllUsers(req.user.role);
  }

  @Get('estates/:estateId/users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ESTATE_ADMIN)
  async getEstateUsers(@Param('estateId') estateId: string, @Request() req) {
    return this.usersService.getEstateUsers(estateId, req.user.role);
  }

  @Patch('users/:userId')
  @UseGuards(JwtAuthGuard)
  async updateUser(
    @Param('userId') userId: string,
    @Body() data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      email?: string;
    },
    @Request() req,
  ) {
    return this.usersService.updateUser(userId, data, req.user.role, req.user.id);
  }

  @Delete('users/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ESTATE_ADMIN)
  async deactivateUser(@Param('userId') userId: string, @Request() req) {
    return this.usersService.deactivateUser(userId, req.user.role, req.user.id);
  }
}