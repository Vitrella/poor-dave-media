cd /home/claude/poordave
A=h1,h3,d1,d3,d5,e2,e4,w1,w3,s1,s3,s5,s7,q2,q4,r2,r4,v1,v3,v5,t1,t3,t5,b2,b4,b6,g1,g3,z1,z3,z5,endcard
B=h2,d2,d4,e1,e3,e5,w2,w4,s2,s4,s6,q1,q3,r1,r3,r5,v2,v4,v6,t2,t4,b1,b3,b5,b7,g2,g4,z2,z4
PAGE=sound.html OUTDIR=out_sound node render/render.js --scale 0.75 --shots $A > out_s_A.log 2>&1 &
PAGE=sound.html OUTDIR=out_sound node render/render.js --scale 0.75 --shots $B > out_s_B.log 2>&1 &
wait
