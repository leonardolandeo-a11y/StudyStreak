#!/usr/bin/env python3
"""Generate development-only secrets/config without overwriting existing credentials."""
from pathlib import Path
import secrets
import os
root = Path(__file__).resolve().parents[1]
folder = root / '.local'
folder.mkdir(mode=0o700, exist_ok=True)
config = folder / 'livekit.yaml'
env = root / '.env.livekit'
if config.exists() or env.exists():
    raise SystemExit('Existing LiveKit configuration found; refusing to overwrite secrets.')
key, secret = 'SS' + secrets.token_hex(12), secrets.token_hex(32)
for path, text in [(env, f'LIVEKIT_ENABLED=true\nLIVEKIT_URL=ws://localhost:7880\nLIVEKIT_INTERNAL_URL=http://livekit:7880\nLIVEKIT_API_KEY={key}\nLIVEKIT_API_SECRET={secret}\n'), (config, f'port: 7880\nbind_addresses: ["0.0.0.0"]\nrtc:\n  tcp_port: 7881\n  udp_port: 7882\n  node_ip: 127.0.0.1\n  use_external_ip: false\nkeys:\n  {key}: {secret}\nroom:\n  auto_create: true\n  empty_timeout: 60\n  departure_timeout: 20\n')]:
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'w') as output:
        output.write(text)
print('Created .env.livekit and .local/livekit.yaml (permissions 0600). Local desktop only; see docs/livekit.md.')
