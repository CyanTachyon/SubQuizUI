import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import inspect from "vite-plugin-inspect";
import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'
import vueJSX from '@vitejs/plugin-vue-jsx'
import path from 'node:path';

const packageJson = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'))

function getEnv(env_: any)
{
    let result: Record<string, string> = {};
    result.version = packageJson.version;
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
export default defineConfig(({ mode }) => ({
    plugins: [
        vue({
            template: {
                compilerOptions: {
                    isCustomElement: (tag) => {
                        return tag.startsWith('quiz-');
                    }
                }
            }
        }), 
        inspect(),
        vueJSX(),
    ],
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
    },
    build: {
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true
            },
            format: {
                comments: false
            }
        },
        rollupOptions: {
            output: {
                manualChunks: {
                    "libs": [
                        'vue',
                        'vue-router',
                        'pinia',
                        '@headlessui/vue',
                        '@heroicons/vue',
                        'ansi_up'
                    ]
                }
            }
        }
    }
}))
