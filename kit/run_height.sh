cd /home/claude/poordave
A=h1,d1,d3,e2,g1,g3,w1,w3,i2,m1,m2b,m4,b1b,b2b,b3b,f1,f3,l1,c1,c3,k2,k3,r2,r4,o2,a1,a3,z1,z3,endcard
B=h2,d2,e1,e3,g2,g4,w2,i1,i3,m2,m3,b1,b2,b3,b4,f2,f3b,l2,c2,k1,k2b,r1,r3,o1,o3,a2,a4,z2,z4
PAGE=height.html OUTDIR=out_height node render/render.js --scale 0.75 --shots $A > out_h_A.log 2>&1 &
PAGE=height.html OUTDIR=out_height node render/render.js --scale 0.75 --shots $B > out_h_B.log 2>&1 &
wait
