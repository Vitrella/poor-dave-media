#!/usr/bin/env python3
"""Video 9 (52 shots + end card): ambience follows the set of each shot; whoosh on jumps into studio/space/city/sky; ~50 SFX."""
import json, subprocess, os, sys
ROOT = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(ROOT, 'out_plastic'); A = os.path.join(ROOT, 'audio')
TL = json.load(open(os.path.join(ROOT, 'render', 'timeline_plastic.json'))); m = TL['marks']; sc = {s['id']: s for s in TL['scenes']}
SETS = ("h1 shop h2 tailor d1 tailor d2 tailor e1 tailor e2 space e3 tailor s1 tailor s2 street s3 studio c1 studio c1b studio c2 street "
        "v1 studio v1b studio v2a street v2b studio v3 studio v4 city v4b street g1 city g2 space g3 space p1a studio p1b sky p2 sky p3 sky "
        "l1 studio l1b studio l2 studio l3 street b1 shop b1b shop b2 shop b3 shop o1 ocean o2 space o3 under o4 under "
        "m1 tailor m2 tailor m3 tailor k1 tailor k2 street k3 shop z1 tailor z1b tailor z2 tailor z3 tailor z4 tailor z5 tailor z6 tailor endcard black").split()
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
AMB = [('amb_shop', {'tailor'}, 0.09), ('amb_street', {'street'}, 0.10), ('amb_city', {'city'}, 0.10), ('amb_space', {'space'}, 0.07),
       ('amb_sky', {'sky'}, 0.10), ('amb_super', {'shop'}, 0.09), ('amb_ocean', {'ocean'}, 0.10), ('amb_underwater', {'under'}, 0.10)]
ON = m['on']; SNAP = m['back']
sfx = [('sfx_vanish', 0.2, 0.5), ('sfx_slosh', 0.35, 0.5), ('sfx_tape', m['close1'] + 0.2, 0.5),
       ('sfx_rumble', ON - 0.25, 0.8), ('sfx_vanish', ON, 0.9), ('sfx_cloth', ON + 0.05, 0.5), ('sfx_rumble', ON + 0.6, 0.4),
       ('sfx_cloth', m['suitgo'] + 0.1, 0.5), ('sfx_gasp', m['elastic'] + 0.3, 0.5), ('sfx_tick', m['billion'] + 0.1, 0.6),
       ('sfx_vanish', 21.5, 0.5), ('sfx_murmur', m['popular'] + 0.4, 0.6),
       ('sfx_vanish', 26.9, 0.5), ('sfx_pop', m['dash'] + 0.3, 0.4), ('sfx_vanish', 30.3, 0.4), ('sfx_spark', m['touch'] + 0.4, 0.8),
       ('sfx_engine_die', m['vehicles'] + 0.2, 0.7), ('sfx_spark', m['vehicles'] + 0.3, 0.5), ('sfx_spark', 34.6, 0.5),
       ('sfx_spark', m['cable'] + 0.2, 0.5), ('sfx_powerdown', m['lights'] + 0.4, 0.8),
       ('sfx_tick', m['aircraft'] + 0.2, 0.5), ('sfx_vanish', m['halfplastic'] + 0.8, 0.6), ('sfx_creak', m['halfplastic'] + 0.9, 0.6), ('sfx_airrush', m['halfplastic'] + 1.0, 0.7), ('sfx_airrush', m['halfair'] + 0.2, 0.5),
       ('sfx_tick', m['lenses'] + 0.2, 0.5), ('sfx_pop', 49.7, 0.5), ('sfx_pop', m['spectacle'] + 0.4, 0.4), ('sfx_thud', m['blurry'] + 0.7, 0.35),
       ('sfx_vanish', m['bottle'] + 0.5, 0.6), ('sfx_slosh', m['remember'] + 0.2, 0.9),
       ('sfx_vanish', 62.2, 0.5), ('sfx_bubble', m['clean'] + 0.3, 0.4), ('sfx_bubble', m['fish'] + 0.3, 0.5),
       ('sfx_cloth', m['vest'] + 0.3, 0.3), ('sfx_pop', m['ceiling'] + 0.3, 0.3),
       ('sfx_rumble', SNAP - 0.2, 0.6), ('sfx_shimmer', SNAP, 0.9), ('sfx_ding', SNAP + 0.05, 0.6), ('sfx_pop', m['exactly'] + 0.3, 0.4), ('sfx_pop', m['notnow'] + 0.3, 0.4),
       ('sfx_shimmer', m['returns'], 0.7), ('sfx_cloth', m['returns'] + 0.1, 0.5), ('sfx_clap', m['stands'] + 0.3, 0.5),
       ('sfx_cloth', m['doesnt'] + 0.2, 0.5), ('sfx_thud', m['doesnt'] + 0.35, 0.8), ('sfx_tape', m['close2'] + 0.3, 0.4), ('sfx_ding', 89.5, 0.4)]
prev = None
for s in order:
    k = setof[s]
    if k in ('studio', 'space', 'city', 'sky') and k != prev and prev is not None: sfx.append(('sfx_whoosh', max(0, span[s][0] - 0.25), 0.3))
    prev = k
inputs = ['-i', video, '-i', os.path.join(ROOT, 'voice', 'plastic_final.mp3'), '-i', os.path.join(A, 'music_plastic.mp3')]
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
f.append(f"{''.join(labels)}amix=inputs={len(labels)}:duration=first:normalize=0,alimiter=limit=0.95:level=0,loudnorm=I=-14:TP=-1.5:LRA=11[a]")
final = os.path.join(OUT, 'poor_dave_09_plastic_vanished.mp4')
subprocess.run(['ffmpeg', '-y', '-v', 'error'] + inputs + ['-filter_complex', ';'.join(f), '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', final], check=True)
print('final', final, len(sfx), 'sfx')
