#!/usr/bin/env python3
"""Video 10 (55 shots + end card): ambience follows the set of each shot; whoosh on jumps into studio/galaxy; ~45 SFX."""
import json, subprocess, os, sys
ROOT = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(ROOT, 'out_blackhole'); A = os.path.join(ROOT, 'audio')
TL = json.load(open(os.path.join(ROOT, 'render', 'timeline_blackhole.json'))); m = TL['marks']; sc = {s['id']: s for s in TL['scenes']}
SETS = ("h1 float h2 float d1 float d1b float d2 bakery d3 float e1 hole e2 studio e3 float o1 studio o1b studio o2 hole t1 studio t1b studio t2 hole t2b studio "
        "t3 float t3b hole s1 hole s1b studio s2 studio s3 studio s4 studio b1 galaxy b1b galaxy b2 hole b2b float b3 studio b3b studio b4 hole "
        "c1 hole c1b hole c2 hole c2b float c3 float i1 inside i1b studio i3 inside x1 hole x1b bakery x2 hole x3 hole x4 studio x5 hole "
        "n1 hole n2 studio n3 inside n4 studio p1 bakery z1 float z1b bakery z2 studio z3 hole z4 bakery z5 float endcard black").split()
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
AMB = [('amb_spacefloat', {'float'}, 0.10), ('amb_hole', {'hole'}, 0.12), ('amb_inside', {'inside'}, 0.12), ('amb_galaxy', {'galaxy'}, 0.10), ('amb_bakery', {'bakery'}, 0.10), ('amb_space', {'studio'}, 0.03)]
ON = m['on']
sfx = [('sfx_typing', 1.2, 0.35), ('sfx_typing', m['typing1'], 0.45), ('sfx_bellshop', m['lemon1'] + 0.1, 0.4),
       ('sfx_fall', ON - 0.1, 0.8), ('sfx_rumble', ON + 0.1, 0.6), ('sfx_dong', m['two'], 0.4),
       ('sfx_squeeze', m['tensuns'] + 0.5, 0.6), ('sfx_pop', m['thirty'] + 0.1, 0.4),
       ('sfx_heartbeat', m['feet'], 0.4), ('sfx_tick', m['km3500'] + 0.2, 0.4), ('sfx_stretch', m['teng'] + 0.1, 0.6), ('sfx_stretch', m['taller'] - 0.2, 0.5),
       ('sfx_stretch', m['horizon'] + 0.1, 0.7), ('sfx_snap', m['noodle'] + 0.2, 0.6), ('sfx_ding', m['spag'] + 0.9, 0.4), ('sfx_murmur', m['sorry'] + 0.3, 0.4),
       ('sfx_whoosh', m['opt2'], 0.4), ('sfx_dong', m['fourm'], 0.5), ('sfx_tick', m['twelvem'] + 0.3, 0.4), ('sfx_sparkle', m['eighteen'] + 0.2, 0.4),
       ('sfx_heartbeat', m['tide2'] + 0.2, 0.3), ('sfx_crossing', m['crosses'] - 0.2, 0.8), ('sfx_typing', m['still'], 0.4),
       ('sfx_fall', m['inside'], 0.5), ('sfx_clockdown', m['minute'] - 0.3, 0.5), ('sfx_sent', m['sending1'] + 0.2, 0.6),
       ('sfx_whoosh', m['outside'], 0.3), ('sfx_redshift', m['slows'], 0.6), ('sfx_redshift', m['red'] + 0.2, 0.4), ('sfx_powerdown', m['fades'], 0.3),
       ('sfx_dong', m['nothing'], 0.5), ('sfx_sent', m['text'] + 0.2, 0.6), ('sfx_sent', m['forever'] + 0.5, 0.5), ('sfx_click', m['forever'] + 0.45, 0.5),
       ('sfx_bellshop', m['orders'], 0.5), ('sfx_cakebox', m['orders'] + 0.6, 0.5),
       ('sfx_typing', m['wouldhave'] + 0.2, 0.3), ('sfx_stretch', m['long'], 0.4), ('sfx_vanish', m['gone'] + 0.1, 0.5), ('sfx_cakebox', m['sorted'] + 0.2, 0.5), ('sfx_ding', m['sorted'] + 0.5, 0.5), ('sfx_typing', 87.5, 0.3)]
prev = None
for s in order:
    k = setof[s]
    if k in ('studio', 'galaxy') and k != prev and prev is not None: sfx.append(('sfx_whoosh', max(0, span[s][0] - 0.25), 0.3))
    prev = k
inputs = ['-i', video, '-i', os.path.join(ROOT, 'voice', 'blackhole_final.mp3'), '-i', os.path.join(A, 'music_blackhole.mp3')]
for name, _, _ in AMB: inputs += ['-stream_loop', '-1', '-i', os.path.join(A, name + '.mp3')]
for name, _, _ in sfx: inputs += ['-i', os.path.join(A, name + '.mp3')]
F = 'aformat=sample_rates=48000:channel_layouts=stereo'
win = lambda ws: '+'.join(f"between(t,{a:.3f},{b:.3f})" for a, b in ws)
f = [f"[1:a]{F},apad=whole_dur={vd:.3f}[v]",
     f"[2:a]{F},atrim=0:{vd:.3f},volume=0.18,afade=t=in:d=1.5,afade=t=out:st={vd-2.5:.3f}:d=2.5[mu]"]
labels = ['[v]', '[mu]']
for i, (name, kinds, vol) in enumerate(AMB):
    f.append(f"[{3+i}:a]{F},atrim=0:{vd:.3f},volume={vol},volume=enable='not({win(wins(kinds))})':volume=0[am{i}]"); labels.append(f'[am{i}]')
base = 3 + len(AMB)
for i, (name, tt, vol) in enumerate(sfx):
    d = int(tt * 1000); f.append(f"[{base+i}:a]{F},volume={vol},adelay={d}|{d}[s{i}]"); labels.append(f'[s{i}]')
f.append(f"{''.join(labels)}amix=inputs={len(labels)}:duration=first:normalize=0,alimiter=limit=0.95:level=0,loudnorm=I=-14:TP=-1.5:LRA=11[a]")
final = os.path.join(OUT, 'poor_dave_10_black_hole.mp4')
subprocess.run(['ffmpeg', '-y', '-v', 'error'] + inputs + ['-filter_complex', ';'.join(f), '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', final], check=True)
print('final', final, len(sfx), 'sfx')
