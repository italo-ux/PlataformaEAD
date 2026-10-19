declare module "react-simple-maps" {
  import type { ComponentType, ReactNode, SVGProps } from "react";

  export interface GeographyDatum {
    rsmKey: string;
    properties: {
      sigla?: string;
      nome?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }

  export interface ComposableMapProps {
    projection?: string;
    projectionConfig?: Record<string, unknown>;
    width?: number;
    height?: number;
    style?: React.CSSProperties;
    children?: ReactNode;
  }

  export interface GeographiesProps {
    geography: GeoJsonObject;
    children: (props: { geographies: GeographyDatum[] }) => ReactNode;
  }

  export interface GeographyProps extends SVGProps<SVGPathElement> {
    geography: GeographyDatum;
    onClick?: () => void;
    style?: {
      default?: Record<string, unknown>;
      hover?: Record<string, unknown>;
      pressed?: Record<string, unknown>;
    };
  }

  export interface ZoomableGroupProps {
    center?: number[];
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    style?: React.CSSProperties;
    children?: ReactNode;
  }

  export interface GeoJsonObject {
    type: "FeatureCollection" | "Feature";
    features: Array<{
      type: "Feature";
      properties: Record<string, unknown>;
      geometry: {
        type: string;
        coordinates: unknown;
      };
    }>;
  }

  export const ComposableMap: ComponentType<ComposableMapProps>;
  export const Geographies: ComponentType<GeographiesProps>;
  export const Geography: ComponentType<GeographyProps>;
  export const ZoomableGroup: ComponentType<ZoomableGroupProps>;
  export const Graticule: ComponentType<Record<string, unknown>>;
  export const Line: ComponentType<Record<string, unknown>>;
  export const Marker: ComponentType<Record<string, unknown>>;
  export const Sphere: ComponentType<Record<string, unknown>>;
  export const Annotation: ComponentType<Record<string, unknown>>;
}

declare module "*.geojson" {
  import type { GeoJsonObject } from "react-simple-maps";
  const value: GeoJsonObject;
  export default value;
}