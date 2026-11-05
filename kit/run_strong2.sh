cd /home/claude/poordave
A=h1,h2,d1,d2,d3,d4,e1,e2,e3,e4,e5,g1,g2,g3,g4,j1,j2,j3,j4,o1,o2,o3
B=b1,b2,b3,b4,n1,n2,n3,n4,n5,n6,a1,a2,a3,a4,k1,f1,f2,f3,z1,z2,z3,endcard
PAGE=strong2.html OUTDIR=out_strong2 node render/render.js --scale 0.75 --shots $A > out_strong2_A.log 2>&1 &
PAGE=strong2.html OUTDIR=out_strong2 node render/render.js --scale 0.75 --shots $B > out_strong2_B.log 2>&1 &
wait
