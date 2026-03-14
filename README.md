# Attack Shark X11 GNOME Integration CLI

Resumo

Breve CLI para integrar o driver comunitário do Attack Shark com uma extensão do GNOME Shell: lê nível de bateria e ajusta DPI/polling para o dongle.

Pré-requisitos

- Bun (obrigatório para desenvolvimento, testes e build).
- gnome-extensions (para habilitar/desabilitar extensões).
- Acesso de escrita a ~/.local/share para instalar a extensão localmente.

Nota: os workflows de CI e release do repositório utilizam `bun` para instalar dependências, executar testes e empacotar/publicar pacotes.

Instalação rápida

Recomendado (script):

```bash
./install.sh
```

Fluxo empacotado (build + instalação da extensão local):

```bash
bun run package
```

Esse comando gera os artefatos em `dist/` e, no hook `postpackage`, executa
`scripts/install-extension.sh` para instalar `dist/extension` em
`~/.local/share/gnome-shell/extensions/attack-shark-x11@llucasshenrique`
(ou `${XDG_DATA_HOME}/gnome-shell/extensions/...` quando definido).

Alternativa manual (com Bun):

```bash
# instalar dependências do projeto
bun install

# adicionar dependência do driver (GitHub)
bun add github:HarukaYamamoto0/attack-shark-x11-driver
```

Instalação do Bun

```bash
# instalação rápida (Linux/macOS) - oficial
curl -fsSL https://bun.sh/install | bash

# ou use distribuíções / gerenciadores de pacotes quando disponíveis
```

Aplicar regras udev

O arquivo de regras está em [`cli/udev/99-attack-shark.rules`](cli/udev/99-attack-shark.rules:1). Para copiar e aplicar as regras execute:

```bash
sudo cp cli/udev/99-attack-shark.rules /etc/udev/rules.d/ && sudo udevadm control --reload-rules && sudo udevadm trigger
```

Pode ser necessário reconectar o dispositivo (desconectar/reconectar o dongle) para que a nova permissão seja aplicada.

Recarregar o GNOME Shell após instalar a extensão

- Wayland: faça Log out e depois Log in. O atalho "r" não recarrega o GNOME Shell no Wayland porque o comando de recarga via Alt+F2 não está disponível no compositor Wayland.

- X11: pressione Alt+F2, digite `r` e pressione Enter — isso recarrega o GNOME Shell imediatamente.

Exemplos de uso da CLI (saída JSON esperada)

```bash
# com Bun
bun run ./cli/index.ts battery
# Exemplo de saída esperada:
# {"level": 80}

bun run ./cli/index.ts dpi 1600
# Exemplo de saída esperada:
# {"ok": true}

bun run ./cli/index.ts polling 500
# Exemplo de saída esperada:
# {"ok": true}
```

Arquitetura atual da CLI

O código da CLI foi reorganizado em camadas para facilitar manutenção e testes:

- `cli/index.ts`: orquestração da execução, roteamento de comando e códigos de saída.
- `cli/core/driver.ts`: bootstrap do driver (`Adapter` com fallback para `Wired`).
- `cli/commands/*.ts`: implementação isolada por comando (`battery`, `dpi`, `polling`).
- `cli/parsers/*.ts`: parsing/validação de entrada (DPI e polling).
- `cli/output/*.ts`: serialização JSON, normalização de erros e mapa de exit codes.
- `cli/types/cli.ts`: tipos compartilhados do runtime e dos handlers.

Essa separação mantém `stdout` reservado para JSON e `stderr` para logs internos.

Testes (co-localizados ao código testado)

Os testes foram movidos para junto dos módulos correspondentes:

- `cli/index.spec.ts` para o entrypoint/orquestração.
- `cli/parsers/dpi.spec.ts` para `parseDpiInputToStage`.
- `cli/parsers/polling.spec.ts` para `parsePollingRate`.

Rodar todos os testes:

```bash
bun test
```

Build e artefatos finais

O fluxo de build agora gera dois artefatos com Bun:

- Binário compilado: `dist/attack-shark-cli`
- Bundle ESM: `dist/attack-shark-cli.mjs`

Comandos:

```bash
# limpa dist/
bun run clean

# gera somente binário compilado
bun run build:bin

# gera somente bundle ESM
bun run build:esm

# fluxo completo (clean + binário + ESM)
bun run compile
```

O empacotamento da extensão (`bun run package`) continua copiando o binário compilado para `dist/extension/attack-shark-cli`.

CI / Release

Os workflows do GitHub Actions utilizam Bun:

- Instalação em CI: `bun install --frozen-lockfile`
- Testes e scripts: `bun run <script>`
- Empacotamento: `bun pack`
- Publicação: `bun publish` (utiliza `NPM_TOKEN` para autenticação quando presente)

Como testar a extensão após a instalação

```bash
# Habilitar a extensão instalada localmente
gnome-extensions enable attack-shark-x11@llucasshenrique

# Verificar logs do GNOME Shell em tempo real
journalctl --user -f /usr/bin/gnome-shell
```

- Abra o menu de status (system status area) e verifique se o ícone/label de bateria do dongle aparece.
- Teste ajustes de DPI e polling via interface da extensão e confirme mudanças no dispositivo.

Notas sobre permissões e segurança

- A CLI evita rodar como root; o design pressupõe acesso ao dispositivo via regras udev para não exigir sudo.
- As regras udev permitem acesso sem sudo para o usuário (MODE/GRUPO configurados no arquivo de regras).
- Erros de permissão geram resposta JSON no formato:

```json
{"error":"Permission denied"}
```

Links e referências rápidas

- Regras udev: [`cli/udev/99-attack-shark.rules`](cli/udev/99-attack-shark.rules:1)
- Documentação udev para este projeto: [`cli/udev/README.md`](cli/udev/README.md:1)
- Script de instalação: [`install.sh`](install.sh:1)
