import {
  JSX,
  createContext,
  useContext,
  createMemo,
  Show,
  mergeProps,
} from 'solid-js';
import {
  matchRoute,
  PageRouter,
  RouterParams,
} from './router-node';
import useLocation, { UseLocation, UseLocationOptions } from './use-location';

export interface RouterInstance<P extends RouterParams = RouterParams> extends UseLocation {
  params: P;
}

const LocationContext = createContext<UseLocation>();
const ParamsContext = createContext<RouterParams>();

export interface RouterProps {
  routes: PageRouter;
  fallback?: JSX.Element;
  location?: UseLocationOptions;
}

export default function Router(
  props: RouterProps,
): JSX.Element {
  const location = useLocation(() => props.routes, props.location);

  const matchedRoute = createMemo(() => (
    matchRoute(props.routes, location.pathname)
  ));

  return (
    <LocationContext.Provider value={location}>
      <Show when={matchedRoute()} fallback={props.fallback} keyed>
        {(result) => (
          <ParamsContext.Provider value={result.params}>
            <Show when={result.value} keyed>
              {(Comp) => <Comp />}
            </Show>
          </ParamsContext.Provider>
        )}
      </Show>
    </LocationContext.Provider>
  );
}

export function useRouter<P extends RouterParams>(): RouterInstance<P> {
  const location = useContext(LocationContext);
  const params = useContext(ParamsContext);
  if (location) {
    return mergeProps(location, {
      params: params as P,
    });
  }
  throw new Error('useRouter must be used in a component within <Router>');
}
