#!/usr/bin/env python3
"""Video 12 (59 shots + end card): ambience follows the set of each shot; whoosh on jumps into studio/space/earth/city/card; ~65 SFX."""
import json, subprocess, os, sys
ROOT = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(ROOT, 'out_cheese'); A = os.path.join(ROOT, 'audio')
TL = json.load(open(os.path.join(ROOT, 'render', 'timeline_cheese.json'))); m = TL['marks']; sc = {s['id']: s for s in TL['scenes']}
SETS = ("h1 hill h2 moon h3 hill d1 hill d2 card d3 hill e1 moon e2 earth e3 hill n1 studio n2 studio n3 studio n4 moon n5 hill "
        "v1 moon v2 surface v3 moon v4 studio t1 moon t1b moon t2 surface t3 moon t4 moon t5 surface p1 moon p2 studio p3 studio p4 studio p4b studio p5 hill "
        "g1 studio g2 surface g3 surface g4 surface w1 earth w2 studio w3 coast w4 coast w5 coast b1 studio b2 studio b3 city b4 city b5 hill b6 card "
        "c1 studio c2 studio c3 studio c4 earth f1 moon f2 surface f3 moon f4 moon z1 hill z2 hill z3 hill z4 card z5 hill endcard black").split()
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
AMB = [('amb_hill', {'hill'}, 0.12), ('amb_space', {'moon', 'earth'}, 0.09), ('amb_surface', {'surface'}, 0.10), ('amb_studio', {'studio'}, 0.05), ('amb_coast', {'coast'}, 0.12), ('amb_city', {'city'}, 0.10), ('amb_card', {'card'}, 0.08)]
ON = m['on']
sfx = [('sfx_beep', 0.6, 0.3), ('sfx_shutter', m['moon0'], 0.35), ('sfx_paper', m['invitation'], 0.4), ('sfx_pop', m['job'], 0.3),
       ('sfx_gloop', ON - 0.05, 0.9), ('sfx_pulse', ON + 0.05, 0.6), ('sfx_whoosh', m['allofit'] - 0.05, 0.3), ('sfx_pulse', m['allofit'] + 0.1, 0.4), ('sfx_pop', m['instantly'], 0.3),
       ('sfx_creak', m['third'], 0.6), ('sfx_dial', m['weighs'], 0.6), ('sfx_ding', m['weighs'] + 1.0, 0.3), ('sfx_whoosh', m['same'] - 0.05, 0.3), ('sfx_pop', m['gravitas'], 0.3),
       ('sfx_hiss', m['air'] + 0.2, 0.6), ('sfx_boil', m['minute'], 0.6), ('sfx_hiss', 24.4, 0.5), ('sfx_pop', m['freeze'], 0.3),
       ('sfx_sizzle', m['twenty'] - 0.2, 0.6), ('sfx_drip', m['melts'], 0.5), ('sfx_sizzle', m['melts'] + 0.5, 0.3), ('sfx_whoosh', m['weeks'] - 0.05, 0.3), ('sfx_freeze', m['thirty'], 0.6), ('sfx_freeze', m['sets'], 0.4),
       ('sfx_whoosh', sc['pressure']['start'], 0.3), ('sfx_press', 37.4, 0.7), ('sfx_ding', m['atmospheres'] + 0.5, 0.3), ('sfx_pen', m['scientists'] + 0.5, 0.4), ('sfx_slap', m['premium'] + 0.15, 0.5),
       ('sfx_spring', m['gravity'] + 0.1, 0.4), ('sfx_spring', 45.7, 0.5), ('sfx_squelch', m['landing'] + 0.1, 0.7), ('sfx_stretch', m['landing'] + 0.5, 0.5),
       ('sfx_pulse', m['tides'] + 0.8, 0.4), ('sfx_recede', 52.1, 0.5), ('sfx_recede', 53.8, 0.6), ('sfx_boat', m['boats'], 0.6), ('sfx_mudsteps', m['surfers'], 0.5),
       ('sfx_lamp', m['pale'], 0.5), ('sfx_pop', m['carpark'], 0.3), ('sfx_lamp', m['brighter'], 0.6), ('sfx_flash', 65.9, 0.7), ('sfx_beep', m['white'], 0.3),
       ('sfx_wedge', sc['calories']['start'] + 0.2, 0.5), ('sfx_crowd', m['feed'], 0.5), ('sfx_counter', m['feed'] + 0.1, 0.5), ('sfx_rise', m['sixteen'] + 0.9, 0.5), ('sfx_rise', m['universe'], 0.4), ('sfx_crunch', m['universe'] + 0.8, 0.4),
       ('sfx_counter', m['million'], 0.5), ('sfx_zip', 75.7, 0.6), ('sfx_zip', m['toast'] + 0.6, 0.5), ('sfx_crack', m['dry'], 0.6), ('sfx_crack', m['dry'] + 0.6, 0.4),
       ('sfx_crunch', m['biscuit'], 0.5), ('sfx_flash', m['photo'] + 0.35, 0.7), ('sfx_shutter', m['photo'] + 0.35, 0.5), ('sfx_paper', m['priya'], 0.4), ('sfx_pop', 87.6, 0.3)]
prev = None
for s in order:
    k = setof[s]
    if k in ('studio', 'moon', 'earth', 'city', 'card', 'surface', 'coast') and k != prev and prev is not None: sfx.append(('sfx_whoosh', max(0, span[s][0] - 0.25), 0.28))
    prev = k
inputs = ['-i', video, '-i', os.path.join(ROOT, 'voice', 'cheese_final.mp3'), '-i', os.path.join(A, 'music_cheese.mp3')]
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
final = os.path.join(OUT, 'poor_dave_12_moon_cheese.mp4')
subprocess.run(['ffmpeg', '-y', '-v', 'error'] + inputs + ['-filter_complex', ';'.join(f), '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', final], check=True)
print('final', final, len(sfx), 'sfx')
