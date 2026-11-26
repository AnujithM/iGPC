const r=(a,o,i,s=!1)=>`@group(0) @binding(${a}) var<storage,${s?"read_write":"read"}> ${o}:array<${i}>;
`,t="vec2<f32>",u="vec2<f32>(0.0)",c=`var<workgroup> sh:array<vec2<f32>,64>;
fn sumWG(a:vec2<f32>,t:u32)->vec2<f32>{
 sh[t]=a;workgroupBarrier();
 for(var k=32u;k>0u;k=k>>1u){if(t<k){sh[t]+=sh[t+k];}workgroupBarrier();}
 let val=sh[0];workgroupBarrier();return val;
}`,e=(a=64)=>`@compute @workgroup_size(${a}) fn main(@builtin(local_invocation_index) t:u32,@builtin(workgroup_id) w:vec3<u32>){`;function n(a,o,{head:i=0,isHead:s=!1,gelu:l=!1,sg:f=!1}={}){const v=s?`out[r+${i}u]=a.x;out[r+${59049+i}u]=a.y;`:"out[r]=a;";return(f?`enable subgroups;
`:"")+r(0,"ww","vec4<f32>")+r(1,"bb","f32")+r(2,"x",t)+r(3,"out",s?"f32":t,!0)+(f?"":"var<workgroup> sh:array<vec2<f32>,128>;")+(l?`fn erf2(x:vec2<f32>)->vec2<f32>{
  let u=abs(x);let t=1.0/(1.0+0.3275911*u);
  let y=(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-0.284496736)*t+0.254829592)*t;
  return sign(x)*(1.0-y*exp(-u*u));
 }`:"")+e(128)+`
 let lane=t&31u;let r=w.x*4u+(t>>5u);var a=${u};
 if(r<${o}u){for(var col=lane*4u;col<${a}u;col+=128u){
 let q=ww[(r*${a}u+col)/4u];
 a=fma(x[col],vec2<f32>(q.x),a);a=fma(x[col+1u],vec2<f32>(q.y),a);
 a=fma(x[col+2u],vec2<f32>(q.z),a);a=fma(x[col+3u],vec2<f32>(q.w),a);}}
 ${f?[16,8,4,2,1].map(x=>`a+=subgroupShuffleXor(a,${x}u);`).join(""):"sh[t]=a;workgroupBarrier();for(var k=16u;k>0u;k=k>>1u){if(lane<k){sh[t]+=sh[t+k];}workgroupBarrier();}a=sh[t];"}
 if(lane==0u && r<${o}u){a+=vec2<f32>(bb[r+${i}u]);${l?"a=0.5*a*(1.0+erf2(a*0.7071067811865475));":""}${v}}}`}const p=r(0,"qkv",t)+r(1,"kv",t,!0)+r(2,"pos","u32")+e()+`
 let i=w.x*64u+t;kv[pos[0]*2048u+i]=qkv[1024u+i];}`,m=r(0,"qkv",t)+r(1,"kv",t)+r(2,"out",t,!0)+r(3,"pos","u32")+c+e()+`
 let h=w.x/8u;let s=w.x%8u;var a=${u};
 for(var i=t;i<256u;i+=64u){let k=h*256u+i;a=fma(qkv[k],kv[s*2048u+k],a);}
 let val=sumWG(a,t)*0.0625;if(t==0u){out[w.x]=select(vec2<f32>(-1e30),val,s<=pos[0]);}}`,k=r(0,"scores",t)+r(1,"kv",t)+r(2,"out",t,!0)+e()+`
 let d=w.x*64u+t;let h=d/256u;var mx=vec2<f32>(-1e30);
 for(var i=0u;i<8u;i++){mx=max(mx,scores[h*8u+i]);}
 var a=${u};var b=${u};
 for(var i=0u;i<8u;i++){let p=exp(scores[h*8u+i]-mx);a=fma(p,kv[i*2048u+1024u+d],a);b+=p;}
 out[d]=a/b;}`;function b(a){const o=a?2048:0;return r(0,"x",t)+r(1,"y",t)+r(2,"nw","f32")+r(3,"out",t,!0)+c+e()+`
 var a=${u};for(var i=t;i<1024u;i+=64u){a+=x[i]+y[i];}
 let mean=sumWG(a,t)/1024.0;var b=${u};for(var i=t;i<1024u;i+=64u){let d=(x[i]+y[i])-mean;b=fma(d,d,b);}
 let inv=inverseSqrt(sumWG(b,t)/1024.0+1e-5);
 for(var i=t;i<1024u;i+=64u){out[i]=((x[i]+y[i])-mean)*inv*nw[${o}u+i]+vec2<f32>(nw[${o+1024}u+i]);}}`}const w=r(0,"a","f32")+r(1,"mods","f32")+r(2,"x",t)+r(3,"out",t,!0)+c+e()+`
 let idx=w.x;var acc=${u};for(var i=t;i<1024u;i+=64u){acc=fma(x[i],vec2<f32>(a[idx*1024u+i]),acc);}
 let val=sumWG(acc,t);if(t==0u){let e=idx/32u;let r=idx%32u;out[idx]=val*mods[e*64u+r]+vec2<f32>(mods[e*64u+32u+r]);}}`,$=r(0,"b","f32")+r(1,"x",t)+r(2,"scale","f32")+r(3,"out",t,!0)+e()+`
 let j=w.x*64u+t;let e=j/1024u;var acc=${u};for(var i=0u;i<32u;i++){acc=fma(x[e*32u+i],vec2<f32>(b[j*32u+i]),acc);}out[j]=acc*scale[e];}`,d=r(0,"x",t)+r(1,"m","f32")+r(2,"out",t,!0)+c+e()+`
 let e=w.x;var a=${u};for(var i=t;i<1024u;i+=64u){let u=x[e*1024u+i];a=fma(u,u,a);}
 let den=sqrt(sumWG(a,t))+1e-6;for(var i=t;i<1024u;i+=64u){let j=e*1024u+i;out[j]=m[j]*(x[j]/den);}}`,g=r(0,"base",t)+r(1,"res",t)+r(2,"g","f32")+r(3,"out",t,!0)+e()+`
 let i=w.x*64u+t;let q=res[i];let b=res[1024u+i];let rt=res[2048u+i];let rs=res[3072u+i];
 let bg=clamp(g[0],0.0,1.0);let sg=clamp(g[1],0.0,1.0);let pr=clamp(g[0]*g[1],0.0,1.0);
 out[i]=vec2<f32>(((base[i].x+(1.0-bg)*q.x)+bg*(1.0-sg)*b.x)+(bg*sg)*(rt.x+(rs.x-rt.x)),
 (base[i].y+(1.0-pr)*q.y)+pr*rt.y);}`;export{w as adaptDown,d as adaptNorm,$ as adaptUp,k as attend,n as dense,b as layerNorm,g as mix,m as scores,p as setKV};
