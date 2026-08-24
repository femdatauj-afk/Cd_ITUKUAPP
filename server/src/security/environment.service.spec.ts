import { EnvironmentService } from './environment.service';

describe('EnvironmentService', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.JWT_SECRET;
    delete process.env.DATABASE_URL;
    delete process.env.CORS_ORIGINS;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('loads the local .env values when required environment values are missing', () => {
    expect(() => new EnvironmentService()).not.toThrow();

    const service = new EnvironmentService();
    expect(service.get('jwtSecret')).toBeTruthy();
    expect(service.get('databaseUrl')).toBe('file:./itukuapp-local.db');
    expect(service.get('corsOrigins')).toContain('http://localhost:3001');
  });
});
