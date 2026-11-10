#!/usr/bin/env python3
"""Video 8 (52 shots): ambience follows the set of each shot; whoosh on every jump into studio/space/city/antarctic; ~30 SFX."""
import json, subprocess, os, sys
ROOT = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(ROOT, 'out_ice'); A = os.path.join(ROOT, 'audio')
TL = json.load(open(os.path.join(ROOT, 'render', 'timeline_ice.json'))); m = TL['marks']; sc = {s['id']: s for s in TL['scenes']}
SETS = ("h1 space h2 beach d1 beach d2 beach d3 beach e1 beach e2 antarctic e3 space e4 antarctic v1 studio v2 studio v3 studio v4 antarctic "
        "n1 studio n2 city n3 studio n4 beach n5 space n6 antarctic f1 antarctic f2 space f3 ocean f4 ocean a1 ocean a2 studio a3 city a4 space "
        "c1 city c2 city c3 city c4 city c5 studio c6 studio s1 space s2 studio s3 studio s4 studio m1 beach m2 beach m3 beach l1 studio l2 studio l3 studio l4 city "
        "r1 space r2 space r3 beach z1 beach z2 beach z3 beach z4 beach endcard black").split()
order = SETS[0::2]; setof = dict(zip(SETS[0::2], SETS[1::2]))
miss = [s for s in order if not os.path.exists(os.path.join(OUT, s + '.mp4'))]
if miss: print('MISSING', miss); sys.exit(1)
dur = lambda p: float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p], capture_output=True, text=True).stdout)
t = 0; span = {}
for s in order: d = dur(os.path.join(OUT, s + '.mp4')); span[s] = (t, t + d); t += d
open(os.path.join(OUT, 'concat.txt'), 'w').write(''.join(f"file '{os.path.join(OUT, s + '.mp4')}'\n" for s in order))
video = os.path.join(OUT, 'video_silent.mp4')
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', os.path.join(OUT, 'concat.txt'), '-c', 'copy', video], check=True)
vd = dur(video); print('video', vd, 'timeline', TL['duration'])
def wins(kinds):
    w = []
    for s in order:
        if setof[s] in kinds:
            a, b = span[s]
            if w and abs(w[-1][1] - a) < 0.05: w[-1] = (w[-1][0], b)
            else: w.append((a, b))
    return w or [(0, 0.001)]
AMB = [('amb_beach', {'beach', 'ocean'}, 0.10), ('amb_wind', {'antarctic'}, 0.10), ('amb_city', {'city'}, 0.10), ('amb_space', {'space'}, 0.07)]
ON = m['on']; SNAP = m['way']
sfx = [('sfx_crack', 0.1, 0.6), ('sfx_gull', 1.0, 0.35), ('sfx_sand', 2.4, 0.4), ('sfx_sand', m['model'] + 1.0, 0.5), ('sfx_paper', m['priya'] + 0.2, 0.4),
       ('sfx_rumble', ON - 0.2, 0.9), ('sfx_melt', ON + 0.1, 0.9), ('sfx_splash', m['five'] + 0.2, 0.5), ('sfx_melt', m['water'] + 0.2, 0.6),
       ('sfx_click', m['five2'] + 0.4, 0.7), ('sfx_ding', m['five2'] + 0.5, 0.5), ('sfx_gull', m['beach'] + 0.4, 0.3), ('sfx_ding', SNAP + 0.05, 0.6),
       ('sfx_crack', sc['flood']['start'], 0.8), ('sfx_rumble', sc['flood']['start'] + 0.2, 0.7), ('sfx_wave', m['tsunami'], 0.7), ('sfx_wave', sc['arrival']['start'] + 0.4, 0.8), ('sfx_rise', m['rise'], 0.8),
       ('sfx_splash', m['london'] + 0.2, 0.4), ('sfx_splash', m['ny'] + 0.2, 0.4), ('sfx_splash', m['shanghai'] + 0.2, 0.4), ('sfx_splash', m['tokyo'] + 0.2, 0.4), ('sfx_rise', m['eight'] + 0.2, 0.6),
       ('sfx_plop', m['arch'] + 0.3, 0.5), ('sfx_ding', 61.6, 0.6), ('sfx_gull', m['notice'] + 0.3, 0.5), ('sfx_sand', m['moat'] + 0.2, 0.6), ('sfx_sand', m['moat'] + 0.9, 0.5),
       ('sfx_rise', sc['salt']['start'] + 0.3, 0.6), ('sfx_bubble', m['fish'] + 0.2, 0.6), ('sfx_wave', m['factor'] + 0.2, 0.8), ('sfx_paper', m['venue'] + 0.3, 0.4), ('sfx_gull', 86.7, 0.5), ('sfx_ding', m['plan'] + 1.0, 0.4)]
prev = None
for s in order:
    k = setof[s]
    if k in ('studio', 'space', 'city', 'antarctic') and k != prev and prev is not None: sfx.append(('sfx_whoosh', max(0, span[s][0] - 0.25), 0.3))
    prev = k
inputs = ['-i', video, '-i', os.path.join(ROOT, 'voice', 'ice_final.mp3'), '-i', os.path.join(A, 'music_ice.mp3')]
for name, _, _ in AMB: inputs += ['-stream_loop', '-1', '-i', os.path.join(A, name + '.mp3')]
for name, _, _ in sfx: inputs += ['-i', os.path.join(A, name + '.mp3')]
F = 'aformat=sample_rates=48000:channel_layouts=stereo'
win = lambda ws: '+'.join(f"between(t,{a:.3f},{b:.3f})" for a, b in ws)
f = [f"[1:a]{F},apad=whole_dur={vd:.3f}[v]",
     f"[2:a]{F},atrim=0:{vd:.3f},volume=0.17,afade=t=in:d=1.5,afade=t=out:st={vd-2.5:.3f}:d=2.5[mu]"]
labels = ['[v]', '[mu]']
for i, (name, kinds, vol) in enumerate(AMB):
    f.append(f"[{3+i}:a]{F},atrim=0:{vd:.3f},volume={vol},volume=enable='not({win(wins(kinds))})':volume=0[am{i}]"); labels.append(f'[am{i}]')
base = 3 + len(AMB)
for i, (name, tt, vol) in enumerate(sfx):
    d = int(tt * 1000); f.append(f"[{base+i}:a]{F},volume={vol},adelay={d}|{d}[s{i}]"); labels.append(f'[s{i}]')
f.append(f"{''.join(labels)}amix=inputs={len(labels)}:duration=first:normalize=0,alimiter=limit=0.95,loudnorm=I=-14:TP=-1.5:LRA=11[a]")
final = os.path.join(OUT, 'poor_dave_08_ice_melted.mp4')
subprocess.run(['ffmpeg', '-y', '-v', 'error'] + inputs + ['-filter_complex', ';'.join(f), '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', final], check=True)
print('final', final, len(sfx), 'sfx')
