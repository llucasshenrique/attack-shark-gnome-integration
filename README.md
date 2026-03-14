# Attack Shark X11 GNOME Integration CLI

Resumo

Breve CLI para integrar o driver comunitário do Attack Shark com uma extensão do GNOME Shell: lê nível de bateria e ajusta DPI/polling para o dongle.

Pré-requisitos

- Bun ou Node.js (com npx/ts-node).
- gnome-extensions (para habilitar/desabilitar extensões).
- Acesso de escrita a ~/.local/share para instalar a extensão localmente.

Instalação rápida

Recomendado (script):

```bash
./install.sh
```

Alternativa manual:

```bash
# instalar dependências do projeto
bun install        # ou
npm install

# adicionar dependência do driver (GitHub)
bun add github:HarukaYamamoto0/attack-shark-x11-driver
# alternativa npm
npm install github:HarukaYamamoto0/attack-shark-x11-driver
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

Alternativa para Node.js (ts-node via npx):

```bash
npx ts-node ./cli/index.ts battery
npx ts-node ./cli/index.ts dpi 1600
npx ts-node ./cli/index.ts polling 500
```

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
