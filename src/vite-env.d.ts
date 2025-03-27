/// <reference types="vite/client" />

interface Environment
{
    version: string;
    androidBackend: string;
    androidLatestInfo: string;
    backend: string;
    frontend: string;

    webHostname: string;
    androidHostname: string;

    ssoBackend: string;
    ssoFrontend: string;
    ssoServiceId: string;
}

declare var environment: Environment;