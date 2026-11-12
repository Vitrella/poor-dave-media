#!/usr/bin/env python3
"""Video 11 (58 shots + end card): ambience follows the set of each shot; whoosh on jumps into studio/city/earth/lift/list; ~60 SFX."""
import json, subprocess, os, sys
ROOT = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(ROOT, 'out_height'); A = os.path.join(ROOT, 'audio')
TL = json.load(open(os.path.join(ROOT, 'render', 'timeline_height.json'))); m = TL['marks']; sc = {s['id']: s for s in TL['scenes']}
SETS = ("h1 street h2 street d1 street d2 street d3 street e1 street e2 street e3 city g1 studio g2 studio g3 house g4 house w1 earth w2 city w3 street "
        "i1 house i2 house i3 street m1 studio m2 studio m2b studio m3 studio m4 street b1 studio b1b studio b2 studio b2b studio b3 studio b3b studio b4 studio "
        "f1 house f2 house f3 house f3b house l1 lift l2 lift c1 road c2 road c3 road k1 studio k2 street k2b house k3 street r1 studio r2 studio r3 studio r4 studio "
        "o1 street o2 street o3 street a1 street a2 house a3 road a4 street z1 street z2 street z3 list z4 street endcard black").split()
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
AMB = [('amb_street', {'street'}, 0.12), ('amb_house', {'house', 'list'}, 0.10), ('amb_studio', {'studio'}, 0.05), ('amb_road', {'road'}, 0.12), ('amb_lift', {'lift'}, 0.10), ('amb_city', {'city'}, 0.10), ('amb_earth', {'earth'}, 0.10)]
ON = m['on']; SNAP = m['back']
sfx = [('sfx_footsteps', 1.3, 0.3), ('sfx_ding', m['list'], 0.25), ('sfx_pop', m['eggs'], 0.3),
       ('sfx_grow', ON - 0.05, 0.9), ('sfx_pulse', ON + 0.1, 0.5), ('sfx_bonk', ON + 0.55, 0.6), ('sfx_whoosh', m['five'], 0.3),
       ('sfx_tick', m['h17'], 0.3), ('sfx_grow', 14.1, 0.45), ('sfx_bonk', m['doors'], 0.4), ('sfx_crack', m['ceilings'], 0.6),
       ('sfx_pulse', m['billion'], 0.6), ('sfx_whoosh', m['allof'], 0.3), ('sfx_footsteps', m['atonce'], 0.3),
       ('sfx_crack', m['indoors'] + 0.1, 0.5), ('sfx_pop', 24.5, 0.3), ('sfx_crack', m['loft'] + 0.1, 0.6),
       ('sfx_dial', m['eight'] - 0.2, 0.6), ('sfx_ding', m['kg560'], 0.3), ('sfx_bear', m['bear'] + 0.2, 0.5), ('sfx_heart', m['anxious'], 0.3),
       ('sfx_grow', m['bones'] + 0.6, 0.3), ('sfx_thud', m['double'] + 0.1, 0.5), ('sfx_thud', m['double'] + 0.4, 0.45), ('sfx_thud', m['double'] + 0.7, 0.5), ('sfx_bone', m['double'] + 0.8, 0.6),
       ('sfx_ding', m['galileo'], 0.3), ('sfx_crowd', m['nobody'] + 0.3, 0.5),
       ('sfx_crack', m['floor'] + 0.3, 0.5), ('sfx_bone', 45.0, 0.4), ('sfx_thud', m['family'] + 0.5, 0.5), ('sfx_crack', 48.7, 0.4),
       ('sfx_ding', m['lift'], 0.4), ('sfx_lift', 52.0, 0.6), ('sfx_metal', m['barely'], 0.5),
       ('sfx_horn', m['cars'], 0.5), ('sfx_horn', m['zero'] + 0.2, 0.3), ('sfx_pop', m['sunroof'] + 0.5, 0.4),
       ('sfx_rip', m['clothes'] + 0.3, 0.6), ('sfx_rip', m['outfits'], 0.5), ('sfx_rip', m['crop'], 0.4),
       ('sfx_heart', m['heart'] + 0.3, 0.5), ('sfx_whoosh', m['giraffes'], 0.3), ('sfx_boing', m['practising'] + 0.2, 0.4),
       ('sfx_scrape', m['sideways'] + 0.3, 0.6), ('sfx_glass', m['window'] + 0.3, 0.5), ('sfx_scrape', m['again'] + 0.3, 0.6),
       ('sfx_shrink', SNAP - 0.05, 0.9), ('sfx_door', SNAP + 0.3, 0.4),
       ('sfx_shrink', m['heads'], 0.5), ('sfx_pop', 82.2, 0.3), ('sfx_shrink', 83.5, 0.4),
       ('sfx_footsteps', m['through'], 0.3), ('sfx_splat', m['itemone'] + 0.3, 0.6), ('sfx_pen', m['writes'], 0.5), ('sfx_door', 90.3, 0.3)]
prev = None
for s in order:
    k = setof[s]
    if k in ('studio', 'city', 'earth', 'lift', 'list') and k != prev and prev is not None: sfx.append(('sfx_whoosh', max(0, span[s][0] - 0.25), 0.3))
    prev = k
inputs = ['-i', video, '-i', os.path.join(ROOT, 'voice', 'height_final.mp3'), '-i', os.path.join(A, 'music_height.mp3')]
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
final = os.path.join(OUT, 'poor_dave_11_doubled_height.mp4')
subprocess.run(['ffmpeg', '-y', '-v', 'error'] + inputs + ['-filter_complex', ';'.join(f), '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', final], check=True)
print('final', final, len(sfx), 'sfx')
