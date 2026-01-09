import { Injectable } from '@nestjs/common';

@Injectable()
export class IamService {
  async login(body: any) {
    return {
      message: 'Login endpoint (to be implemented)',
      payload: body,
    };
  }
}
