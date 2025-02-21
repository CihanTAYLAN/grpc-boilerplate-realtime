import { Injectable } from '@nestjs/common';

@Injectable()
export class ApiService {
  getHealth(): Promise<{ status: string }> {
    return Promise.resolve({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  }
}
