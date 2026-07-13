import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];
    const configuredApiKey = this.configService.get<string>('API_KEY');

    if (!configuredApiKey) {
      throw new UnauthorizedException('API key is not configured on the server');
    }

    if (apiKey !== configuredApiKey) {
      throw new UnauthorizedException('Invalid API Key');
    }

    return true;
  }
}
