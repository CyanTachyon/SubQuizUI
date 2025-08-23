import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import inspect from "vite-plugin-inspect";
import { fileURLToPath, URL } from 'node:url';
import { readFileSync } from 'node:fs';
import vueJSX from '@vitejs/plugin-vue-jsx';
import path from 'node:path';
import babel from 'vite-plugin-babel';

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
        // Babel 插件配置
        babel({
            babelConfig: {
                babelrc: true,
                configFile: false,
                presets: [
                    [
                        '@babel/preset-env', {
                            targets: {
                                chrome: '70',
                                firefox: '65',
                                safari: '12',
                                edge: '79',
                                ios: '12',
                                android: '70'
                            },
                            useBuiltIns: false,
                            modules: false
                        }
                    ],
                    [
                        '@babel/preset-typescript', {
                            allExtensions: true,
                            isTSX: true
                        }
                    ]
                ],
                plugins: [
                    '@babel/plugin-syntax-dynamic-import'
                ]
            },
            filter: /\.(jsx?|tsx?)$/
        }),
    ],
    define: {
        'environment': getEnv(loadEnv(mode, process.cwd())),
    },
    css: {
        preprocessorOptions: {
            scss: {
                additionalData: `
                @use "@src/scss/_variables.scss" as *;
                @use "@src/scss/_mixins.scss" as *;
            `
            }
        }
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src/react_app', import.meta.url)),
            '@src': fileURLToPath(new URL('./src', import.meta.url))
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
