import {defineConfig, loadEnv} from 'vite'
import vue from '@vitejs/plugin-vue'
import inspect from "vite-plugin-inspect";
import { fileURLToPath, URL } from 'node:url'

function getEnv(env_: any)
{
    let result: Record<string, string> = {};
    for (let key in env_)
    {
        if (!key.startsWith('VITE_APP_SUB_QUIZ_')) continue;
        let value = env_[key];
        key = key.slice('VITE_APP_SUB_QUIZ_'.length).toLowerCase().replace(/_([a-z])/g, (_, p1) => p1.toUpperCase());
        result[key] = value;
    }
    return result;
}

// https://vite.dev/config/
export default defineConfig(({mode}) => ({
    plugins: [vue(), inspect()],
    define: {
        'environment': getEnv(loadEnv(mode, process.cwd())),
    },
    css: {
        preprocessorOptions: {
          scss: {
            additionalData: `
                @use "@/scss/_variables.scss" as *;
                @use "@/scss/_mixins.scss" as *;
            `
          }
        }
      },
      resolve: {
        alias: {
          '@': fileURLToPath(new URL('./src', import.meta.url))
        }
      }
}))
