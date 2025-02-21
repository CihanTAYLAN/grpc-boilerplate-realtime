import { Controller, Get } from '@nestjs/common';
import { ApiService } from './api.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller()
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @Get()
  @ApiOperation({
    operationId: 'Health Check',
    description: 'Health check service',
  })
  @ApiResponse({
    status: 200,
    description: 'Health status',
    example: {
      status: 'ok',
      timestamp: '2021-01-01T00:00:00.000Z',
    },
  })
  getHealth(): Promise<{ status: string }> {
    return this.apiService.getHealth();
  }
}
