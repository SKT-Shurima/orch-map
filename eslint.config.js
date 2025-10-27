const js = require('@eslint/js');
const typescript = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');
const vue = require('eslint-plugin-vue');
const vueParser = require('vue-eslint-parser');
const importPlugin = require('eslint-plugin-import');

module.exports = [
  // 基础配置
  js.configs.recommended,
  {
    files: ['**/*.{js,ts,tsx,vue}'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parser: typescriptParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        project: ['./tsconfig.json', './examples/tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        Event: 'readonly',
        HTMLElement: 'readonly',
        HTMLCanvasElement: 'readonly',
        HTMLImageElement: 'readonly',
        Element: 'readonly',
        DOMParser: 'readonly',
        btoa: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        NodeJS: 'readonly',
        fetch: 'readonly',
        Image: 'readonly',
        Blob: 'readonly',
        URL: 'readonly',
        structuredClone: 'readonly',
      },
    },
    plugins: {
      import: importPlugin,
      '@typescript-eslint': typescript,
      vue,
    },
    rules: {
      // TypeScript 相关规则
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
          vars: 'all',
          args: 'after-used',
        },
      ],
      'no-unused-vars': 'off', // 使用 TypeScript 版本
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        {
          accessibility: 'explicit',
          overrides: {
            accessors: 'explicit',
            constructors: 'explicit',
          },
        },
      ],

      // 通用 JavaScript 规则
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'import/no-duplicates': 'error',
      'no-unused-expressions': 'error',
      'prefer-template': 'error',
      'object-shorthand': 'error',
      'prefer-arrow-callback': 'error',
      'arrow-spacing': 'error',
      'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],
      'eol-last': 'error',
      'comma-dangle': ['error', 'always-multiline'],
      'no-multi-spaces': 'error',
      // 禁止行尾空格
      'no-trailing-spaces': [
        'error',
        {
          skipBlankLines: false, // 不跳过空行
          ignoreComments: false, // 不忽略注释
        },
      ],

      // 禁止代码块开始和结束大括号内有多余空格
      'block-spacing': ['error', 'always'],

      // 控制逗号前后的空格
      'comma-spacing': [
        'error',
        {
          before: false,
          after: true,
        },
      ],

      // 函数调用括号前禁止空格
      'func-call-spacing': ['error', 'never'],

      // 关键字前后空格 (if/else/for 等)
      'keyword-spacing': [
        'error',
        {
          before: true,
          after: true,
        },
      ],

      // 对象冒号前后空格
      'key-spacing': [
        'error',
        {
          beforeColon: false,
          afterColon: true,
        },
      ],
      quotes: ['error', 'double', { avoidEscape: true }],
      semi: ['error', 'always'],
      indent: ['error', 2, { SwitchCase: 1 }],
      'max-len': [
        'warn',
        {
          code: 120,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
        },
      ],
    },
  },
  // Vue 文件特殊配置
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: typescriptParser,
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'warn',
      'vue/require-default-prop': 'off',
      'vue/require-explicit-emits': 'error',
      'vue/no-unused-vars': 'error',
    },
  },
  // 测试文件配置
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    languageOptions: {
      globals: {
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
  // 配置文件特殊配置
  {
    files: ['*.config.js', '*.config.ts', 'vite.config.*', 'turbo.json'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      'no-console': 'off',
    },
  },
  // 针对类型定义文件的特殊配置
  {
    files: ['**/*.interface.ts', '**/*.types.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off', // 类型定义文件中的导出可能暂时未使用
      'no-unused-vars': 'off',
    },
  },
  // 忽略文件
  {
    ignores: [
      'dist/',
      'build/',
      'node_modules/',
      '*.js',
      '**/*.js',
      'packages/**/scripts/**/*.js',
      '*.d.ts',
      'coverage/',
      '.turbo/',
      'packages/*/dist/',
      'examples/dist/',
    ],
  },
];
