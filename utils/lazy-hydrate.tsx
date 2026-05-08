import { lazy, Suspense, ComponentType, createElement } from 'react';

export function LazyHydrate<T extends Record<string, any>>(
  loader: () => Promise<{ default: ComponentType<T> }>,
  Fallback: ComponentType = () => createElement('div', { className: 'dtp-skeleton', 'aria-busy': 'true' }, 'Loading...')
) {
  const Component = lazy(loader);
  return function LazyWrapper(props: T) {
    return createElement(Suspense, { fallback: createElement(Fallback) }, createElement(Component, props as any));
  };
}
