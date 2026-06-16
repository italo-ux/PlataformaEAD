import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ComposableMap,
  Geographies,
  Geography,
} from "react-simple-maps";

const summaryCards = [
  { label: "Total de Alunos", value: "10.025", helper: "+55 no mês passado" },
  { label: "Total de Cursos", value: "45", helper: "+6 novos cursos" },
  { label: "Total de Trilhas", value: "13", helper: "+3 trilhas adicionadas" },
  { label: "Total de Programas", value: "5", helper: "+1 programa em parceria" },
];

const annualGrowth = [
  { month: "JAN", alunos: 120 },
  { month: "FEV", alunos: 220 },
  { month: "MAR", alunos: 680 },
  { month: "ABR", alunos: 4050 },
  { month: "MAI", alunos: 4320 },
  { month: "JUN", alunos: 3100 },
  { month: "JUL", alunos: 6550 },
  { month: "AGO", alunos: 8120 },
  { month: "SET", alunos: 6020 },
  { month: "OUT", alunos: 6360 },
  { month: "NOV", alunos: 8750 },
  { month: "DEZ", alunos: 9025 },
];

const trailStudents = [
  { trail: "Robótica", alunos: 10000, color: "#ef4444" },
  { trail: "Apps/Sites", alunos: 7500, color: "#fb923c" },
  { trail: "Metaverso", alunos: 3850, color: "#22c55e" },
  { trail: "Design", alunos: 5600, color: "#facc15" },
  { trail: "IA", alunos: 9900, color: "#dc2626" },
  { trail: "Redes", alunos: 6350, color: "#eab308" },
  { trail: "Softwares", alunos: 8900, color: "#fb923c" },
  { trail: "Outros", alunos: 3600, color: "#22c55e" },
];

const levelStudents = [
  { name: "Iniciante", value: 20, color: "#22c55e" },
  { name: "Intermediário", value: 35, color: "#facc15" },
  { name: "Avançado", value: 25, color: "#fb8c00" },
  { name: "Mestre", value: 20, color: "#e60000" },
];

const stateLevels = {
  high: { label: "Quantidade alta de alunos", color: "#e60000" },
  medium: { label: "Quantidade média de alunos", color: "#fb8c00" },
  regular: { label: "Quantidade razoável de alunos", color: "#f4f23a" },
  low: { label: "Quantidade baixa de alunos", color: "#39e75f" },
} as const;

type StateLevelKey = keyof typeof stateLevels;

const stateDisplayNamesByCode: Record<string, string> = {
  AC: "Acre",
  AL: "Alagoas",
  AP: "Amapá",
  AM: "Amazonas",
  BA: "Bahia",
  CE: "Ceará",
  DF: "Distrito Federal",
  ES: "Espírito Santo",
  GO: "Goiás",
  MA: "Maranhão",
  MT: "Mato Grosso",
  MS: "Mato Grosso do Sul",
  MG: "Minas Gerais",
  PA: "Pará",
  PB: "Paraíba",
  PR: "Paraná",
  PE: "Pernambuco",
  PI: "Piauí",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul",
  RO: "Rondônia",
  RR: "Roraima",
  SC: "Santa Catarina",
  SP: "São Paulo",
  SE: "Sergipe",
  TO: "Tocantins",
};

const stateLevelByKey: Record<string, StateLevelKey> = {
  ac: "low",
  acre: "low",
  al: "medium",
  alagoas: "medium",
  ap: "regular",
  amapa: "regular",
  am: "low",
  amazonas: "low",
  ba: "medium",
  bahia: "medium",
  ce: "high",
  ceara: "high",
  df: "regular",
  "distrito federal": "regular",
  es: "medium",
  "espirito santo": "medium",
  go: "medium",
  goias: "medium",
  ma: "medium",
  maranhao: "medium",
  mt: "regular",
  "mato grosso": "regular",
  ms: "low",
  "mato grosso do sul": "low",
  mg: "high",
  "minas gerais": "high",
  pa: "regular",
  para: "regular",
  pb: "high",
  paraiba: "high",
  pr: "regular",
  parana: "regular",
  pe: "high",
  pernambuco: "high",
  pi: "medium",
  piaui: "medium",
  rj: "high",
  "rio de janeiro": "high",
  rn: "high",
  "rio grande do norte": "high",
  rs: "medium",
  "rio grande do sul": "medium",
  ro: "low",
  rondonia: "low",
  rr: "regular",
  roraima: "regular",
  sc: "medium",
  "santa catarina": "medium",
  sp: "high",
  "sao paulo": "high",
  se: "high",
  sergipe: "high",
  to: "medium",
  tocantins: "medium",
};

const stateStudentCountsByKey: Record<string, number> = {
  ac: 1280,
  acre: 1280,
  al: 4620,
  alagoas: 4620,
  ap: 3180,
  amapa: 3180,
  am: 2470,
  amazonas: 2470,
  ba: 6820,
  bahia: 6820,
  ce: 8050,
  ceara: 8050,
  df: 5350,
  "distrito federal": 5350,
  es: 5120,
  "espirito santo": 5120,
  go: 6240,
  goias: 6240,
  ma: 4760,
  maranhao: 4760,
  mt: 3890,
  "mato grosso": 3890,
  ms: 2940,
  "mato grosso do sul": 2940,
  mg: 9130,
  "minas gerais": 9130,
  pa: 5660,
  para: 5660,
  pb: 7210,
  paraiba: 7210,
  pr: 5980,
  parana: 5980,
  pe: 8460,
  pernambuco: 8460,
  pi: 4410,
  piaui: 4410,
  rj: 9280,
  "rio de janeiro": 9280,
  rn: 7390,
  "rio grande do norte": 7390,
  rs: 6520,
  "rio grande do sul": 6520,
  ro: 2180,
  rondonia: 2180,
  rr: 3340,
  roraima: 3340,
  sc: 6030,
  "santa catarina": 6030,
  sp: 10025,
  "sao paulo": 10025,
  se: 7850,
  sergipe: 7850,
  to: 4970,
  tocantins: 4970,
};

const stateCodeKeys = ["sigla", "SIGLA", "uf", "UF"] as const;
const stateNameKeys = ["name", "NAME"] as const;

function normalizeStateKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function getStringProperty(
  properties: Record<string, unknown>,
  keys: readonly string[],
) {
  for (const key of keys) {
    const value = properties[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function getStateCode(properties: Record<string, unknown>) {
  return getStringProperty(properties, stateCodeKeys)?.toUpperCase() ?? null;
}

function getStateLookupKeys(properties: Record<string, unknown>) {
  const candidates = [
    getStateCode(properties),
    getStringProperty(properties, stateNameKeys),
  ];

  return candidates
    .filter((candidate): candidate is string => Boolean(candidate))
    .map(normalizeStateKey);
}

function getStateName(properties: Record<string, unknown>) {
  const stateCode = getStateCode(properties);

  if (stateCode && stateDisplayNamesByCode[stateCode]) {
    return stateDisplayNamesByCode[stateCode];
  }

  return getStringProperty(properties, stateNameKeys) ?? stateCode ?? "Estado";
}

function getStateStudentCount(properties: Record<string, unknown>) {
  for (const key of getStateLookupKeys(properties)) {
    if (Object.prototype.hasOwnProperty.call(stateStudentCountsByKey, key)) {
      return stateStudentCountsByKey[key];
    }
  }

  return 0;
}

function getStateLevel(
  properties: Record<string, unknown>,
  fallbackIndex: number,
): StateLevelKey {
  for (const key of getStateLookupKeys(properties)) {
    if (stateLevelByKey[key]) {
      return stateLevelByKey[key];
    }
  }

  const fallbackLevels: StateLevelKey[] = ["low", "medium", "regular", "high"];

  return fallbackLevels[fallbackIndex % fallbackLevels.length];
}

const brazilStates = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "AM", level: "low" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-73, -4], [-66, -4], [-64, -9], [-69, -12], [-73, -8], [-73, -4]]],
      },
    },
    {
      type: "Feature",
      properties: { name: "PA", level: "regular" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-56, -1], [-48, -2], [-48, -8], [-53, -9], [-56, -5], [-56, -1]]],
      },
    },
    {
      type: "Feature",
      properties: { name: "MA", level: "medium" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-48, -2], [-44, -3], [-43, -7], [-47, -7], [-48, -2]]],
      },
    },
    {
      type: "Feature",
      properties: { name: "CE", level: "high" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-41, -3], [-37, -4], [-38, -7], [-41, -6], [-41, -3]]],
      },
    },
    {
      type: "Feature",
      properties: { name: "PE", level: "high" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-40, -8], [-34, -8], [-35, -10], [-40, -10], [-40, -8]]],
      },
    },
    {
      type: "Feature",
      properties: { name: "BA", level: "medium" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-44, -10], [-38, -11], [-39, -16], [-43, -17], [-46, -13], [-44, -10]]],
      },
    },
    {
      type: "Feature",
      properties: { name: "MT", level: "regular" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-59, -10], [-52, -11], [-52, -16], [-58, -17], [-61, -14], [-59, -10]]],
      },
    },
    {
      type: "Feature",
      properties: { name: "GO", level: "medium" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-52, -15], [-47, -15], [-47, -19], [-51, -19], [-52, -15]]],
      },
    },
    {
      type: "Feature",
      properties: { name: "MG", level: "high" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-47, -17], [-41, -18], [-42, -22], [-46, -22], [-49, -20], [-47, -17]]],
      },
    },
    {
      type: "Feature",
      properties: { name: "RJ", level: "high" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-44, -22], [-41, -22], [-41, -24], [-44, -24], [-44, -22]]],
      },
    },
    {
      type: "Feature",
      properties: { name: "SP", level: "high" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-50, -21], [-45, -22], [-45, -25], [-49, -25], [-52, -23], [-50, -21]]],
      },
    },
    {
      type: "Feature",
      properties: { name: "PR", level: "regular" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-53, -24], [-48, -25], [-49, -27], [-53, -27], [-53, -24]]],
      },
    },
    {
      type: "Feature",
      properties: { name: "SC", level: "medium" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-53, -27], [-48, -27], [-48, -29], [-52, -29], [-53, -27]]],
      },
    },
    {
      type: "Feature",
      properties: { name: "RS", level: "medium" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-56, -29], [-50, -29], [-50, -33], [-54, -34], [-57, -32], [-56, -29]]],
      },
    },
  ],
};

const brazilStatesGeography =
  typeof window === "undefined"
    ? brazilStates
    : "/brazil-states.geojson";

function formatTooltipValue(value: unknown): string {
  if (typeof value === "number") {
    return value.toLocaleString("pt-BR");
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(formatTooltipValue).join(" - ");
  }

  return "0";
}

const formatStudentsTooltip = (value: unknown): [string, string] => [
  `${formatTooltipValue(value)} alunos`,
  "Alunos",
];

const formatPercentTooltip = (value: unknown): [string, string] => [
  `${formatTooltipValue(value)}%`,
  "Participação",
];

function AdminDashboard() {
  const [hoveredState, setHoveredState] = useState<{
    name: string;
    students: number;
  } | null>(null);

  return (
    <section className="bg-[#e9e9e9] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-slate-950">
            Dashboard da Plataforma
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-600">
            Acompanhe o progresso dos alunos e o crescimento da plataforma!
          </p>
        </div>

        <div className="rounded-2xl bg-gradient-to-r from-blue-500 to-blue-900 p-5 shadow-md shadow-blue-950/20">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {summaryCards.map((card) => (
              <div key={card.label} className="rounded-lg bg-white p-5 shadow-sm">
                <p className="text-sm font-bold leading-tight text-slate-800">
                  {card.label}
                </p>
                <p className="mt-3 text-3xl font-black text-slate-950">
                  {card.value}
                </p>
                <p className="mt-4 text-xs font-semibold text-emerald-500">
                  {card.helper}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center">
          <h3 className="inline-flex rounded-lg bg-white px-6 py-2 text-2xl font-black text-slate-950 shadow">
            Crescimento Anual de Alunos
          </h3>
        </div>

        <div className="mt-4 h-[430px] rounded-2xl bg-gradient-to-r from-blue-500 to-blue-900 p-5 shadow-md shadow-blue-950/20">
          <div className="h-full rounded-md bg-white p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={annualGrowth} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid stroke="#d6d6d6" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fontWeight: 700 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={formatStudentsTooltip} />
                <Line
                  type="monotone"
                  dataKey="alunos"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#1d4ed8", stroke: "#ffffff", strokeWidth: 2 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-12 grid overflow-hidden rounded-2xl shadow-md shadow-slate-400/30 lg:grid-cols-[1.2fr_0.9fr]">
          <div className="h-[360px] rounded-2xl bg-white p-5 lg:rounded-r-none">
            <h3 className="mb-4 text-center text-lg font-bold text-slate-800">
              Quantidade de Alunos por Trilha
            </h3>
            <ResponsiveContainer width="100%" height="88%">
              <BarChart data={trailStudents} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid stroke="#eeeeee" vertical={false} />
                <XAxis dataKey="trail" interval={0} tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={formatStudentsTooltip} />
                <Bar dataKey="alunos" radius={[3, 3, 0, 0]}>
                  {trailStudents.map((entry) => (
                    <Cell key={entry.trail} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="h-[360px] bg-gradient-to-r from-blue-500 to-blue-900 p-5">
            <div className="h-full bg-white p-4">
              <h3 className="mb-3 text-center text-lg font-bold text-slate-800">
                Alunos por Nível de Programa
              </h3>
              <ResponsiveContainer width="100%" height="86%">
                <PieChart>
                  <Pie
                    data={levelStudents}
                    dataKey="value"
                    nameKey="name"
                    outerRadius="82%"
                    label
                  >
                    {levelStudents.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={formatPercentTooltip} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-8 rounded-2xl bg-white p-6 shadow-md shadow-slate-400/30 lg:grid-cols-[1.3fr_0.8fr] lg:p-8">
          <div className="relative min-h-[420px]">
            <div className="absolute left-4 top-4 z-10 rounded-lg border border-slate-200 bg-white/95 px-4 py-3 text-sm shadow-md">
              {hoveredState ? (
                <>
                  <p className="font-black text-slate-950">
                    {hoveredState.name}
                  </p>
                  <p className="mt-1 font-semibold text-blue-700">
                    {hoveredState.students.toLocaleString("pt-BR")} alunos
                  </p>
                </>
              ) : (
                <p className="font-semibold text-slate-600">
                  Passe o mouse em um estado.
                </p>
              )}
            </div>
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{ center: [-54, -15], scale: 690 }}
              width={620}
              height={520}
              className="h-full w-full"
            >
              <Geographies geography={brazilStatesGeography}>
                {({ geographies }) =>
                  geographies.map((geo, index) => {
                    const level = getStateLevel(geo.properties, index);
                    const stateName = getStateName(geo.properties);
                    const students = getStateStudentCount(geo.properties);

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={stateLevels[level].color}
                        onMouseEnter={() =>
                          setHoveredState({
                            name: stateName,
                            students,
                          })
                        }
                        onMouseLeave={() => setHoveredState(null)}
                        stroke="#ffffff"
                        strokeWidth={1.3}
                        style={{
                          default: { cursor: "pointer", outline: "none" },
                          hover: {
                            cursor: "pointer",
                            outline: "none",
                            fill: "#2563eb",
                          },
                          pressed: { outline: "none" },
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            </ComposableMap>
          </div>

          <div className="flex items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-blue-900 p-6">
            <div className="w-full max-w-sm">
              <h3 className="text-center text-2xl font-black text-white">
                Quantidade de Alunos Por Estado
              </h3>
              <div className="mt-8 rounded-xl bg-white p-6">
                <p className="mb-5 text-center text-lg font-bold text-slate-800">
                  Legenda do gráfico
                </p>
                <div className="space-y-4">
                  {Object.entries(stateLevels).map(([key, item]) => (
                    <div key={key} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                      <span
                        className="h-4 w-4 flex-shrink-0 rounded-sm"
                        style={{ backgroundColor: item.color }}
                      />
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AdminDashboard;
