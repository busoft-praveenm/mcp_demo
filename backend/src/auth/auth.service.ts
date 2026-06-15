import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async signup(data: any) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
      },
    });

    const payload = { sub: user.id, email: user.email, name: user.name, role: user.role };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: payload
    };
  }

  async login(data: any) {
    const user = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, name: user.name, role: user.role };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: payload
    };
  }
}
