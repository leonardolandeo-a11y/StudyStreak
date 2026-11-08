import React from 'react';
export const history = ['/(app)/home'];
export let segments = ['(app)', 'home'];
export const screenOptions = [];
export const router = {
  navigate(path) { if (history.at(-1) !== path) history.push(path); segments = ['(app)', path.split('/').at(-1)]; },
  push(path) { history.push(path); segments = ['(app)', path.split('/').at(-1)]; },
  replace(path) { history[history.length - 1] = path; segments = ['(app)', path.split('/').at(-1)]; },
  back() { if (history.length > 1) history.pop(); segments = ['(app)', history.at(-1).split('/').at(-1)]; },
};
export function useSegments() { return segments; }
export function useLocalSearchParams() { return {}; }
export function useFocusEffect() {}
export function Redirect({ href }) { return React.createElement('span', { 'data-redirect': href }); }
export const Tabs = Stack;
export function Link(props) { return React.createElement('a', { href: props.href, style: props.style }, props.children); }
export function Stack({ children, screenOptions: options }) {
  screenOptions.push(options);
  return React.createElement('div', null, options.headerRight?.(), children);
}
Stack.Screen = function Screen({ name, options }) {
  const resolved = typeof options === 'function' ? options({ navigation: { canGoBack: () => history.length > 1 } }) : options;
  return React.createElement('div', { 'data-screen': name, 'data-title': resolved?.title }, resolved?.headerLeft?.());
};
