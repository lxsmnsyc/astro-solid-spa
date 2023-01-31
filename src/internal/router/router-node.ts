import { Component, JSX } from 'solid-js';
import { Meta } from '../meta/interface';

export interface RouterParams {
  [key: string]: string | string[];
}

export interface RouterNode<T> {
  key: string;
  value?: T;
  normal: RouterNode<T>[];
  glob?: RouterNode<T>;
  named?: RouterNode<T>;
}

export function createRouterNode<T>(key: string, value?: T): RouterNode<T> {
  return {
    key,
    value,
    normal: [],
  };
}

function addToChildren<T>(
  children: RouterNode<T>[],
  key: string,
  value?: T,
): RouterNode<T> {
  const node = createRouterNode(key, value);
  children.push(node);
  return node;
}

export function addRoute<T>(
  parent: RouterNode<T>,
  [lead, ...names]: string[],
  value: T,
): void {
  function addRouteToChildren(children: RouterNode<T>[]) {
    for (let i = 0, len = children.length; i < len; i += 1) {
      const child = children[i];

      if (child.key === lead) {
        if (names.length > 0) {
          addRoute(child, names, value);
          return;
        }
        throw new Error(`
Duplicate router path detected.

Received: '${child.key}'
`);
      }
    }

    const node = addToChildren(children, lead);

    if (names.length > 0) {
      addRoute(node, names, value);
    } else {
      node.key = lead;
      node.value = value;
    }
  }

  if (lead.startsWith('[')) {
    if (lead.endsWith(']')) {
      if (lead.startsWith('[...')) {
        if (parent.glob) {
          throw new Error(`
Shared router path detected.

Received: '${lead}'
Existing: '${parent.glob.key}'
          `);
        }
        parent.glob = createRouterNode(lead, value);
        return;
      }
      if (parent.named) {
        if (lead !== parent.named.key) {
          throw new Error(`
Shared router path detected.

Received: '${lead}'
Existing: '${parent.named.key}'
          `);
        }
      } else {
        parent.named = createRouterNode(lead);
      }
      if (names.length > 0) {
        addRoute(parent.named, names, value);
      } else {
        parent.named.value = value;
      }
      return;
    }
    throw new Error(`
Invalid router path detected

Received: '${lead}'
`);
  }
  addRouteToChildren(parent.normal);
}

export interface RouterResult<T, P extends RouterParams = RouterParams> {
  value?: T;
  params: P;
}

function matchRouteInternal<T, P extends RouterParams = RouterParams>(
  parent: RouterNode<T>,
  [lead, ...names]: string[],
  params: P = {} as P,
): RouterResult<T, P> | undefined {
  // Find first if the lead exists in the normal children
  for (let i = 0, len = parent.normal.length; i < len; i += 1) {
    const child = parent.normal[i];

    if (child.key === lead) {
      if (names.length > 0) {
        const matched = matchRouteInternal(child, names, {
          ...params,
        });

        if (matched) {
          return matched;
        }
      } else {
        return {
          value: child.value,
          params: {
            ...params,
          },
        };
      }
    }
  }

  // Check if the parent has a named parameter
  if (parent.named) {
    if (names.length > 0) {
      const namedKey = parent.named.key;
      const paramKey = namedKey.substring(1, namedKey.length - 1);
      const matched = matchRouteInternal(parent.named, names, {
        ...params,
        [paramKey]: lead,
      });

      if (matched) {
        return matched;
      }
    } else {
      const namedKey = parent.named.key;
      const paramKey = namedKey.substring(1, namedKey.length - 1);
      return {
        value: parent.named.value,
        params: {
          ...params,
          [paramKey]: lead,
        },
      };
    }
  }

  if (parent.glob) {
    const globKey = parent.glob.key;
    const paramKey = globKey.substring(4, globKey.length - 1);
    return {
      value: parent.glob.value,
      params: {
        ...params,
        [paramKey]: [lead, ...names],
      },
    };
  }
  return undefined;
}

export function matchRoute<T, P extends RouterParams = RouterParams>(
  parent: RouterNode<T>,
  route: string,
): RouterResult<T, P> | undefined {
  return matchRouteInternal(parent, route.split('/'));
}

export interface Route<T> {
  path: string;
  value: T;
}

export function createRouterTree<T>(routes: Route<T>[]): RouterNode<T> {
  const root = createRouterNode<T>('');

  for (let i = 0, len = routes.length; i < len; i += 1) {
    const route = routes[i];
    addRoute(root, route.path.split('/'), route.value);
  }

  return root;
}

export interface Page<T> {
  (props: T): JSX.Element;
  preload?: () => Promise<void>;
}

export type PageRoute = Route<Page<any>>;
export type PageRouter = RouterNode<Page<any>>;

export interface SuccessResult<T> {
  props: T;
  meta?: Meta;
}

export interface NotFoundResult {
  notFound: true;
}

export interface RedirectResult {
  redirect: string;
}

export type LoadResult<T> =
  | SuccessResult<T>
  | NotFoundResult
  | RedirectResult;

export type Load = <T, P extends RouterParams>(
  request: Request,
  params: P,
) => (Promise<LoadResult<T>>);
export type LoadRoute = Route<Load>;
export type LoadRouter = RouterNode<Load>;

export interface SSRPage {
  default: Component<any>;
  load?: Load;
}
