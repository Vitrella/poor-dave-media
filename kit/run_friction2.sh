cd /home/claude/poordave
A=h1,h2,d1,d2,d3,d4,e1,e2,e3,e4,j1,j2,c1,c2,c3,c4,c5,g1,g2,g3
B=g4,b1,b2,b3,n1,n2,n3,n4,s1,s2,s3,s4,k1,k2,a1,a2,a3,z1,z2,endcard
PAGE=friction2.html OUTDIR=out_friction2 node render/render.js --scale 0.75 --shots $A > out_friction2_A.log 2>&1 &
PAGE=friction2.html OUTDIR=out_friction2 node render/render.js --scale 0.75 --shots $B > out_friction2_B.log 2>&1 &
wait
