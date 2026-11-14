#!/usr/bin/env python3
"""Video 13 (66 shots + end card): ambience follows the set of each shot; whoosh on jumps into studio/planet/system/pov/city; ~80 SFX."""
import json, subprocess, os, sys
ROOT = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(ROOT, 'out_light'); A = os.path.join(ROOT, 'audio')
TL = json.load(open(os.path.join(ROOT, 'render', 'timeline_light.json'))); m = TL['marks']; sc = {s['id']: s for s in TL['scenes']}
SETS = ("h1 flight h2 street h3 rest d1 street d2 rest d2b rest d3 street d4 city d5 street e1 street e2 flight e3 studio e3b studio e4 studio e5 flight e5b flight "
        "n1 studio n2 studio n2b studio n3 planet n4 studio n5 flight p1 street p2 rest p3 flight p4 studio t1 planet t2 planet t3 planet t4 system t5 planet t6 flight "
        "c1 studio c2 flight c3 rest c4 studio c5 city l1 pov l2 studio l3 flight l4 system x1 pov x2 studio x3 pov x4 pov x5 flight x5b flight "
        "y1 studio y2 flight y3 studio y4 studio y5 flight y6 studio u1 planet u1b planet u2 system u3 flight z1 street z1b street z2 rest z3 rest z4 rest z5 rest z6 rest z7 rest z8 rest endcard black").split()
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
AMB = [('amb_rest', {'rest'}, 0.11), ('amb_street', {'street'}, 0.11), ('amb_flight', {'flight'}, 0.10), ('amb_space', {'planet', 'system'}, 0.09), ('amb_pov', {'pov'}, 0.10), ('amb_studio', {'studio'}, 0.05), ('amb_city', {'city'}, 0.10)]
ON = m['on']; S = lambda k: span[k][0]
sfx = [('sfx_tick', 0.3, 0.25), ('sfx_pop', m['late'], 0.3), ('sfx_run', S('h2'), 0.45), ('sfx_ding', S('d1'), 0.35), ('sfx_pop', m['leicester'], 0.3), ('sfx_run', S('d3'), 0.45),
       ('sfx_pop', m['three'] + 0.1, 0.35), ('sfx_pop', S('d4') + 1.0, 0.3), ('sfx_pop', m['cake'], 0.3), ('sfx_run', S('d5'), 0.4),
       ('sfx_boom', ON - 0.05, 0.9), ('sfx_whoosh', ON + 0.1, 0.4), ('sfx_pop', m['nearly'], 0.35), ('sfx_rise', m['mass'], 0.5), ('sfx_thud', m['infinite'] - 0.1, 0.6),
       ('sfx_needle', m['settles'], 0.55), ('sfx_ding', m['settles'] + 0.6, 0.3),
       ('sfx_scale', m['kilos'] + 0.4, 0.4), ('sfx_counter', S('n2') + 0.1, 0.45), ('sfx_counter', S('n2b'), 0.3), ('sfx_powerdown', m['eight'], 0.6), ('sfx_slap', m['sandwich'] + 0.15, 0.5), ('sfx_chew', S('n5'), 0.45),
       ('sfx_passby', m['passes'] - 0.05, 0.9), ('sfx_gust', m['micro'], 0.6), ('sfx_flap', S('p3'), 0.5), ('sfx_buzzer', m['brakes'], 0.5),
       ('sfx_zip', m['moon'], 0.5), ('sfx_zip', S('t2') + 0.2, 0.5), ('sfx_zip', m['jupiter'], 0.5), ('sfx_counter', S('t4'), 0.35), ('sfx_zip', S('t5') + 0.2, 0.5), ('sfx_pop', m['sorry'], 0.3),
       ('sfx_clockspin', S('c1'), 0.5), ('sfx_tick', S('c2'), 0.4), ('sfx_timelapse', S('c3'), 0.5), ('sfx_clockspin', S('c4'), 0.4), ('sfx_ding', m['twoyears'], 0.35), ('sfx_pulse', S('c5'), 0.5),
       ('sfx_squash', m['squashes'], 0.6), ('sfx_squash', 52.0, 0.55), ('sfx_ding', 52.9, 0.3), ('sfx_tick', S('l3'), 0.4), ('sfx_squash', 54.95, 0.5),
       ('sfx_shimmer', S('x1'), 0.45), ('sfx_zap', m['xrays'], 0.5), ('sfx_slide', S('x2') + 0.1, 0.5), ('sfx_shimmer', S('x3'), 0.4), ('sfx_ding', m['dot'], 0.3), ('sfx_drop', S('x4'), 0.6), ('sfx_pop', S('x5'), 0.3), ('sfx_snore', m['night'], 0.6),
       ('sfx_atom', S('y1'), 0.4), ('sfx_sparks', S('y2'), 0.6), ('sfx_beam', m['collider'] - 0.9, 0.6), ('sfx_needle', m['lethal'], 0.5), ('sfx_alarm', m['lethal'] + 0.5, 0.4), ('sfx_tingle', S('y5'), 0.6), ('sfx_slap', S('y6') + 0.05, 0.5),
       ('sfx_skid', m['turns'], 0.7), ('sfx_pop', S('u2') + 0.2, 0.3), ('sfx_tick', S('u3'), 0.4),
       ('sfx_boom', S('z1'), 0.6), ('sfx_skid', m['walks'] + 0.2, 0.6), ('sfx_doorbell', S('z2'), 0.6), ('sfx_tick', S('z3'), 0.4), ('sfx_birds', S('z3') + 0.2, 0.4), ('sfx_yawn', m['waited'] - 0.3, 0.6),
       ('sfx_flip', 85.0, 0.6), ('sfx_plates', m['breakfast'] + 0.3, 0.5), ('sfx_boxdown', 86.9, 0.6), ('sfx_pat', S('z7') + 0.1, 0.5), ('sfx_pop', S('z8'), 0.3)]
prev = None
for s in order:
    k = setof[s]
    if k in ('studio', 'planet', 'system', 'pov', 'city') and k != prev and prev is not None: sfx.append(('sfx_whoosh', max(0, span[s][0] - 0.25), 0.28))
    prev = k
inputs = ['-i', video, '-i', os.path.join(ROOT, 'voice', 'light_final.mp3'), '-i', os.path.join(A, 'music_light.mp3')]
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
final = os.path.join(OUT, 'poor_dave_13_speed_of_light.mp4')
subprocess.run(['ffmpeg', '-y', '-v', 'error'] + inputs + ['-filter_complex', ';'.join(f), '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', final], check=True)
print('final', final, len(sfx), 'sfx')
