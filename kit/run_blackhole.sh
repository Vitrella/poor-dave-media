cd /home/claude/poordave
A=h1,d1,d2,e1,e3,o1b,t1,t2,t3,s1,s2,s4,b1b,b2b,b3b,c1,c2,c3,i1b,x1,x2,x4,n1,n3,p1,z1b,z3,z5
B=h2,d1b,d3,e2,o1,o2,t1b,t2b,t3b,s1b,s3,b1,b2,b3,b4,c1b,c2b,i1,i3,x1b,x3,x5,n2,n4,z1,z2,z4,endcard
PAGE=blackhole.html OUTDIR=out_blackhole node render/render.js --scale 0.75 --shots $A > out_bh_A.log 2>&1 &
PAGE=blackhole.html OUTDIR=out_blackhole node render/render.js --scale 0.75 --shots $B > out_bh_B.log 2>&1 &
wait
