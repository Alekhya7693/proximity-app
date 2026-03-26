import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async healthCheck() {
    const uptime = process.uptime();
    let dbStatus = 'ok';

    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      dbStatus = 'error';
    }

    return {
      status: dbStatus === 'ok' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: Math.round(uptime),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: dbStatus,
      },
    };
  }

  @Get('health/ready')
  @ApiOperation({ summary: 'Readiness check — verifies all dependencies' })
  @ApiResponse({ status: 200, description: 'Service is ready to accept traffic' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async readinessCheck() {
    const checks: Record<string, string> = {};

    // Database check
    try {
      await this.dataSource.query('SELECT 1');
      checks.database = 'ok';
    } catch {
      checks.database = 'error';
    }

    const allOk = Object.values(checks).every((v) => v === 'ok');

    return {
      status: allOk ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  @Get('health/live')
  @ApiOperation({ summary: 'Liveness check — confirms process is running' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  liveCheck() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }
}
