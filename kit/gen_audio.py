#!/usr/bin/env python3
import json, os, sys, urllib.request
ROOT = os.path.dirname(os.path.abspath(__file__)); A = os.path.join(ROOT, 'audio'); os.makedirs(A, exist_ok=True)
key = next(l.strip().split('=', 1)[1] for l in open(os.path.join(ROOT, '.env')) if l.startswith('ELEVENLABS_API_KEY='))
kind, name, prompt, secs = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4])
out = os.path.join(A, name + '.mp3')
if os.path.exists(out): print('exists', out); sys.exit(0)
if kind == 'sfx':
    url = 'https://api.elevenlabs.io/v1/sound-generation'; body = {'text': prompt, 'duration_seconds': secs, 'prompt_influence': 0.4}
else:
    url = 'https://api.elevenlabs.io/v1/music'; body = {'prompt': prompt, 'music_length_ms': int(secs * 1000)}
req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={'xi-api-key': key, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg'})
try:
    with urllib.request.urlopen(req, timeout=600) as r: data = r.read()
except urllib.error.HTTPError as e:
    print('HTTP', e.code, e.read().decode()[:400]); sys.exit(1)
open(out, 'wb').write(data); print('ok', out, len(data))
