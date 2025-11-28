import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 增加 library 打包配置
  build: {
    lib: {
      entry: 'lib/index.js',
      name: 'HupuH5SDK',
      fileName: (format) => {
        if (format === 'es') return 'index.js'
        if (format === 'cjs') return 'index.cjs'
        return `index.${format}.js`
      },
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      // 外部化依赖，避免把 react 打进包里
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    // 确保构建时清空输出目录
    emptyOutDir: true,
  },
})

