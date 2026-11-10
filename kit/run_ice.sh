cd /home/claude/poordave
A=h1,d1,d3,e2,v1,v3,n1,n3,n5,f1,f4,a1,a4,c1,c3,c5,s1,s4,m1,l1,l3,l4,r2,z1,z3,endcard
B=h2,d2,e1,e3,e4,v2,v4,n2,n4,n6,f2,f3,a2,a3,c2,c4,c6,s2,s3,m2,m3,l2,r1,r3,z2,z4
PAGE=ice.html OUTDIR=out_ice node render/render.js --scale 0.75 --shots $A > out_ice_A.log 2>&1 &
PAGE=ice.html OUTDIR=out_ice node render/render.js --scale 0.75 --shots $B > out_ice_B.log 2>&1 &
wait
