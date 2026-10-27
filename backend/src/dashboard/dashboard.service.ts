import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

interface OverviewRow {
  matriculas: string;
  alunos_ativos: string;
  concluidos: string;
  iniciaram: string;
  avancaram: string;
  certificados: string;
}

const selectedEnrollments = `
  WITH selected AS (
    SELECT m.id, m.id_usuario, m.id_curso, m.progresso, m.conclusao,
           m.segundos_estudados, m.data_matricula
    FROM matricula m
    JOIN users u ON u.id = m.id_usuario
    LEFT JOIN endereco e ON e.id_usuario = u.id
    WHERE u.role = 'aluno'
      AND ($1::date IS NULL OR m.data_matricula >= $1::date)
      AND ($2::date IS NULL OR m.data_matricula < $2::date + INTERVAL '1 day')
      AND ($3::uuid IS NULL OR m.id_curso = $3::uuid)
      AND ($4::uuid IS NULL OR EXISTS (
        SELECT 1 FROM trilha_curso tc
        WHERE tc.id_curso = m.id_curso AND tc.id_trilha = $4::uuid
      ))
      AND ($5::text IS NULL OR e.uf = $5::text)
  )
`;

const selectedUsers = `
  ${selectedEnrollments}
  SELECT u.id, u.created_at, e.uf
  FROM users u
  LEFT JOIN endereco e ON e.id_usuario = u.id
  WHERE u.role = 'aluno'
    AND ($1::date IS NULL OR u.created_at >= $1::date)
    AND ($2::date IS NULL OR u.created_at < $2::date + INTERVAL '1 day')
    AND ($5::text IS NULL OR e.uf = $5::text)
    AND (($3::uuid IS NULL AND $4::uuid IS NULL)
      OR EXISTS (SELECT 1 FROM selected s WHERE s.id_usuario = u.id))
`;

@Injectable()
export class DashboardService {
  constructor(private readonly dataSource: DataSource) {}

  async getSummary(filters: DashboardQueryDto) {
    if (
      filters.periodoInicio &&
      filters.periodoFim &&
      filters.periodoInicio > filters.periodoFim
    ) {
      throw new BadRequestException(
        'O início do período deve anteceder o fim.',
      );
    }

    const params = [
      filters.periodoInicio ?? null,
      filters.periodoFim ?? null,
      filters.cursoId ?? null,
      filters.trilhaId ?? null,
      filters.uf ?? null,
    ];
    const growthGranularity =
      filters.granularidadeCrescimento === 'anual' ? 'year' : 'month';
    const certificateGranularity =
      filters.granularidadeCertificados === 'anual' ? 'year' : 'month';

    const [users, overview, ufs, growth, performance, certificates] =
      await Promise.all([
        this.dataSource.query<Array<{ total: number }>>(
          `SELECT COUNT(*)::int AS total FROM (${selectedUsers}) users_in_scope`,
          params,
        ),
        this.dataSource.query<OverviewRow[]>(
          `${selectedEnrollments}
         SELECT COUNT(DISTINCT s.id)::int AS matriculas,
                COUNT(DISTINCT s.id_usuario) FILTER (WHERE NOT s.conclusao)::int AS alunos_ativos,
                COUNT(DISTINCT s.id) FILTER (WHERE s.conclusao)::int AS concluidos,
                COUNT(DISTINCT s.id) FILTER (WHERE s.progresso > 0 OR s.segundos_estudados > 0)::int AS iniciaram,
                COUNT(DISTINCT s.id) FILTER (WHERE s.progresso >= 50)::int AS avancaram,
                COUNT(DISTINCT cert.id)::int AS certificados
         FROM selected s
         LEFT JOIN certificados cert ON cert.id_matricula = s.id`,
          params,
        ),
        this.dataSource.query<Array<{ uf: string; alunos: number }>>(
          `SELECT uf, COUNT(*)::int AS alunos FROM (${selectedUsers}) users_in_scope
         WHERE uf IS NOT NULL GROUP BY uf ORDER BY alunos DESC, uf`,
          params,
        ),
        this.dataSource.query<Array<{ periodo: string; novos: number }>>(
          `SELECT to_char(periodo, $6::text) AS periodo, novos::int AS novos
         FROM (
           SELECT date_trunc($7::text, created_at) AS periodo, COUNT(*) AS novos
           FROM (${selectedUsers}) users_in_scope
           GROUP BY 1
         ) series ORDER BY periodo`,
          [
            ...params,
            growthGranularity === 'year' ? 'YYYY' : 'YYYY-MM',
            growthGranularity,
          ],
        ),
        this.dataSource.query<
          Array<{
            id: string;
            nome: string;
            tipo: 'curso' | 'trilha';
            matriculas: number;
            progresso_medio: number;
            taxa_conclusao: number;
            alunos_ativos: number;
          }>
        >(
          `${selectedEnrollments}
         SELECT id, nome, tipo, matriculas, progresso_medio, taxa_conclusao, alunos_ativos
         FROM (
           SELECT c.id, c.nome, 'curso'::text AS tipo,
                  COUNT(DISTINCT s.id)::int AS matriculas,
                  COALESCE(AVG(s.progresso), 0)::float AS progresso_medio,
                  COALESCE(100.0 * COUNT(*) FILTER (WHERE s.conclusao) / NULLIF(COUNT(*), 0), 0)::float AS taxa_conclusao,
                  COUNT(DISTINCT s.id_usuario) FILTER (WHERE NOT s.conclusao)::int AS alunos_ativos
           FROM selected s JOIN cursos c ON c.id = s.id_curso GROUP BY c.id, c.nome
           UNION ALL
           SELECT t.id, t.nome, 'trilha'::text AS tipo,
                  COUNT(DISTINCT s.id)::int AS matriculas,
                  COALESCE(AVG(s.progresso), 0)::float AS progresso_medio,
                  COALESCE(100.0 * COUNT(*) FILTER (WHERE s.conclusao) / NULLIF(COUNT(*), 0), 0)::float AS taxa_conclusao,
                  COUNT(DISTINCT s.id_usuario) FILTER (WHERE NOT s.conclusao)::int AS alunos_ativos
           FROM selected s
           JOIN trilha_curso tc ON tc.id_curso = s.id_curso
           JOIN trilhas t ON t.id = tc.id_trilha
           GROUP BY t.id, t.nome
         ) metrics ORDER BY matriculas DESC, nome LIMIT 50`,
          params,
        ),
        this.dataSource.query<Array<{ periodo: string; certificados: number }>>(
          `${selectedEnrollments}
         SELECT to_char(date_trunc($7::text, cert.emitido_em), $6::text) AS periodo,
                COUNT(*)::int AS certificados
         FROM certificados cert JOIN selected s ON s.id = cert.id_matricula
         GROUP BY 1 ORDER BY 1`,
          [
            ...params,
            certificateGranularity === 'year' ? 'YYYY' : 'YYYY-MM',
            certificateGranularity,
          ],
        ),
      ]);

    const totals = overview[0];
    const enrollmentCount = Number(totals?.matriculas ?? 0);
    const completedCount = Number(totals?.concluidos ?? 0);
    const ufTotal = ufs.reduce((sum, item) => sum + Number(item.alunos), 0);
    const funnel = [
      ['Matriculados', enrollmentCount],
      ['Iniciaram', Number(totals?.iniciaram ?? 0)],
      ['Avançaram', Number(totals?.avancaram ?? 0)],
      ['Concluíram', completedCount],
    ] as const;
    let accumulatedStudents = 0;
    let accumulatedCertificates = 0;

    return {
      overview: {
        alunosCadastrados: Number(users[0]?.total ?? 0),
        alunosAtivos: Number(totals?.alunos_ativos ?? 0),
        matriculasIniciadas: enrollmentCount,
        taxaConclusao: enrollmentCount
          ? (completedCount / enrollmentCount) * 100
          : 0,
        certificadosEmitidos: Number(totals?.certificados ?? 0),
      },
      ufDistribution: ufs.map((item) => ({
        uf: item.uf,
        nome: item.uf,
        alunos: Number(item.alunos),
        participacao: ufTotal ? (Number(item.alunos) / ufTotal) * 100 : 0,
      })),
      growthSeries: growth.map((item) => {
        accumulatedStudents += Number(item.novos);
        return {
          periodo: item.periodo,
          novosAlunos: Number(item.novos),
          totalAcumulado: accumulatedStudents,
        };
      }),
      courseTrackPerformance: performance.map((item) => ({
        id: item.id,
        nome: item.nome,
        tipo: item.tipo,
        matriculas: Number(item.matriculas),
        progressoMedio: Number(item.progresso_medio),
        taxaConclusao: Number(item.taxa_conclusao),
        alunosAtivos: Number(item.alunos_ativos),
      })),
      learningFunnel: funnel.map(([etapa, quantidade]) => ({
        etapa,
        quantidade,
        percentual: enrollmentCount ? (quantidade / enrollmentCount) * 100 : 0,
      })),
      certificatesOverTime: certificates.map((item) => {
        accumulatedCertificates += Number(item.certificados);
        return {
          periodo: item.periodo,
          certificados: Number(item.certificados),
          totalAcumulado: accumulatedCertificates,
        };
      }),
    };
  }

  async getStats() {
    const summary = await this.getSummary({});
    const [counts] = await this.dataSource.query<
      Array<{ cursos: number; trilhas: number; programas: number }>
    >(
      `SELECT (SELECT COUNT(*)::int FROM cursos) AS cursos,
              (SELECT COUNT(*)::int FROM trilhas) AS trilhas,
              (SELECT COUNT(*)::int FROM programas) AS programas`,
    );
    return {
      cards: {
        totalAlunos: summary.overview.alunosCadastrados,
        totalCursos: counts.cursos,
        totalTrilhas: counts.trilhas,
        totalProgramas: counts.programas,
      },
      crescimentoAnual: summary.growthSeries.map((item) => ({
        mes: item.periodo,
        alunos: item.novosAlunos,
      })),
      alunosPorTrilha: summary.courseTrackPerformance
        .filter((item) => item.tipo === 'trilha')
        .map((item) => ({ trilha: item.nome, quantidade: item.alunosAtivos })),
      nivelPrograma: [],
    };
  }
}
