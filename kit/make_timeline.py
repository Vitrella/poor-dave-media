#!/usr/bin/env python3
"""Build render/timeline.json from the narration word timings.
Usage: python3 make_timeline.py --slug helium --ids park_intro,dave_propose,... [--marks marks.json] [--endcard 3.6]
- voice/<slug>.txt: one narration line per scene (same order as --ids)
- voice/<slug>_final.json: output of tighten.py (words with s/e)
- marks: JSON {name: [scene_id, word_prefix]} -> start time of that word; written into timeline.marks
Scene start = first word - 0.08 s (scene 0 starts at 0). Last scene ends at last word + 0.9 s, then the end card.
"""
import argparse, json, re
ap = argparse.ArgumentParser(); ap.add_argument('--slug', required=True); ap.add_argument('--ids', required=True); ap.add_argument('--marks', default=None); ap.add_argument('--endcard', type=float, default=3.6); ap.add_argument('--out', default='render/timeline.json')
a = ap.parse_args()
W = json.load(open(f'voice/{a.slug}_final.json')); w = W['words']
lines = open(f'voice/{a.slug}.txt').read().strip().split('\n'); ids = a.ids.split(',')
assert len(ids) == len(lines), f'{len(ids)} ids vs {len(lines)} lines'
scenes = []; i = 0
for sid, ln in zip(ids, lines):
    n = len(ln.split()); ws = w[i:i + n]; sents = []; cur = []
    for x in ws:
        cur.append(x)
        if re.search(r'[.?!]"?$', x['w']): sents.append(cur); cur = []
    if cur: sents.append(cur)
    scenes.append({'id': sid, 'line': ln, 'words': ws, 'sentences': [{'text': ' '.join(x['w'] for x in s), 's': s[0]['s'], 'e': s[-1]['e']} for s in sents]}); i += n
for k, sc in enumerate(scenes): sc['start'] = 0.0 if k == 0 else round(sc['words'][0]['s'] - 0.08, 3)
for k, sc in enumerate(scenes): sc['end'] = scenes[k + 1]['start'] if k + 1 < len(scenes) else round(sc['words'][-1]['e'] + 0.9, 3)
end_start = scenes[-1]['end']; scenes.append({'id': 'endcard', 'line': '', 'words': [], 'sentences': [], 'start': end_start, 'end': round(end_start + a.endcard, 3)})
def norm(s): return re.sub(r'[^a-z0-9.]', '', s.lower())
def wt(sid, word):
    sc = next(s for s in scenes if s['id'] == sid)
    base, _, nth = word.partition('#'); nth = int(nth) if nth else 1
    for exact in (True, False):
        c = 0
        for x in sc['words']:
            nw = norm(x['w'])
            if (nw == norm(base)) if exact else nw.startswith(norm(base)):
                c += 1
                if c == nth: return x['s']
    raise SystemExit(f'mark not found: {sid} {word}')
marks = {}
if a.marks:
    for name, (sid, word) in json.load(open(a.marks)).items(): marks[name] = wt(sid, word)
marks['air_back'] = scenes[[s['id'] for s in scenes].index('air_back')]['words'][-1]['e'] if 'air_back' in [s['id'] for s in scenes] else None
tl = {'fps': 30, 'duration': scenes[-1]['end'], 'audio': f'voice/{a.slug}_final.mp3', 'marks': marks, 'scenes': scenes}
json.dump(tl, open(a.out, 'w'), indent=1)
for s in scenes: print(f"{s['start']:6.2f}-{s['end']:6.2f} {s['id']:16s} {len(s['sentences'])} sent")
print({k: (round(v, 2) if v is not None else None) for k, v in marks.items()})
