import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import compression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react({
      // Настройки babel для оптимизации
      babel: {
        plugins: process.env.NODE_ENV === 'production' ? [] : [],
      },
    }),
    svgr(),
    // Добавляем сжатие gzip и brotli для статических ресурсов
    compression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
    // Анализатор размера bundle (только в режиме анализа)
    process.env.ANALYZE && visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  
  define: {
    "process.env": {},
    // Оптимизация для production
    __DEV__: process.env.NODE_ENV !== 'production',
  },
  
  server: {
    host: true,
    port: Number(process.env.PORT) || 5173,
    allowedHosts: ["dev.systemcargo.ru", "systemcargo.ru"],
  },

  // Оптимизации сборки
  build: {
    // Включаем минификацию
    minify: 'terser',
    terserOptions: {
      compress: {
        // Удаляем console.log в production
        drop_console: true,
        drop_debugger: true,
        // Более агрессивная оптимизация
        passes: 2,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      mangle: {
        // Сохраняем имена классов для лучшей отладки
        keep_classnames: false,
        keep_fnames: false,
      },
      format: {
        comments: false,
      },
    },
    
    // Настройки chunk splitting для лучшего кеширования
    rollupOptions: {
      output: {
        manualChunks: {
          // Выносим React в отдельный chunk
          'react-vendor': ['react', 'react-dom'],
          // Antd в отдельный chunk
          'antd-vendor': ['antd'],
          // Refine в отдельный chunk  
          'refine-vendor': ['@refinedev/core', '@refinedev/antd'],
          // Dayjs и связанные библиотеки
          'date-vendor': ['dayjs'],
          // Остальные vendor библиотеки
          'vendor': ['lodash', 'axios'],
        },
        // Оптимизируем имена файлов для кеширования
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId 
            ? chunkInfo.facadeModuleId.split('/').pop() 
            : 'chunk';
          return `js/[name]-[hash].js`;
        },
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          let extType = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = 'img';
          } else if (/woff2?|eot|ttf|otf/i.test(extType)) {
            extType = 'fonts';
          }
          return `${extType}/[name]-[hash][extname]`;
        },
      },
    },
    
    // Увеличиваем лимит размера chunk для предупреждений
    chunkSizeWarningLimit: 1000,
    
    // Включаем source maps только для development
    sourcemap: process.env.NODE_ENV === 'development',
    
    // Настройки для CSS
    cssCodeSplit: true,
    cssMinify: true,
  },

  // Оптимизация зависимостей
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'antd',
      '@refinedev/core',
      '@refinedev/antd',
      'dayjs',
    ],
    exclude: [
      // Исключаем heavy dependencies которые лучше загружать динамически
    ],
  },

  // Настройки превью для production тестирования
  preview: {
    port: 4173,
    strictPort: true,
  },

  // Настройки для CSS
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
        modifyVars: {
          // Кастомные переменные Antd для уменьшения размера
          '@primary-color': '#1890ff',
        },
      },
    },
  },

  // Экспериментальные возможности для лучшей производительности
  esbuild: {
    // Дополнительные оптимизации
    legalComments: 'none',
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
    treeShaking: true,
  },
});