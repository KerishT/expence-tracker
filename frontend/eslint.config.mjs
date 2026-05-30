import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

const eslintConfig = [
  {
    ignores: ['.next/**', 'node_modules/**', 'out/**', 'next-env.d.ts'],
  },
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      // Разрешаем намеренно неиспользуемые переменные с префиксом `_`
      // (напр. отбрасывание поля при деструктуризации: `{ terms: _, ...values }`).
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Типичный паттерн загрузки данных (setLoading(true) в начале useEffect)
      // — оставляем предупреждением, а не блокирующей ошибкой.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
];

export default eslintConfig;
