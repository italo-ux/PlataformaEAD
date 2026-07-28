declare module "react-simple-maps" {
  import type { ComponentType, ReactNode } from "react";

  export interface GeographyDatum {
    rsmKey: string;
    properties: Record<string, unknown>;
    [key: string]: unknown;
  }

  export const ComposableMap: ComponentType<Record<string, unknown>>;
  export const Geographies: ComponentType<{
    geography: unknown;
    children: (props: { geographies: GeographyDatum[] }) => ReactNode;
  }>;
  export const Geography: ComponentType<{
    geography: GeographyDatum;
    [key: string]: unknown;
  }>;
}
