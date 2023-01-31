import { LoadResult } from '../router';
import { MetaData } from './interface';

export default function resolveMeta<T>(source: LoadResult<T>): MetaData[] {
  let result: MetaData[] = [];

  if (source.meta) {
    if (source.meta.viewport) {
      const flags: string[] = [];
      for (const [key, value] of Object.entries(source.meta.viewport)) {
        flags.push(`${key}=${value as string}`);
      }
      result.push({
        tag: 'meta',
        attributes: {
          name: 'viewport',
          content: flags.join(', '),
        },
      });
    }
    if (source.meta.title) {
      result.push({ tag: 'title', content: source.meta.title });
    }
    if (source.meta.description) {
      result.push({
        tag: 'meta',
        attributes: {
          name: 'description',
          content: source.meta.description,
        },
      });
    }
    if (source.meta.themeColor) {
      result.push({
        tag: 'meta',
        attributes: {
          name: 'theme-color',
          content: source.meta.themeColor,
        },
      });
    }
    if (source.meta.colorScheme) {
      result.push({
        tag: 'meta',
        attributes: {
          name: 'color-scheme',
          content: source.meta.colorScheme,
        },
      });
    }

    // Open Graph
    const ogTitle = source.meta.openGraph?.title ?? source.meta.title;
    if (ogTitle) {
      result.push({
        tag: 'meta',
        attributes: {
          name: 'og:title',
          content: ogTitle,
        },
      });
    }
    const ogDescription = source.meta.openGraph?.description ?? source.meta.description;
    if (ogDescription) {
      result.push({
        tag: 'meta',
        attributes: {
          name: 'og:description',
          content: ogDescription,
        },
      });
    }

    // Robots
    if (source.meta.robots) {
      let flags: string[] = [];

      if (Array.isArray(source.meta.robots)) {
        flags = source.meta.robots;
      } else {
        for (const [key, value] of Object.entries(source.meta.robots)) {
          if (value) {
            flags.push(key);
          }
        }
      }

      result.push({
        tag: 'meta',
        attributes: {
          name: 'robots',
          content: flags.join(', '),
        },
      });
    }

    if (source.meta.others) {
      result = result.concat(source.meta.others);
    }
  }

  return result;
}
