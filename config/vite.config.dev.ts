import { mergeConfig, loadEnv, defineConfig } from 'vite'; // 引入 loadEnv 和 defineConfig
import eslint from 'vite-plugin-eslint';
import baseConfig from './vite.config.base';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  const apiPrefix = env.VITE_API_BASE_URL;

  const currentConfig = {
    mode: 'development', // 注意：如果是 build 模式，Vite 会自动覆盖这个值，这里写死也没事，但建议删掉让 Vite 自动推断
    server: {
      host: '0.0.0.0',
      open: true,
      fs: {
        strict: true,
      },
      // 3. 动态代理配置
      proxy: {
        [apiPrefix]: {
          target: 'http://localhost:8080',
          changeOrigin: true,
          ws: true,
          rewrite: (path) => path.replace(new RegExp(`^${apiPrefix}`), '')
        },
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
    plugins: [
      eslint({
        cache: false,
        include: ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.vue'],
        exclude: ['node_modules'],
      }),
    ],
  };

  // 3. 合并基础配置并返回
  return mergeConfig(baseConfig, currentConfig);
});
