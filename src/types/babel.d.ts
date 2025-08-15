// Babel相关类型声明
declare module '@babel/core' {
  export function transform(code: string, options?: any): any;
  export function transformSync(code: string, options?: any): any;
  export function transformAsync(code: string, options?: any): Promise<any>;
}

declare module '@babel/preset-env' {
  const preset: any;
  export default preset;
}

declare module '@babel/preset-typescript' {
  const preset: any;
  export default preset;
}

declare module '@babel/plugin-transform-runtime' {
  const plugin: any;
  export default plugin;
}

declare module 'babel-plugin-transform-remove-console' {
  const plugin: any;
  export default plugin;
}
