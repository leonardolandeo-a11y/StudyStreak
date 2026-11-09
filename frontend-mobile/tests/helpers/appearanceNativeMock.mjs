import React from 'react';
export const controls = new Map();
export const Platform = { OS: 'ios' };
const flatten = style => Object.assign({}, ...(Array.isArray(style) ? style.flat(Infinity) : [style]).filter(Boolean));
export const StyleSheet = { create: value => value, flatten };
function propsFor(props) {
  const style = flatten(props.style);
  if (Array.isArray(style.transform)) style.transform = style.transform.flatMap(item =>
    Object.entries(item).map(([name, value]) => `${name}(${value})`)).join(' ');
  return { style, role: props.accessibilityRole,
    'aria-valuemin': props['aria-valuemin'], 'aria-valuemax': props['aria-valuemax'], 'aria-valuenow': props['aria-valuenow'],
    'data-testid': props.testID, 'aria-modal': props.accessibilityViewIsModal || undefined,
    'aria-label': props.accessibilityLabel, 'aria-selected': props.accessibilityState?.selected,
    'aria-busy': props.accessibilityState?.busy, 'aria-live': props.accessibilityLiveRegion };
}
export function View(props) { return React.createElement('div', { ...propsFor(props), 'data-edges': props.edges?.join(',') }, props.children); }
export const SafeAreaView = View;
export const ScrollView = View;
export const KeyboardAvoidingView = View;
export function useWindowDimensions() { return { width: 390, height: 844, scale: 1, fontScale: 1 }; }
export function Text(props) { return React.createElement('span', propsFor(props), props.children); }
export function Pressable(props) {
  controls.set(props.accessibilityLabel, props);
  return React.createElement('button', { ...propsFor({ ...props, style: typeof props.style === 'function' ? props.style({ pressed: false }) : props.style }),
    disabled: props.disabled, type: 'button' }, props.children);
}
export function TextInput(props) {
  controls.set(props.accessibilityLabel, props);
  return React.createElement('input', { ...propsFor(props), type: props.secureTextEntry ? 'password' : 'text',
    placeholder: props.placeholder, defaultValue: props.value, disabled: props.editable === false });
}
export function Switch(props) {
  controls.set(props.accessibilityLabel, props);
  return React.createElement('input', { 'aria-label': props.accessibilityLabel, type: 'checkbox', checked: props.value, readOnly: true });
}
export function ActivityIndicator(props) { return React.createElement('span', { 'aria-label': props.accessibilityLabel ?? 'Loading', 'data-color': props.color }); }
export const AppState = { currentState: 'active', addEventListener: () => ({ remove() {} }) };
export const Keyboard = { addListener: () => ({ remove() {} }) };
export const BackHandler = { addEventListener: () => ({ remove() {} }) };
export const RefreshControl = () => null;
export function Modal({ visible, children }) { return visible ? React.createElement('div', { role: 'dialog' }, children) : null; }
class AnimatedValue {
  constructor(value) { this.value = value; }
  interpolate({ outputRange }) { return outputRange[0]; }
  setValue(value) { this.value = value; }
  stopAnimation() {}
}
export const Animated = { Value: AnimatedValue, View,
  timing: () => ({ start() {}, stop() {} }), sequence: () => ({ start() {}, stop() {} }) };
export function Image(props) { return React.createElement('img', { alt: props.accessibilityLabel, src: props.source.uri, style: props.style }); }

export const totalMemory = 4 * 1024 ** 3;
export const Easing = { ease: value => value, inOut: value => value };
