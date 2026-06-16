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

const stateLevelByName: Record<string, keyof typeof stateLevels> = {
  Acre: "low",
  AC: "low",
  Alagoas: "medium",
  AL: "medium",
  Amapa: "regular",
  "Amapá": "regular",
  AP: "regular",
  Amazonas: "low",
  AM: "low",
  Bahia: "medium",
  BA: "medium",
  Ceara: "high",
  Ceará: "high",
  CE: "high",
  "Distrito Federal": "regular",
  DF: "regular",
  "Espirito Santo": "medium",
  "Espírito Santo": "medium",
  ES: "medium",
  Goias: "medium",
  Goiás: "medium",
  GO: "medium",
  Maranhao: "medium",
  Maranhão: "medium",
  MA: "medium",
  "Mato Grosso": "regular",
  MT: "regular",
  "Mato Grosso do Sul": "low",
  MS: "low",
  "Minas Gerais": "high",
  MG: "high",
  Para: "regular",
  Pará: "regular",
  PA: "regular",
  Paraiba: "high",
  Paraíba: "high",
  PB: "high",
  Parana: "regular",
  Paraná: "regular",
  PR: "regular",
  Pernambuco: "high",
  PE: "high",
  Piaui: "medium",
  Piauí: "medium",
  PI: "medium",
  "Rio de Janeiro": "high",
  RJ: "high",
  "Rio Grande do Norte": "high",
  RN: "high",
  "Rio Grande do Sul": "medium",
  RS: "medium",
  Rondonia: "low",
  Rondônia: "low",
  RO: "low",
  Roraima: "regular",
  RR: "regular",
  "Santa Catarina": "medium",
  SC: "medium",
  "Sao Paulo": "high",
  "São Paulo": "high",
  SP: "high",
  Sergipe: "high",
  SE: "high",
  Tocantins: "medium",
  TO: "medium",
};

const stateStudentCounts: Record<string, number> = {
  Acre: 1280,
  AC: 1280,
  Alagoas: 4620,
  AL: 4620,
  Amapa: 3180,
  "AmapÃ¡": 3180,
  AP: 3180,
  Amazonas: 2470,
  AM: 2470,
  Bahia: 6820,
  BA: 6820,
  Ceara: 8050,
  "CearÃ¡": 8050,
  CE: 8050,
  "Distrito Federal": 5350,
  DF: 5350,
  "Espirito Santo": 5120,
  "EspÃ­rito Santo": 5120,
  ES: 5120,
  Goias: 6240,
  "GoiÃ¡s": 6240,
  GO: 6240,
  Maranhao: 4760,
  "MaranhÃ£o": 4760,
  MA: 4760,
  "Mato Grosso": 3890,
  MT: 3890,
  "Mato Grosso do Sul": 2940,
  MS: 2940,
  "Minas Gerais": 9130,
  MG: 9130,
  Para: 5660,
  "ParÃ¡": 5660,
  PA: 5660,
  Paraiba: 7210,
  "ParaÃ­ba": 7210,
  PB: 7210,
  Parana: 5980,
  "ParanÃ¡": 5980,
  PR: 5980,
  Pernambuco: 8460,
  PE: 8460,
  Piaui: 4410,
  "PiauÃ­": 4410,
  PI: 4410,
  "Rio de Janeiro": 9280,
  RJ: 9280,
  "Rio Grande do Norte": 7390,
  RN: 7390,
  "Rio Grande do Sul": 6520,
  RS: 6520,
  Rondonia: 2180,
  "RondÃ´nia": 2180,
  RO: 2180,
  Roraima: 3340,
  RR: 3340,
  "Santa Catarina": 6030,
  SC: 6030,
  "Sao Paulo": 10025,
  "SÃ£o Paulo": 10025,
  SP: 10025,
  Sergipe: 7850,
  SE: 7850,
  Tocantins: 4970,
  TO: 4970,
};

function getStateName(properties: Record<string, unknown>) {
  const candidates = [
    properties.name,
    properties.NAME,
    properties.sigla,
    properties.SIGLA,
    properties.uf,
    properties.UF,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }

  return "Estado";
}

function getStateStudentCount(properties: Record<string, unknown>) {
  const candidates = [
    properties.name,
    properties.NAME,
    properties.sigla,
    properties.SIGLA,
    properties.uf,
    properties.UF,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && stateStudentCounts[candidate]) {
      return stateStudentCounts[candidate];
    }
  }

  return 0;
}

function getStateLevel(
  properties: Record<string, unknown>,
  fallbackIndex: number,
): keyof typeof stateLevels {
  const candidates = [
    properties.name,
    properties.NAME,
    properties.sigla,
    properties.SIGLA,
    properties.uf,
    properties.UF,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && stateLevelByName[candidate]) {
      return stateLevelByName[candidate];
    }
  }

  const fallbackLevels: Array<keyof typeof stateLevels> = [
    "low",
    "medium",
    "regular",
    "high",
  ];

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
                <Tooltip formatter={(value) => [`${value} alunos`, "Alunos"]} />
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
                <Tooltip formatter={(value) => [`${value} alunos`, "Alunos"]} />
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
                  <Tooltip formatter={(value) => [`${value}%`, "Participação"]} />
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
