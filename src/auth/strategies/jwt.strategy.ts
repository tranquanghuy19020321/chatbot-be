import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
    });
  }

  async validate(payload: {
    sub: number;
    email: string;
    name: string;
    role: string;
  }) {
    try {
      const user = await this.usersService.findOne(payload.sub);

      if (!user || !user.isActive) {
        throw new UnauthorizedException(
          'Người dùng không tồn tại hoặc đã bị vô hiệu hóa',
        );
      }

      return {
        userId: payload.sub,
        email: payload.email,
        name: payload.name,
        role: user.role,
      };
    } catch {
      throw new UnauthorizedException('Token không hợp lệ');
    }
  }
}
