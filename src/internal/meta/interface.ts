export interface MetaData {
  tag: string;
  attributes?: Record<string, string | boolean | undefined>;
  content?: string;
}

export interface ViewportMeta {
  width?: number | 'device-width';
  height?: number | 'device-height';
  ['initial-scale']?: number | string;
  ['maximum-scale']?: number | string;
  ['minimum-scale']?: number | string;
  ['user-scalable']?: 'yes' | 'no';
  ['viewport-fit']?: 'auto' | 'contain' | 'cover';
}

export interface OpenGraphMeta {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
}

export type RobotsMetaValues =
  | 'index'
  | 'noindex'
  | 'follow'
  | 'nofollow'
  | 'all'
  | 'none'
  | 'noarchive'
  | 'nosnippet'
  | 'noimageindex'
  | 'nocache';

export type RobotsMeta = {
  [key in RobotsMetaValues]?: string;
} | RobotsMetaValues[];

export interface Meta {
  title?: string;
  description?: string;
  viewport?: ViewportMeta;
  themeColor?: string;
  colorScheme?: 'normal' | 'light' | 'dark' | 'dark light' | 'light dark' | 'only light';
  openGraph?: OpenGraphMeta;
  robots?: RobotsMeta;
  others?: MetaData[];
}
