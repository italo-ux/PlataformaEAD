declare module "react-simple-maps" {
  import type { ComponentType, ReactNode } from "react";

  export const ComposableMap: ComponentType<Record<string, unknown>>;
  export const Geographies: ComponentType<{
    geography: unknown;
    children: (props: { geographies: any[] }) => ReactNode;
  }>;
  export const Geography: ComponentType<Record<string, unknown>>;
}
