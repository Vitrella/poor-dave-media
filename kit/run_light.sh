cd /home/claude/poordave
A=h1,h3,d2,d3,d5,e2,e3b,e5,n1,n2b,n4,p1,p3,t1,t3,t5,c1,c3,c5,l2,l4,x2,x4,x5b,y2,y4,y6,u1b,u3,z1b,z3,z5,z7,endcard
B=h2,d1,d2b,d4,e1,e3,e4,e5b,n2,n3,n5,p2,p4,t2,t4,t6,c2,c4,l1,l3,x1,x3,x5,y1,y3,y5,u1,u2,z1,z2,z4,z6,z8
PAGE=light.html OUTDIR=out_light node render/render.js --scale 0.75 --shots $A > out_l_A.log 2>&1 &
PAGE=light.html OUTDIR=out_light node render/render.js --scale 0.75 --shots $B > out_l_B.log 2>&1 &
wait
