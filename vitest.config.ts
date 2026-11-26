import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // .claude/worktrees contém cópias do repositório; não rodar os testes delas
    exclude: [...configDefaults.exclude, '.claude/**'],
  },
});
