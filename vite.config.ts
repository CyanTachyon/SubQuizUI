import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import inspect from "vite-plugin-inspect";
import { fileURLToPath, URL } from 'node:url';
import { readFileSync } from 'node:fs';
import vueJSX from '@vitejs/plugin-vue-jsx';
import path from 'node:path';
import obfuscatorPlugin from "vite-plugin-javascript-obfuscator";

const packageJson = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'));

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


export default defineConfig(({ mode }) => ({
    plugins: [
        vue({
            template: {
                compilerOptions: {
                    isCustomElement: (tag) =>
                    {
                        return tag.startsWith('quiz-');
                    }
                }
            }
        }),
        inspect(),
        vueJSX(),
        obfuscatorPlugin({
            options: {
                compact: true,
                controlFlowFlattening: false,
                deadCodeInjection: false,
                deadCodeInjectionThreshold: 0.4,
                debugProtection: true,
                disableConsoleOutput: true,
                identifierNamesGenerator: 'mangled',
                identifiersPrefix: "",
                log: false,
                renameGlobals: true,
                rotateStringArray: false,
                selfDefending: false,
                shuffleStringArray: false,
                splitStrings: false,
                splitStringsChunkLength: 10,
                stringArray: false,
                stringArrayThreshold: 0.75,
                transformObjectKeys: true,
                unicodeEscapeSequence: false,
                reservedNames: [],
                reservedStrings: [],
                renameProperties: true,
                ignoreKeys: [],
            },
        })
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
                        '@headlessui/vue',
                        '@heroicons/vue',
                        'ansi_up',
                        'katex',
                        'mathjax',
                        '@capacitor-community/file-opener',
                        '@capacitor/app',
                        '@capacitor/browser',
                        '@capacitor/core',
                        '@capacitor/device',
                        '@capacitor/filesystem',
                        'marked',
                        'spark-md5',
                        'hast-util-to-html',
                    ],
                    "libs-starry-night": [
                        '@wooorm/starry-night',
                    ]
                }
            }
        }
    }
}));
