cd /home/claude/poordave
A=h1,d1,e1,e3,s2,c1,c2,v1b,v2b,v4,g1,g3,p1b,p3,l1b,l3,b1b,b3,o2,o4,m2,k1,k3,z1b,z3,z5,endcard
B=h2,d2,e2,s1,s3,c1b,v1,v2a,v3,v4b,g2,p1a,p2,l1,l2,b1,b2,o1,o3,m1,m3,k2,z1,z2,z4,z6
PAGE=plastic.html OUTDIR=out_plastic node render/render.js --scale 0.75 --shots $A > out_plastic_A.log 2>&1 &
PAGE=plastic.html OUTDIR=out_plastic node render/render.js --scale 0.75 --shots $B > out_plastic_B.log 2>&1 &
wait
