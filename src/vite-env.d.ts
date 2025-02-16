/// <reference types="vite/client" />

interface Environment
{
    backend: string;
    baseUrl: string;
    ssoBackend: string;
    ssoFrontend: string;
    ssoServiceId: string;
    version: string;
}

declare var environment: Environment;