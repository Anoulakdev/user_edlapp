import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  private fcmTotalCache: { total: number; timestamp: number } | null = null;

  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const phoneNo = createUserDto.phone_no?.trim();

    const existingUser = await this.prisma.users.findFirst({
      where: {
        phone_no: phoneNo,
      },
      select: {
        user_id: true,
      },
    });

    if (existingUser) {
      throw new BadRequestException('Phone number already exists');
    }

    // หาค่า user_id ສູງສຸດແລ້ວ + 1
    const lastUser = await this.prisma.users.findFirst({
      orderBy: {
        user_id: 'desc',
      },
      select: {
        user_id: true,
      },
    });
    const nextUserId = (lastUser?.user_id || 0) + 1;

    const data = await this.prisma.users.create({
      data: {
        user_id: nextUserId,
        username: createUserDto.username?.trim(),
        password: process.env.PASSWORD_DEFAULT,
        phone_no: phoneNo,
        users_status: 'A',
        otp_cycle: 1,
        otp_start: new Date(),
        otp_end: new Date(Date.now() + 60 * 60 * 1000),
      },
      select: {
        user_id: true,
        username: true,
        phone_no: true,
        users_status: true,
        otp_cycle: true,
        created_at: true,
      },
    });

    await this.prisma
      .$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('users', 'user_id'), $1)`,
        nextUserId,
      )
      .catch(() => {});

    return {
      message: 'create successfully',
      statusCode: 200,
      data,
    };
  }

  async findAll(page?: number, limit?: number, search?: string) {
    const select = {
      user_id: true,
      username: true,
      phone_no: true,
      email: true,
      user_image: true,
      users_status: true,
      last_login: true,
      ip_address: true,
      role_id: true,
      birthday: true,
      province_id: true,
      district_id: true,
      village_id: true,
      otp_start: true,
      otp_end: true,
      otp_cycle: true,
      access_noti: true,
      created_at: true,
    };

    const where: any = {};
    if (search && search.trim() !== '') {
      const searchTrimmed = search.trim();
      where.OR = [
        { username: { contains: searchTrimmed, mode: 'insensitive' } },
        { phone_no: { contains: searchTrimmed, mode: 'insensitive' } },
        { email: { contains: searchTrimmed, mode: 'insensitive' } },
      ];
    }

    // Enforce safe pagination by default to prevent full-table memory explosion
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (pageNum - 1) * limitNum;
    const take = limitNum;

    const [data, total] = await Promise.all([
      this.prisma.users.findMany({
        where,
        orderBy: {
          user_id: 'desc',
        },
        select,
        skip,
        take,
      }),
      this.prisma.users.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return {
      message: 'Operation successfully',
      statusCode: 200,
      data,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    };
  }

  async getFcmToken(
    page?: number,
    limit?: number,
    all: boolean = false,
    lastId?: number,
  ) {
    const where = {
      access_noti: {
        not: null,
        notIn: ['', 'demo', 'null', 'undefined', 'DEMO', 'NULL', 'UNDEFINED'],
      },
    };

    // If caller explicitly requests all records at once
    if (all) {
      const data = await this.prisma.users.findMany({
        where,
        select: {
          user_id: true,
          access_noti: true,
        },
        orderBy: {
          user_id: 'asc',
        },
      });

      return {
        message: 'Operation successfully',
        statusCode: 200,
        data,
        total: data.length,
      };
    }

    const l = Math.max(1, Math.min(Number(limit) || 50000, 100000));

    // Fast cursor/keyset pagination if lastId is provided
    if (lastId && !isNaN(Number(lastId))) {
      const cursorWhere: any = {
        ...where,
        user_id: { gt: Number(lastId) },
      };

      const data = await this.prisma.users.findMany({
        where: cursorWhere,
        select: {
          user_id: true,
          access_noti: true,
        },
        take: l,
        orderBy: {
          user_id: 'asc',
        },
      });

      return {
        message: 'Operation successfully',
        statusCode: 200,
        data,
        limit: l,
        count: data.length,
        hasMore: data.length === l,
        nextLastId: data.length > 0 ? data[data.length - 1].user_id : null,
      };
    }

    // Default to high-performance chunked pagination with count caching (60s TTL)
    const p = Math.max(1, Number(page) || 1);
    const skip = (p - 1) * l;

    const now = Date.now();
    let totalPromise: Promise<number>;

    if (this.fcmTotalCache && now - this.fcmTotalCache.timestamp < 60000) {
      totalPromise = Promise.resolve(this.fcmTotalCache.total);
    } else {
      totalPromise = this.prisma.users.count({ where }).then((t) => {
        this.fcmTotalCache = { total: t, timestamp: Date.now() };
        return t;
      });
    }

    const [total, data] = await Promise.all([
      totalPromise,
      this.prisma.users.findMany({
        where,
        select: {
          user_id: true,
          access_noti: true,
        },
        skip,
        take: l,
        orderBy: {
          user_id: 'asc',
        },
      }),
    ]);

    return {
      message: 'Operation successfully',
      statusCode: 200,
      data,
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
    };
  }

  async getFCM() {
    const data = await this.prisma.users.findMany({
      where: {
        user_id: 51,
        access_noti: {
          not: null,
          notIn: ['', 'demo', 'null', 'undefined', 'DEMO', 'NULL', 'UNDEFINED'],
        },
      },
      select: {
        user_id: true,
        access_noti: true,
      },
    });

    return {
      message: 'Operation successfully',
      statusCode: 200,
      data,
    };
  }

  async getByVillageIds(ids: number[]) {
    if (!ids || ids.length === 0) {
      return {
        message: 'Operation successfully',
        statusCode: 200,
        data: [],
      };
    }

    const data = await this.prisma.users.findMany({
      where: {
        village_id: {
          in: ids,
        },
      },
      select: {
        user_id: true,
        username: true,
        phone_no: true,
        village_id: true,
        access_noti: true,
      },
    });

    return {
      message: 'Operation successfully',
      statusCode: 200,
      data,
    };
  }

  async findOne(id: number) {
    const data = await this.prisma.users.findUnique({
      where: {
        user_id: id,
      },
      select: {
        user_id: true,
        username: true,
        phone_no: true,
        email: true,
        user_image: true,
        users_status: true,
        last_login: true,
        ip_address: true,
        role_id: true,
        birthday: true,
        province_id: true,
        district_id: true,
        village_id: true,
        otp_start: true,
        otp_end: true,
        otp_cycle: true,
        access_noti: true,
      },
    });

    if (!data) {
      throw new NotFoundException(`User #${id} not found`);
    }

    return {
      message: 'Operation successfully',
      statusCode: 200,
      data,
    };
  }

  async update(id: number) {
    const exists = await this.prisma.users.findUnique({
      where: { user_id: id },
      select: { user_id: true },
    });

    if (!exists) {
      throw new NotFoundException(`User #${id} not found`);
    }

    await this.prisma.users.update({
      where: {
        user_id: id,
      },
      data: {
        password: process.env.PASSWORD_DEFAULT,
        users_status: 'A',
      },
    });

    return {
      message: 'update successfully',
      statusCode: 200,
    };
  }
}
