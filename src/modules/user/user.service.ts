import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const data = await this.prisma.users.findMany({
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
    return {
      message: 'Operation successfully',
      statusCode: 200,
      data,
    };
  }

  async getFcmToken() {
    const data = await this.prisma.users.findMany({
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
        email: true,
        user_image: true,
        users_status: true,
        last_login: true,
        ip_address: true,
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
    return {
      message: 'Operation successfully',
      statusCode: 200,
      data,
    };
  }
}
