"""Downsample a binary Gaussian PLY for the test renderer; retain DC colour."""
import sys, numpy as np
src,dst=sys.argv[1:]
fields=[]
with open(src,'rb') as f:
    assert f.readline().strip()==b'ply'
    assert f.readline().strip()==b'format binary_little_endian 1.0'
    n=0
    vertex=False
    for line in f:
        if line.strip()==b'end_header': break
        words=line.decode('ascii').split()
        if words[:1]==['element']:
            vertex=words[1]=='vertex'
            if vertex: n=int(words[2])
            elif not n: raise ValueError('Vertex must be first')
        if words[:1]==['property'] and vertex:
            assert words[1] in ('float','float32')
            fields.append(words[2])
    start=f.tell()
wanted=['x','y','z','scale_0','scale_1','scale_2','rot_0','rot_1','rot_2','rot_3','opacity','f_dc_0','f_dc_1','f_dc_2']
assert n>0 and n<=30000000 and all(k in fields for k in wanted)
a=np.memmap(src,mode='r',dtype='<f4',offset=start,shape=(n,len(fields)))
step=max(1,(n+319999)//320000)
b=np.asarray(a[::step][:,[fields.index(k) for k in wanted]],dtype='<f4')
b=b[np.isfinite(b).all(axis=1)]
assert len(b)>0
with open(dst,'wb') as f:
    f.write(('ply\nformat binary_little_endian 1.0\nelement vertex '+str(len(b))+'\n'+''.join('property float '+k+'\n' for k in wanted)+'end_header\n').encode())
    f.write(b.tobytes())
print('Prepared',len(b),'of',n,'Gaussians')
