/// <reference types="vite/client" />

interface Environment
{
    version: string;
    cdn: string;
    backend: string;
    frontend: string;

    ssoBackend: string;
    ssoFrontend: string;
    ssoServiceId: string;
}

declare var environment: Environment;

// declare module "*.vue" {
//   import type { DefineComponent } from "vue"
//   const component: DefineComponent<{}, {}, any>
//   export default component
// }