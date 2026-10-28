import { useMemo, useState, type CSSProperties } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import type { GeoJsonObject } from "geojson";
import type { UfDistributionItem } from "../../types/dashboard";
import brazilGeoJson from "../../data/brazil-states.json";

interface BrazilMapProps {
  data: UfDistributionItem[];
  selectedUf?: string;
  onUfClick: (uf: string) => void;
  loading?: boolean;
}

// 5 faixas calibradas com dados reais (distribuição nacional sem filtros)
const LEGEND_THRESHOLDS = [
  { min: 0, max: 10, label: "0 – 10" },
  { min: 11, max: 30, label: "11 – 30" },
  { min: 31, max: 60, label: "31 – 60" },
  { min: 61, max: 150, label: "61 – 150" },
  { min: 151, max: Infinity, label: "151+" },
];

const LEGEND_COLORS = [
  "#dbeafe",
  "#93c5fd",
  "#60a5fa",
  "#3b82f6",
  "#1e40af",
];

function getColorForThreshold(value: number): string {
  const index = LEGEND_THRESHOLDS.findIndex((t) => value >= t.min && value <= t.max);
  return index >= 0 ? LEGEND_COLORS[index] : LEGEND_COLORS[0];
}

interface TooltipData {
  uf: string;
  nome: string;
  alunos: number;
  participacao: number;
  ranking: number;
}

export function BrazilMap({
  data,
  selectedUf,
  onUfClick,
  loading,
}: BrazilMapProps) {
  const [hoveredUf, setHoveredUf] = useState<TooltipData | null>(null);

  const ufDataMap = useMemo(
    () => new Map(data.map((d) => [d.uf, d])),
    [data],
  );

  const sortedUfs = useMemo(
    () => [...data].sort((a, b) => b.alunos - a.alunos),
    [data],
  );

  const rankingMap = useMemo(
    () => new Map(sortedUfs.map((d, i) => [d.uf, i + 1])),
    [sortedUfs],
  );

  if (loading) {
    return (
      <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="aspect-square bg-slate-50 animate-pulse rounded-xl" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-blue-100 bg-white shadow-sm overflow-hidden">
      {/* Título do mapa */}
      <div className="px-4 py-3 border-b border-blue-100 bg-blue-50">
        <h3 className="font-semibold text-[#25304a]">Alunos por UF</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Distribuição geográfica dos alunos cadastrados. Clique em um estado para filtrar.
        </p>
      </div>

      <div className="relative aspect-square max-w-full overflow-hidden p-4">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            center: [-51.9253, -14.235],
            scale: 650,
          }}
          style={{
            width: "100%",
            height: "100%",
          }}
        >
          <ZoomableGroup
            center={[-51.9253, -14.235]}
            zoom={1}
            minZoom={1}
            maxZoom={8}
            style={{ width: "100%", height: "100%" }}
          >
            <Geographies geography={brazilGeoJson as unknown as GeoJsonObject}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const uf = typeof geo.properties?.sigla === "string" ? geo.properties.sigla : "";
                  const ufData = ufDataMap.get(uf);
                  const alunos = ufData?.alunos ?? 0;
                  const participacao = ufData?.participacao ?? 0;
                  const isSelected = selectedUf === uf;
                  const color = getColorForThreshold(alunos);
                  const ranking = rankingMap.get(uf) ?? 0;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={() => uf && onUfClick(uf)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Filtrar por ${ufData?.nome ?? uf}`}
                      onKeyDown={(event) => {
                        if ((event.key === "Enter" || event.key === " ") && uf) {
                          event.preventDefault();
                          onUfClick(uf);
                        }
                      }}
                      onMouseEnter={() =>
                        ufData && setHoveredUf({
                          uf: uf!,
                          nome: ufData.nome ?? uf!,
                          alunos,
                          participacao,
                          ranking,
                        })
                      }
                      onMouseLeave={() => setHoveredUf(null)}
                      className="dashboard-map-geography"
                      style={{
                        "--state-fill": color,
                        "--state-stroke": isSelected ? "#1e3a8a" : "#fff",
                        "--state-stroke-width": isSelected ? 3 : 0.5,
                        filter: isSelected ? "drop-shadow(0 0 4px rgba(30, 58, 138, 0.5))" : "none",
                      } as CSSProperties}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        {/* Tooltip customizado no hover */}
        {hoveredUf && (
          <div
            className="absolute z-10 px-3 py-2 bg-white border border-slate-200 rounded-lg shadow-lg text-xs"
            style={{
              left: "16px",
              bottom: "16px",
              maxWidth: "220px",
            }}
          >
            <div className="font-semibold text-[#25304a]">{hoveredUf.nome} ({hoveredUf.uf})</div>
            <div className="text-slate-600 mt-1">{hoveredUf.alunos.toLocaleString("pt-BR")} alunos</div>
            <div className="text-slate-600">{hoveredUf.participacao.toFixed(2)}% do total</div>
            <div className="text-slate-600">Ranking: #{hoveredUf.ranking}</div>
          </div>
        )}

        {/* Legenda gradiente contínua (referência visual) */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-white/90 backdrop-blur p-3 rounded-lg shadow">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-medium text-slate-600">Menos alunos</span>
              <span className="text-xs font-medium text-slate-600">Mais alunos</span>
            </div>
            <div className="h-2 rounded-full bg-gradient-to-r from-blue-100 via-blue-300 via-blue-500 to-blue-800" />
          </div>
        </div>

        {/* Badge de filtro ativo + botão limpar */}
        {selectedUf && (
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg shadow">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              Filtrando: {selectedUf}
            </span>
            <button
              onClick={() => onUfClick("")}
              className="inline-flex items-center gap-1 rounded-lg bg-white/90 backdrop-blur px-3 py-1.5 text-sm font-medium text-slate-700 shadow transition hover:bg-white"
            >
              Limpar
            </button>
          </div>
        )}
      </div>

      {/* Legenda 5 faixas fixas */}
      <div className="px-4 pb-4 border-t border-blue-100 bg-white">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {LEGEND_THRESHOLDS.map((threshold, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <div
                className="h-3 w-8 rounded border border-slate-200"
                style={{ backgroundColor: LEGEND_COLORS[index] }}
              />
              <span className="font-medium text-slate-700">{threshold.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default BrazilMap;
