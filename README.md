# Attack Shark X11 GNOME Integration

[![CI](https://github.com/llucasshenrique/attack-shark-gnome-integration/actions/workflows/ci.yml/badge.svg)](https://github.com/llucasshenrique/attack-shark-gnome-integration/actions/workflows/ci.yml)
[![Release](https://github.com/llucasshenrique/attack-shark-gnome-integration/actions/workflows/release.yml/badge.svg)](https://github.com/llucasshenrique/attack-shark-gnome-integration/actions/workflows/release.yml)
[![GNOME 45-49](https://img.shields.io/badge/GNOME-45--49-4A86CF?logo=gnome&logoColor=white)](extension/metadata.json)
[![Bun](https://img.shields.io/badge/Bun-required-F9F1E1?logo=bun&logoColor=000)](https://bun.sh)
[![Linux Packages](https://img.shields.io/badge/packages-deb%20%7C%20rpm-2ea44f)](scripts/package-deb.sh)

CLI para integrar o driver comunitario do Attack Shark X11 ([attack-shark-x11-driver](https://github.com/HarukaYamamoto0/attack-shark-x11-driver)) com uma extensao GNOME Shell.

Funcionalidades principais:

- Ler bateria do dongle (`battery`)
- Alterar DPI (`dpi`)
- Alterar polling rate (`polling`)
- Exibir controles na barra superior do GNOME

## Uso dos utilitarios (usuario final)

### Pre-requisitos de uso

- Linux
- GNOME Shell (para usar a extensao)
- `gnome-extensions` (recomendado para habilitar/desabilitar extensao via CLI)

### Instalacao rapida (CLI + extensao GNOME)

Fluxo recomendado:

```bash
bun install --frozen-lockfile
bun run package
```

Esse fluxo:

- Compila a CLI
- Copia a extensao para `dist/extension`
- Embute `dist/attack-shark-cli` em `dist/extension/attack-shark-cli`
- Instala a extensao localmente via `scripts/install-extension.sh` (hook `postpackage`)

### Instalar e usar somente a CLI

Uso direto com Bun (desenvolvimento/local):

```bash
bun install --frozen-lockfile
bun run ./cli/index.ts battery
bun run ./cli/index.ts dpi 1600
bun run ./cli/index.ts polling 500
```

Saida JSON esperada:

```json
{"level":80}
{"ok":true}
```

Uso de CLI instalada por pacote (`/usr/bin/attack-shark-cli`):

```bash
attack-shark-cli battery
attack-shark-cli dpi 22000
attack-shark-cli polling 1000
```

### Instalar e usar somente a extensao GNOME

Fluxo recomendado (empacota e instala a extensao localmente):

```bash
bun run package
```

Esse fluxo:

- Gera artefatos em `dist/`
- Copia a extensao para `dist/extension`
- Copia `dist/attack-shark-cli` para `dist/extension/attack-shark-cli`
- Executa `scripts/install-extension.sh` no `postpackage`

Instalacao manual da extensao:

```bash
XDG_DATA_HOME="${XDG_DATA_HOME:-$HOME/.local/share}"
mkdir -p "$XDG_DATA_HOME/gnome-shell/extensions/attack-shark-x11@llucasshenrique"
cp -r extension/. "$XDG_DATA_HOME/gnome-shell/extensions/attack-shark-x11@llucasshenrique/"
gnome-extensions enable attack-shark-x11@llucasshenrique
```

### Como usar a extensao GNOME

Depois de habilitar a extensao:

- Abra o menu de status na barra superior
- Veja o nivel de bateria
- Altere DPI e polling diretamente no menu

Log do GNOME Shell:

```bash
journalctl --user -f /usr/bin/gnome-shell
```

### udev e permissoes

Arquivo de regra: [`cli/udev/99-attack-shark.rules`](cli/udev/99-attack-shark.rules)

Aplicar manualmente:

```bash
sudo cp cli/udev/99-attack-shark.rules /etc/udev/rules.d/
sudo udevadm control --reload-rules
sudo udevadm trigger
```

Pode ser necessario reconectar o dongle para aplicar as novas permissoes.

### Recarregar GNOME Shell

- Wayland: fazer logout/login
- X11: `Alt+F2`, digitar `r`, pressionar Enter

## Desenvolvimento

### Pre-requisitos de desenvolvimento

- Bun (obrigatorio para testes, build e empacotamento)

Instalacao do Bun (oficial):

```bash
curl -fsSL https://bun.sh/install | bash
```

### Testes

```bash
bun test
```

### Build local

```bash
bun run compile
./dist/attack-shark-cli battery
```

Artefatos gerados:

- `dist/attack-shark-cli` (binario)
- `dist/attack-shark-cli.mjs` (bundle ESM)

### Empacotamento Linux (.deb/.rpm)

Gerar pacotes:

```bash
bun run package:linux
```

Saida esperada:

- `dist/packages/*.deb`
- `dist/packages/*.rpm`

Instalacao dos pacotes coloca:

- Binario em `/usr/bin/attack-shark-cli`
- Regra udev em `/etc/udev/rules.d/99-attack-shark.rules`

Validar instalacao dos pacotes em containers:

```bash
bun run test:packages:containers
```

Matriz atual de teste: Debian 12, Ubuntu 22.04/24.04, Fedora 41/43 e UBI 9.

### Comandos uteis

```bash
bun run clean
bun run build:bin
bun run build:esm
bun run compile
```

### Arquitetura da CLI

- `cli/index.ts` orquestracao e codigos de saida
- `cli/core/driver.ts` bootstrap do driver
- `cli/commands/*.ts` comandos (`battery`, `dpi`, `polling`)
- `cli/parsers/*.ts` validacao de entrada
- `cli/output/*.ts` serializacao JSON e normalizacao de erros
- `cli/types/cli.ts` tipos compartilhados

## Referencias

- Driver da comunidade utilizado pelo projeto: [`HarukaYamamoto0/attack-shark-x11-driver`](https://github.com/HarukaYamamoto0/attack-shark-x11-driver)
- Regras udev: [`cli/udev/99-attack-shark.rules`](cli/udev/99-attack-shark.rules)
- Documentacao udev: [`cli/udev/README.md`](cli/udev/README.md)
- Instalador da extensao empacotada: [`scripts/install-extension.sh`](scripts/install-extension.sh)
