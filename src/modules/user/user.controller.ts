import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';

@Controller('users')
@UseGuards(ApiKeyGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get('getfcmtoken')
  getFcmToken() {
    return this.userService.getFcmToken();
  }

  @Get('getByVillageIds')
  getByVillageIds(@Query('village_id') villageIdQuery: any) {
    let ids: number[] = [];

    if (typeof villageIdQuery === 'string') {
      if (villageIdQuery.startsWith('[') && villageIdQuery.endsWith(']')) {
        try {
          const parsed = JSON.parse(villageIdQuery);
          if (Array.isArray(parsed)) {
            ids = parsed
              .map((id: any) => parseInt(id, 10))
              .filter((id) => !isNaN(id));
          }
        } catch (e) {
          // JSON parse failed, fallback
        }
      }

      if (ids.length === 0) {
        ids = villageIdQuery
          .split(',')
          .map((id) => parseInt(id.trim(), 10))
          .filter((id) => !isNaN(id));
      }
    } else if (Array.isArray(villageIdQuery)) {
      ids = villageIdQuery
        .map((id) => parseInt(id, 10))
        .filter((id) => !isNaN(id));
    }

    return this.userService.getByVillageIds(ids);
  }

  @Get('getUserById/:id')
  getUserById(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }
}
