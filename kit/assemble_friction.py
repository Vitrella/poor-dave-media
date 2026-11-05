#!/usr/bin/env python3
"""Concat per-shot MP4s of video 7 (friction doubled) and mix voice + music + ambience + SFX. Output: out_friction/poor_dave_07_friction_doubled.mp4"""
import json, subprocess, os, sys
ROOT = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(ROOT, 'out_friction'); A = os.path.join(ROOT, 'audio')
TL = json.load(open(os.path.join(ROOT, 'render', 'timeline_friction.json'))); m = TL['marks']; sc = {s['id']: s for s in TL['scenes']}
order = ['hook', 'dave_a', 'dave_b', 'event', 'jumper', 'cars_a', 'cars_b', 'engines', 'football', 'hands', 'stuck', 'back', 'after', 'end', 'endcard']
miss = [s for s in order if not os.path.exists(os.path.join(OUT, s + '.mp4'))]
if miss: print('MISSING', miss); sys.exit(1)
open(os.path.join(OUT, 'concat.txt'), 'w').write(''.join(f"file '{os.path.join(OUT, s + '.mp4')}'\n" for s in order))
video = os.path.join(OUT, 'video_silent.mp4')
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', os.path.join(OUT, 'concat.txt'), '-c', 'copy', video], check=True)
vd = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video], capture_output=True, text=True).stdout)
print('video', vd, 'timeline', TL['duration'])
ON = m['on']; SNAP = m['back']
sfx = [('sfx_fabric', 0.4, 0.5), ('sfx_ripple', ON - 0.3, 0.8), ('sfx_fabric', m['committed'], 0.5), ('sfx_screech', m['seven'] + 0.2, 0.9), ('sfx_engines', m['twothirds'], 0.7), ('sfx_kick', m['ball'] + 0.4, 0.9), ('sfx_zip', m['zip'] + 0.3, 0.8), ('sfx_snap', SNAP - 0.1, 0.8), ('sfx_fabric', m['including'] + 0.1, 1.0), ('sfx_ding', m['through'] + 1.5, 0.5)]
street = [(sc['cars']['start'], sc['hands']['start'])]
inputs = ['-i', video, '-i', os.path.join(ROOT, 'voice', 'friction_final.mp3'), '-i', os.path.join(A, 'music_friction.mp3'), '-stream_loop', '-1', '-i', os.path.join(A, 'amb_shop.mp3'), '-stream_loop', '-1', '-i', os.path.join(A, 'amb_street2.mp3')]
for name, _, _ in sfx: inputs += ['-i', os.path.join(A, name + '.mp3')]
F = 'aformat=sample_rates=48000:channel_layouts=stereo'
win = lambda ws: '+'.join(f"between(t,{a:.3f},{b:.3f})" for a, b in ws)
f = [f"[1:a]{F},apad=whole_dur={vd:.3f}[v]",
     f"[2:a]{F},atrim=0:{vd:.3f},volume=0.17,afade=t=in:d=1.5,afade=t=out:st={vd-2.5:.3f}:d=2.5[mu]",
     f"[3:a]{F},atrim=0:{vd:.3f},volume=0.08,volume=enable='{win(street)}':volume=0,afade=t=out:st={vd-3.6:.3f}:d=3.2[ak]",
     f"[4:a]{F},atrim=0:{vd:.3f},volume=0.12,volume=enable='not({win(street)})':volume=0[as]"]
labels = ['[v]', '[mu]', '[ak]', '[as]']
for i, (name, t, vol) in enumerate(sfx):
    d = int(t * 1000); f.append(f"[{5+i}:a]{F},volume={vol},adelay={d}|{d}[s{i}]"); labels.append(f'[s{i}]')
f.append(f"{''.join(labels)}amix=inputs={len(labels)}:duration=first:normalize=0,alimiter=limit=0.95,loudnorm=I=-14:TP=-1.5:LRA=11[a]")
final = os.path.join(OUT, 'poor_dave_07_friction_doubled.mp4')
subprocess.run(['ffmpeg', '-y', '-v', 'error'] + inputs + ['-filter_complex', ';'.join(f), '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', final], check=True)
print('final', final, subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration:stream=codec_name,width,height,r_frame_rate', '-of', 'csv=p=0', final], capture_output=True, text=True).stdout.strip())
