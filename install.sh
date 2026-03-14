#!/bin/sh
# install.sh - Instala o CLI e a extensão GNOME para Attack Shark X11
# Pré-requisitos: bun ou node/npm (para instalar dependências), acesso ao diretório ~/.local/share,
# (opcional) gnome-extensions para habilitar a extensão automaticamente.
# Este script é idempotente: pode ser executado várias vezes sem efeitos colaterais indesejados.

set -eu

info() { printf "[INFO] %s\n" "$*"; }
warn() { printf "[WARN] %s\n" "$*"; }
err() { printf "[ERROR] %s\n" "$*" 1>&2; }

# Detectar runner: bun preferido, fallback para npm (requer node)
RUNNER=""
if command -v bun >/dev/null 2>&1; then
  RUNNER="bun"
  INSTALL_CMD="bun install"
elif command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
  RUNNER="npm"
  INSTALL_CMD="npm install --no-audit --no-fund"
else
  err "Nem 'bun' nem 'node/npm' encontrados. Instale bun ou node/npm e rode este script novamente."
  exit 2
fi

info "Usando runner: $RUNNER"

# Instalar dependências (idempotente)
info "Instalando dependências com: $INSTALL_CMD"
if [ "$RUNNER" = "bun" ]; then
  if ! bun install; then
    err "Falha ao executar 'bun install'. Verifique sua instalação do bun."
    exit 3
  fi
else
  if ! npm install --no-audit --no-fund; then
    err "Falha ao executar 'npm install'. Verifique sua instalação do npm."
    exit 4
  fi
fi

# Criar shim executável em ./bin/asx11-cli
BIN_DIR="./bin"
SHIM="$BIN_DIR/asx11-cli"
info "Criando shim do CLI em $SHIM"
mkdir -p "$BIN_DIR"
cat > "$SHIM" <<'SHIMEOF'
#!/bin/sh
# Shim gerado por install.sh. Decide em tempo de execução entre bun e node.
if command -v bun >/dev/null 2>&1; then
  exec bun run -- ./cli/index.ts "$@"
elif command -v node >/dev/null 2>&1; then
  # Se houver um build para JS, tentamos executar; caso contrário, instruímos o usuário.
  if [ -f "./cli/index.js" ]; then
    exec node ./cli/index.js "$@"
  else
    exec node -e 'console.error("Nenhum bun encontrado e não existe ./cli/index.js. Rode com bun ou construa o JS."); process.exit(127)'
  fi
else
  echo "Nenhum runtime (bun ou node) disponível." 1>&2
  exit 127
fi
SHIMEOF

chmod +x "$SHIM"
info "Shim criado e marcado como executável. Use './bin/asx11-cli' ou adicione ./bin ao seu PATH."

# Instalar a extensão GNOME
XDG_DATA_HOME="${XDG_DATA_HOME:-$HOME/.local/share}"
EXT_BASE="$XDG_DATA_HOME/gnome-shell/extensions"
EXT_UUID="attack-shark-x11@llucasshenrique"
EXT_TARGET="$EXT_BASE/$EXT_UUID"

info "Copiando extensão para: $EXT_TARGET"
mkdir -p "$EXT_BASE"
# Copiar de forma idempotente: copiar para um diretório temporário e mover
TMP_TARGET="$EXT_TARGET.tmp"
rm -rf "$TMP_TARGET"
mkdir -p "$TMP_TARGET"
if ! cp -a extension/. "$TMP_TARGET/" 2>/dev/null; then
  # fallback para cp -r se cp -a não disponível
  cp -r extension/. "$TMP_TARGET/"
fi
# Substituir atomically
rm -rf "$EXT_TARGET"
mv "$TMP_TARGET" "$EXT_TARGET"

# Ajustar permissões: garantir leitura para todos e execução para diretórios/scripts quando aplicável
info "Ajustando permissões na extensão instalada"
# Permitir leitura e execução de diretórios; leitura de arquivos
chmod -R u+rwX,go+rX "$EXT_TARGET" || warn "chmod falhou; verifique permissões manualmente"
# Tornar scripts .sh executáveis (se existirem)
find "$EXT_TARGET" -type f -name "*.sh" -exec chmod +x {} \; 2>/dev/null || true

# Tentar habilitar a extensão com gnome-extensions, se disponível
if command -v gnome-extensions >/dev/null 2>&1; then
  info "Tentando habilitar a extensão via 'gnome-extensions'"
  if gnome-extensions enable "$EXT_UUID"; then
    info "Extensão habilitada: $EXT_UUID"
  else
    warn "Falha ao habilitar extensão com 'gnome-extensions'. Você pode habilitar manualmente com: gnome-extensions enable $EXT_UUID"
  fi
else
  warn "Comando 'gnome-extensions' não encontrado. Instale-o (ex.: package gnome-shell-extensions) ou habilite manualmente: gnome-extensions enable $EXT_UUID"
fi

# Mensagem final de instruções
cat <<EOF
Instalação concluída com status de saída 0.
Para recarregar o GNOME Shell:
 - Wayland: saia e entre na sessão
 - X11: pressione Alt+F2, digite 'r' e pressione Enter

Testes rápidos (exemplos):
 - ./bin/asx11-cli battery
 - bun run ./cli/index.ts battery

Observações:
 - Este script não usa sudo. Se alguma etapa requer permissões elevadas, execute os comandos indicados manualmente com sudo.
 - Para tornar o comando global, adicione './bin' ao seu PATH ou mova './bin/asx11-cli' para um diretório em seu PATH.
EOF

exit 0
