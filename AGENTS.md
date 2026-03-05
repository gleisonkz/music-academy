<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

## Regras de Validação e Execução

**NUNCA assuma informações ambíguas ou incompletas.** Se a solicitação for ambígua ou incompleta, faça 1–3 perguntas direcionadas antes de executar qualquer ação.

- Em caso de ambiguidade: pare e pergunte antes de executar
- Faça perguntas específicas e direcionadas (evite perguntas genéricas)
- Limite a 1–3 perguntas por vez
- Só execute após ter clareza suficiente sobre o que foi solicitado
- Prefira perguntar a assumir e entregar algo errado

**Exemplos de quando perguntar:** múltiplas interpretações possíveis; informações críticas faltando; escolhas de implementação que afetam o resultado; contexto insuficiente para decidir.

*Validar antes de agir economiza tempo, tokens e garante entregas corretas na primeira tentativa.*

## Commit messages

After making code changes (edits, new files, refactors), suggest a commit message that follows the project's conventions (see STYLE_GUIDE.md):

- Format: `<type>(<scope>): <subject>`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`
- Scope: optional (module/component/feature being changed)
- Subject: in English, imperative present, lowercase (e.g. "add X", "fix Y", "remove Z")

Example: `feat(quotations): use brokerName from availableFilters and remove /brokers call`
