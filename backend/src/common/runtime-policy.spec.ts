import {
  databaseTlsConfig,
  isTestCourseBypassEnabled,
  schemaSynchronizationEnabled,
} from './runtime-policy';

describe('runtime safety policy', () => {
  it('verifica o certificado TLS do banco quando SSL é habilitado', () => {
    expect(databaseTlsConfig({ DB_SSL: 'false' })).toBe(false);
    expect(databaseTlsConfig({ DB_SSL: 'true' })).toEqual({
      rejectUnauthorized: true,
    });
    expect(databaseTlsConfig({ DB_SSL: 'true', DB_SSL_CA: 'ca-test' })).toEqual(
      {
        rejectUnauthorized: true,
        ca: 'ca-test',
      },
    );
  });
  it('refuses automatic schema changes even when enabled in configuration', () => {
    expect(schemaSynchronizationEnabled({ DB_SYNCHRONIZE: 'false' })).toBe(
      false,
    );
    expect(() =>
      schemaSynchronizationEnabled({ DB_SYNCHRONIZE: 'true' }),
    ).toThrow('DB_SYNCHRONIZE deve ser false');
  });

  it('never enables test-course completion in production', () => {
    expect(
      isTestCourseBypassEnabled({
        NODE_ENV: 'production',
        ALLOW_TEST_COURSE_BYPASS: 'true',
      }),
    ).toBe(false);
    expect(
      isTestCourseBypassEnabled({
        NODE_ENV: 'test',
        ALLOW_TEST_COURSE_BYPASS: 'true',
      }),
    ).toBe(true);
    expect(isTestCourseBypassEnabled({ NODE_ENV: 'test' })).toBe(false);
  });
});
