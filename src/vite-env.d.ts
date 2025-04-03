/// <reference types="vite/client" />

interface Environment
{
    version: string;
    androidBackend: string;
    cdn: string;
    backend: string;
    frontend: string;

    webHostname: string;
    androidHostname: string;

    ssoBackend: string;
    ssoFrontend: string;
    ssoServiceId: string;
}

declare var environment: Environment;