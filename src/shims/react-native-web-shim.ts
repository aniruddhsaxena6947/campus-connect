export * from 'react-native-web';

export const TurboModuleRegistry = {
  get: () => null,
  getEnforcing: () => ({}),
};

export const codegenNativeComponent = (name: string): unknown => name;

export const codegenNativeCommands = () => ({});

export const requireNativeComponent = (name: string): unknown => name;
