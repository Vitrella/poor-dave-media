cd /home/claude/poordave
A=h1,h3,d2,e1,e3,n2,n4,v1,v3,t1,t2,t4,p1,p3,p4b,g1,g3,w1,w3,w5,b2,b4,b6,c2,c4,f2,f4,z2,z4,endcard
B=h2,d1,d3,e2,n1,n3,n5,v2,v4,t1b,t3,t5,p2,p4,p5,g2,g4,w2,w4,b1,b3,b5,c1,c3,f1,f3,z1,z3,z5
PAGE=cheese.html OUTDIR=out_cheese node render/render.js --scale 0.75 --shots $A > out_c_A.log 2>&1 &
PAGE=cheese.html OUTDIR=out_cheese node render/render.js --scale 0.75 --shots $B > out_c_B.log 2>&1 &
wait
