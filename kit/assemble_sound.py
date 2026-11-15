#!/usr/bin/env python3
"""Video 14 (61 shots + end card): ambience follows the set of each shot (library ambience muted while sound is slow); whoosh on jumps into studio/city/earth; ~90 SFX."""
import json, subprocess, os, sys
ROOT = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(ROOT, 'out_sound'); A = os.path.join(ROOT, 'audio')
TL = json.load(open(os.path.join(ROOT, 'render', 'timeline_sound.json'))); m = TL['marks']; sc = {s['id']: s for s in TL['scenes']}
SETS = ("h1 lib h2 street h3 lib d1 street d2 lib d3 lib d4 studio d5 lib e1 lib e2 studio e3 studio e4 studio e5 city w1 lib w2 lib w3 lib w4 lib "
        "s1 lib s2 city s3 studio s4 studio s5 street s6 studio s7 studio q1 lib q2 lib q3 studio q4 lib r1 street r2 street r3 street r4 studio r5 city "
        "v1 park v2 park v3 park v4 bats v5 bats v6 studio t1 earth t2 storm t3 storm t4 earth t5 storm b1 lib b2 lib b3 studio b4 city b5 studio b6 studio b7 city "
        "g1 earth g2 dogs g3 dogs g4 dogs z1 lib z2 lib z3 lib z4 lib z5 lib endcard black").split()
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
ON = m['on']; SNAP = m['back']; S = lambda k: span[k][0]
def wins(kinds, mute=None):
    w = []
    for s in order:
        if setof[s] in kinds:
            a, b = span[s]
            if w and abs(w[-1][1] - a) < 0.05: w[-1] = (w[-1][0], b)
            else: w.append((a, b))
    if mute:  # clip out the (ON, SNAP) window
        out = []
        for a, b in w:
            if b <= mute[0] or a >= mute[1]: out.append((a, b)); continue
            if a < mute[0]: out.append((a, mute[0]))
            if b > mute[1]: out.append((mute[1], b))
        w = out
    return w or [(0, 0.001)]
AMB = [('amb_lib', {'lib'}, 0.11, (ON, SNAP)), ('amb_street', {'street'}, 0.11, None), ('amb_city', {'city'}, 0.10, None), ('amb_studio', {'studio'}, 0.05, None), ('amb_park', {'park'}, 0.11, None),
       ('amb_night', {'bats', 'storm'}, 0.10, None), ('amb_space', {'earth'}, 0.09, None), ('amb_garden', {'dogs'}, 0.10, None)]
sfx = [('sfx_tick', 0.3, 0.3), ('sfx_paper', m['secret'], 0.5), ('sfx_pop', m['whispering'], 0.3), ('sfx_door', S('d1') + 0.2, 0.45), ('sfx_page', S('d2') + 0.2, 0.5), ('sfx_tick', S('d3'), 0.3), ('sfx_ding', m['eight'], 0.35), ('sfx_pop', m['considers'], 0.3),
       ('sfx_slowdown', ON - 0.35, 0.7), ('sfx_drop', ON + 0.1, 0.6), ('sfx_needle', S('e2') + 0.1, 0.55), ('sfx_steps', S('e3'), 0.4), ('sfx_counter', S('e4') + 0.1, 0.4), ('sfx_ding', m['slower'], 0.35), ('sfx_whoosh', S('e5'), 0.35),
       ('sfx_whisper', m['whispers'], 0.7), ('sfx_shimmer', m['whispers'] + 0.2, 0.4), ('sfx_shimmer', S('w2'), 0.35), ('sfx_tick', S('w3'), 0.3), ('sfx_steps', m['walks'], 0.45),
       ('sfx_steps', S('s1'), 0.45), ('sfx_boomsmall', S('s1') + 0.4, 0.6), ('sfx_boomsmall', S('s1') + 0.8, 0.6), ('sfx_boomsmall', S('s1') + 1.2, 0.6), ('sfx_whoosh', S('s2'), 0.3), ('sfx_pop', m['foot'], 0.3), ('sfx_crack', m['mach3'], 0.6),
       ('sfx_boomsmall', S('s4') + 0.3, 0.6), ('sfx_boomsmall', S('s4') + 0.8, 0.6), ('sfx_boom', m['boom'], 0.8), ('sfx_thunderclap', m['thunderclap'], 0.7), ('sfx_needle', S('s6'), 0.5), ('sfx_pop', S('s7') + 0.2, 0.3),
       ('sfx_shush', m['shush'], 0.8), ('sfx_crack', m['shush'] + 0.15, 0.6), ('sfx_pop', m['mach20'], 0.3), ('sfx_boom', m['shboom'], 0.9), ('sfx_papers', m['shboom'] + 0.1, 0.6), ('sfx_books', m['shboom'] + 0.3, 0.6), ('sfx_gasp', m['shboom'] + 0.4, 0.5),
       ('sfx_carpass', m['car'], 0.8), ('sfx_carpass', S('r2') + 0.2, 0.8), ('sfx_shockwave', m['dragging'], 0.8), ('sfx_hat', m['dragging'] + 0.2, 0.5), ('sfx_glass', m['dragging'] + 0.5, 0.6), ('sfx_needle', S('r4'), 0.5), ('sfx_carpass', S('r5') + 0.3, 0.6),
       ('sfx_rain', m['rain'], 0.6), ('sfx_boomsmall', m['rain'] + 0.5, 0.45), ('sfx_pigeon', m['pigeons'], 0.6), ('sfx_crack', m['pigeons'] + 0.3, 0.45), ('sfx_pigeon', S('v3'), 0.6), ('sfx_bat', m['bats'], 0.6), ('sfx_sonar', m['bats'] + 0.3, 0.45), ('sfx_bat', S('v5'), 0.6), ('sfx_squeak', m['concerned'], 0.5), ('sfx_ding', S('v6') + 0.2, 0.3),
       ('sfx_lightning', m['fortyfour'], 0.6), ('sfx_lightning', S('t1') + 0.7, 0.5), ('sfx_lightning', S('t2') + 0.1, 0.7), ('sfx_moo', S('t3') + 0.4, 0.5), ('sfx_lightning', S('t4') + 0.2, 0.5), ('sfx_lightning', S('t4') + 0.8, 0.5), ('sfx_heavysteps', m['walking2'], 0.7),
       ('sfx_snap', SNAP - 0.9, 0.8), ('sfx_boom', SNAP, 0.8), ('sfx_gasp', SNAP + 0.3, 0.5), ('sfx_shimmer', S('b2'), 0.35), ('sfx_pop', m['seven'], 0.3), ('sfx_counter', S('b3') + 0.2, 0.35), ('sfx_whoosh', S('b4'), 0.3), ('sfx_zip', m['twenty'] - 0.2, 0.6), ('sfx_click', m['twenty'] + 0.15, 0.7), ('sfx_slide', S('b6') + 0.2, 0.5), ('sfx_chirp', m['pitched'], 0.5), ('sfx_boom', S('b7') + 0.1, 0.6),
       ('sfx_whoosh', S('g1'), 0.3), ('sfx_dogalert', m['dogs'] + 0.3, 0.6), ('sfx_barks', S('g2') + 0.3, 0.6), ('sfx_click', m['click'], 0.7), ('sfx_dogalert', m['click'] + 0.15, 0.6), ('sfx_dogsigh', m['impressed'] + 0.2, 0.7),
       ('sfx_click', m['reaches'] + 0.1, 0.7), ('sfx_hmm', m['reaches'] + 0.45, 0.6), ('sfx_pop', S('z2') + 0.3, 0.3), ('sfx_page', m['safe'] + 0.3, 0.5), ('sfx_dogalert', m['knows'], 0.6), ('sfx_pop', S('z5') + 0.1, 0.3)]
prev = None
for s in order:
    k = setof[s]
    if k in ('studio', 'city', 'earth') and k != prev and prev is not None: sfx.append(('sfx_whoosh', max(0, span[s][0] - 0.25), 0.28))
    prev = k
missing = [n for n, _, _ in sfx if not os.path.exists(os.path.join(A, n + '.mp3'))] + [n for n, _, _, _ in AMB if not os.path.exists(os.path.join(A, n + '.mp3'))]
if missing or not os.path.exists(os.path.join(A, 'music_sound.mp3')): print('MISSING AUDIO', missing); sys.exit(1)
inputs = ['-i', video, '-i', os.path.join(ROOT, 'voice', 'sound_final.mp3'), '-i', os.path.join(A, 'music_sound.mp3')]
for name, _, _, _ in AMB: inputs += ['-stream_loop', '-1', '-i', os.path.join(A, name + '.mp3')]
for name, _, _ in sfx: inputs += ['-i', os.path.join(A, name + '.mp3')]
F = 'aformat=sample_rates=48000:channel_layouts=stereo'
win = lambda ws: '+'.join(f"between(t,{a:.3f},{b:.3f})" for a, b in ws)
f = [f"[1:a]{F},apad=whole_dur={vd:.3f}[v]",
     f"[2:a]{F},atrim=0:{vd:.3f},volume=0.17,afade=t=in:d=1.5,afade=t=out:st={vd-2.5:.3f}:d=2.5[mu]"]
labels = ['[v]', '[mu]']
for i, (name, kinds, vol, mute) in enumerate(AMB):
    f.append(f"[{3+i}:a]{F},atrim=0:{vd:.3f},volume={vol},volume=enable='not({win(wins(kinds, mute))})':volume=0[am{i}]"); labels.append(f'[am{i}]')
base = 3 + len(AMB)
for i, (name, tt, vol) in enumerate(sfx):
    d = int(tt * 1000); f.append(f"[{base+i}:a]{F},volume={vol},adelay={d}|{d}[s{i}]"); labels.append(f'[s{i}]')
f.append(f"{''.join(labels)}amix=inputs={len(labels)}:duration=first:normalize=0,alimiter=limit=0.95:level=0,loudnorm=I=-14:TP=-1.5:LRA=11[a]")
final = os.path.join(OUT, 'poor_dave_14_sound_walking_pace.mp4')
subprocess.run(['ffmpeg', '-y', '-v', 'error'] + inputs + ['-filter_complex', ';'.join(f), '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', final], check=True)
print('final', final, len(sfx), 'sfx')
