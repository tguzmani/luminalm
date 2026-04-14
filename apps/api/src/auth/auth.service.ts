import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface GoogleUserInput {
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateGoogleUser(input: GoogleUserInput): Promise<User> {
    const existing = await this.prisma.user.findUnique({
      where: { googleId: input.googleId },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.user.create({
      data: {
        googleId: input.googleId,
        email: input.email,
        name: input.name,
        avatarUrl: input.avatarUrl,
      },
    });
  }

  issueToken(user: User): string {
    return this.jwtService.sign({
      sub: user.id,
      role: user.role,
    });
  }
}
