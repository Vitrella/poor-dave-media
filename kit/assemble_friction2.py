#!/usr/bin/env python3
"""Video 6 v2 (43 shots). Ambience follows the set of each shot; whoosh on every jump to studio/space/city."""
import json, subprocess, os, sys
ROOT = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(ROOT, 'out_friction2'); A = os.path.join(ROOT, 'audio')
TL = json.load(open(os.path.join(ROOT, 'render', 'timeline_friction.json'))); m = TL['marks']
SETS = "h1 room h2 city d1 room d2 room d3 room d4 room e1 street e2 space e3 studio e4 city j1 room j2 room c1 street c2 studio c3 street c4 city c5 street g1 street g2 studio g3 studio g4 city b1 pitch b2 pitch b3 pitch n1 studio n2 studio n3 room n4 room s1 studio s2 room s3 studio s4 studio k1 space k2 room a1 city a2 room a3 room z1 room z2 room endcard black".split()
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
kit = wins({'room'}); street = wins({'street', 'city', 'pitch'})
ON = m['on']; SNAP = m['back']
sfx = [('sfx_fabric', 0.4, 0.5), ('sfx_ripple', ON - 0.3, 0.8), ('sfx_fabric', m['committed'], 0.5), ('sfx_screech', m['seven'] + 0.2, 0.9), ('sfx_engines', m['twothirds'], 0.7), ('sfx_kick', m['ball'] + 0.4, 0.9), ('sfx_zip', m['zip'] + 0.3, 0.8), ('sfx_snap', SNAP - 0.1, 0.8), ('sfx_fabric', m['including'] + 0.1, 1.0), ('sfx_ding', m['through'] + 1.5, 0.5)]
prev = None
for s in order:
    k = setof[s]
    if k in ('studio', 'space', 'city') and prev not in ('studio', 'space', 'city'): sfx.append(('sfx_whoosh', max(0, span[s][0] - 0.25), 0.35))
    prev = k
sfx += [('sfx_screech', span['c3'][0] + 0.2, 0.5), ('sfx_engines', span['g4'][0], 0.6), ('sfx_click', span['s4'][0] + 0.3, 0.5), ('sfx_fabric', span['s3'][0] + 0.4, 0.5), ('sfx_whoosh', span['e3'][0] + 0.3, 0.3), ('sfx_fabric', span['j2'][0] + 0.2, 0.5)]
inputs = ['-i', video, '-i', os.path.join(ROOT, 'voice', 'friction_final.mp3'), '-i', os.path.join(A, 'music_friction.mp3'), '-stream_loop', '-1', '-i', os.path.join(A, 'amb_shop.mp3'), '-stream_loop', '-1', '-i', os.path.join(A, 'amb_street2.mp3')]
for name, _, _ in sfx: inputs += ['-i', os.path.join(A, name + '.mp3')]
F = 'aformat=sample_rates=48000:channel_layouts=stereo'
win = lambda ws: '+'.join(f"between(t,{a:.3f},{b:.3f})" for a, b in ws)
f = [f"[1:a]{F},apad=whole_dur={vd:.3f}[v]",
     f"[2:a]{F},atrim=0:{vd:.3f},volume=0.18,afade=t=in:d=1.5,afade=t=out:st={vd-2.5:.3f}:d=2.5[mu]",
     f"[3:a]{F},atrim=0:{vd:.3f},volume=0.08,volume=enable='not({win(kit)})':volume=0[ak]",
     f"[4:a]{F},atrim=0:{vd:.3f},volume=0.12,volume=enable='not({win(street)})':volume=0[as]"]
labels = ['[v]', '[mu]', '[ak]', '[as]']
for i, (name, tt, vol) in enumerate(sfx):
    d = int(tt * 1000); f.append(f"[{5+i}:a]{F},volume={vol},adelay={d}|{d}[s{i}]"); labels.append(f'[s{i}]')
f.append(f"{''.join(labels)}amix=inputs={len(labels)}:duration=first:normalize=0,alimiter=limit=0.95,loudnorm=I=-14:TP=-1.5:LRA=11[a]")
final = os.path.join(OUT, 'poor_dave_07_friction_doubled_v2.mp4')
subprocess.run(['ffmpeg', '-y', '-v', 'error'] + inputs + ['-filter_complex', ';'.join(f), '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', final], check=True)
print('final', final, len(sfx), 'sfx')
