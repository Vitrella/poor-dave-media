#!/bin/bash
# usage: ./stills_sound.sh <round> [ONLY=a,b] [FRAC=0.6]
cd /home/claude/poordave
R=$1; shift
OUT=frames/snd_$R PAGE=sound.html SCALE=${SCALE:-0.4} ONLY=$ONLY FRAC=${FRAC:-0.6} node render/stills_all.js 2>&1 | tail -3
ls frames/snd_$R/*.jpg | sort > /tmp/snd_list_$R.txt
python3 make_sheet.py frames/sheet_snd_${R}_a.jpg 6 $(head -36 /tmp/snd_list_$R.txt)
python3 make_sheet.py frames/sheet_snd_${R}_b.jpg 6 $(tail -n +37 /tmp/snd_list_$R.txt)
