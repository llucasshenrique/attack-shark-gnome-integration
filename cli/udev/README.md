Instruções para aplicar regras udev e checar permissões (Linux)

1) Copiar regra para /etc/udev/rules.d/ e recarregar regras

sudo cp ./cli/udev/99-attack-shark.rules /etc/udev/rules.d/99-attack-shark.rules
sudo udevadm control --reload-rules
sudo udevadm trigger

2) Adicionar seu usuário ao grupo plugdev (se ainda não estiver)

sudo usermod -aG plugdev $USER
# faça logout/login ou execute `newgrp plugdev` para ativar a nova group membership

3) Verificar o nó do dispositivo em /dev/bus/usb

# Identifique Bus/Device do dongle (substitua 1d57:fa60 pelo seu vendor:product se diferente)
lsusb -d 1d57:fa60
# saída típica: Bus 001 Device 015: ID 1d57:fa60 ...
# então verifique o nó correspondente (use zeros à esquerda, ex. 001 e 015):
ls -l /dev/bus/usb/001/015

4) Testar CLI (após reconectar o dongle)

# reconecte o dongle e então:
bun run ./index.ts battery

5) Segurança

- MODE="0660" + GROUP="plugdev" é recomendado (menos permissivo que 0666).
- Se não quiser global access, mantenha 0660 e adicione apenas usuários confiáveis ao grupo plugdev.

6) Diagnóstico adicional

# listar dispositivos USB
lsusb
# ver mensagens do kernel ao reconectar (útil para erros)
dmesg --follow

Se quiser, posso gerar o comando pronto para copiar e recarregar as regras no seu sistema; confirme se deseja que eu gere esses comandos.