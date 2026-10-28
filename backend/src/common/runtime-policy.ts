export function schemaSynchronizationEnabled(
  env: NodeJS.ProcessEnv = process.env,
): false {
  if (env.DB_SYNCHRONIZE?.trim().toLowerCase() === 'true') {
    throw new Error(
      'DB_SYNCHRONIZE deve ser false; utilize as migrations para atualizar o banco.',
    );
  }
  return false;
}

export function isTestCourseBypassEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return (
    env.NODE_ENV !== 'production' && env.ALLOW_TEST_COURSE_BYPASS === 'true'
  );
}

export function databaseTlsConfig(
  env: NodeJS.ProcessEnv = process.env,
): false | { rejectUnauthorized: true; ca?: string } {
  if (env.DB_SSL !== 'true') return false;
  return {
    rejectUnauthorized: true,
    ...(env.DB_SSL_CA ? { ca: env.DB_SSL_CA } : {}),
  };
}
