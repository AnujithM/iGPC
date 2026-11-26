const e=(t,o,l,f=!1)=>`@group(0) @binding(${t}) var<storage,${f?"read_write":"read"}> ${o}:array<${l}>;
`,r="vec2<f32>",u="vec2<u32>",p=59049,a="@compute @workgroup_size(128) fn main(@builtin(local_invocation_index) t:u32,@builtin(workgroup_id) w:vec3<u32>){";function s(t){return`var<workgroup> z:array<vec2<f32>,128>;
fn red(a:vec2<f32>,t:u32)->vec2<f32>{z[t]=a;workgroupBarrier();
 for(var k=64u;k>0u;k=k>>1u){if(t<k){z[t]=${t==="max"?"max(z[t],z[t+k])":"z[t]+z[t+k]"};}workgroupBarrier();}return z[0];}`}const c=e(0,"logits","f32")+e(1,"groups",r,!0)+s("max")+a+`
 var m=vec2<f32>(-3.4e38);for(var j=t;j<512u;j+=128u){let i=w.x*512u+j;if(i<59049u){m=max(m,vec2<f32>(logits[i],logits[i+59049u]));}}
 let r=red(m,t);if(t==0u){groups[w.x]=r;}}`;function b(t){return e(0,"groups",r)+e(1,"out",r,!0)+s(t)+a+`
 let r=red(groups[t],t);if(t==0u){out[0]=r;}}`}const n=e(0,"logits","f32")+e(1,"mx",r)+e(2,"ex",r,!0)+e(3,"groups",r,!0)+s("sum")+a+`
 var sum=vec2<f32>(0);for(var j=t;j<512u;j+=128u){let i=w.x*512u+j;if(i<59049u){
 let p=exp(vec2<f32>(logits[i],logits[i+59049u])-mx[0]);ex[i]=p;sum+=p;}}
 let r=red(sum,t);if(t==0u){groups[w.x]=r;}}`,i="fn before(a:vec2<u32>,b:vec2<u32>)->bool{return a.x>b.x || (a.x==b.x && a.y<b.y);}",v=e(0,"ex",r)+e(1,"den",r)+e(2,"probs",r,!0)+e(3,"keys",u,!0)+a+`
 for(var j=t;j<512u;j+=128u){let i=w.x*512u+j;var r=0.0;if(i<59049u){let p=ex[i]/den[0];probs[i]=p;r=p.y;}keys[i]=vec2<u32>(bitcast<u32>(r),i);}}`;function g(t,o=!1){return e(0,"keys",u,!0)+(t?"":e(1,"param","u32"))+i+`var<workgroup> s:array<vec2<u32>,512>;
 fn stage(j:u32,k:u32,base:u32,t:u32){
 for(var pair=t;pair<256u;pair+=128u){let lo=(pair/j)*(2u*j)+(pair%j);let hi=lo+j;let a=s[lo];let b=s[hi];
 if(before(b,a)==(((base+lo)&k)==0u)){s[lo]=b;s[hi]=a;}}
 workgroupBarrier();}`+a+`
 let base=w.x*512u;for(var i=t;i<512u;i+=128u){s[i]=keys[base+i];}workgroupBarrier();
 ${t?"for(var k=2u;k<=512u;k*=2u){for(var j=k>>1u;j>0u;j=j>>1u){stage(j,k,"+(o?"0u":"base")+",t);}}":"for(var j=256u;j>0u;j=j>>1u){stage(j,param[0],base,t);}"}
 for(var i=t;i<512u;i+=128u){keys[base+i]=s[i];}}`}const k=e(0,"keys",u,!0)+e(1,"param","u32")+i+a+`
 let p=w.x*128u+t;let j=param[1];let lo=(p/j)*(2u*j)+(p%j);let hi=lo+j;let a=keys[lo];let b=keys[hi];
 if(before(b,a)==((lo&param[0])==0u)){keys[lo]=b;keys[hi]=a;}}`,d=e(0,"src",u)+e(1,"dst",u,!0)+e(2,"width","u32")+i+`
var<workgroup> tile:array<vec2<u32>,512>;
var<workgroup> edge:array<u32,2>;
fn split(base:u32,h:u32,k:u32)->u32{
 var lo=k-min(k,h);var hi=min(k,h);
 while(lo<hi){let a=(lo+hi)/2u;let b=k-a;
 if(b>0u && a<h && before(src[base+a],src[base+h+b-1u])){lo=a+1u;}else{hi=a;}}
 return lo;
}`+a+`
 let h=width[0];let dest=w.x*512u;let base=(dest/(2u*h))*(2u*h);let k=dest-base;
 if(t<2u){edge[t]=split(base,h,k+512u*t);}workgroupBarrier();
 let na=edge[1]-edge[0];let nb=512u-na;let b0=base+h+k-edge[0];
 for(var i=t;i<512u;i+=128u){if(i<na){tile[i]=src[base+edge[0]+i];}
 else{tile[i]=src[b0+i-na];}}workgroupBarrier();
 let d=t*4u;var lo=d-min(d,nb);var hi=min(d,na);
 while(lo<hi){let a=(lo+hi)/2u;let b=d-a;
 if(b>0u && a<na && before(tile[a],tile[na+b-1u])){lo=a+1u;}else{hi=a;}}
 var a=lo;var b=d-a;
 for(var i=0u;i<4u;i++){if(a<na && (b>=nb || before(tile[a],tile[na+b]))){dst[dest+d+i]=tile[a];a++;}
 else{dst[dest+d+i]=tile[na+b];b++;}}
}`,x=e(0,"keys",u)+e(1,"groups",r,!0)+s("sum")+a+`
 var a=0.0;for(var j=t;j<512u;j+=128u){a+=bitcast<f32>(keys[w.x*512u+j].x);}let r=red(vec2<f32>(a,0),t);if(t==0u){groups[w.x]=r;}}`,j=e(0,"keys",u)+e(1,"groups",r)+e(2,"cut",u,!0)+`@compute @workgroup_size(1) fn main(){
 var g=0u;var s=0.0;while(g<127u && s+groups[g].x<=0.9){s+=groups[g].x;g++;}
 var i=g*512u;let end=min(59049u,i+512u);while(i+1u<end && s+bitcast<f32>(keys[i].x)<=0.9){s+=bitcast<f32>(keys[i].x);i++;}
 cut[0]=keys[i];}`,m=e(0,"probs",r)+e(1,"cut",u)+e(2,"groups",r,!0)+s("sum")+i+a+`
 var a=vec2<f32>(0);for(var j=t;j<512u;j+=128u){let i=w.x*512u+j;if(i<59049u){let p=probs[i];
 if(!before(cut[0],vec2<u32>(bitcast<u32>(p.y),i))){a+=p;}}}
 let s=red(a,t);if(t==0u){groups[w.x]=s;}}`,w=e(0,"probs",r)+e(1,"cut",u)+e(2,"groups",r)+e(3,"draws","f32")+e(4,"pos","u32")+e(5,"codes","u32",!0)+i+`@compute @workgroup_size(1) fn main(){
 var total=vec2<f32>(0);for(var g=0u;g<128u;g++){total+=groups[g];}
 let fallback=total.x<0.001;let d=min(draws[pos[0]],0.99999988079071045)*select(total.x,total.y,fallback);
 var s=0.0;var block=0u;var last=0u;var crossed=false;
 for(var g=0u;g<128u;g++){let mass=select(groups[g].x,groups[g].y,fallback);
 if(mass>0.0){last=g;}if(s+mass>d){block=g;crossed=true;break;}s+=mass;block=last;}
 var chosen=0u;for(var j=0u;j<512u;j++){let i=block*512u+j;if(i>=59049u){break;}
 let p=probs[i];if(!before(cut[0],vec2<u32>(bitcast<u32>(p.y),i))){let a=select(p.x,p.y,fallback);if(a>0.0){chosen=i;s+=a;if(crossed&&s>d){break;}}}}
 codes[pos[0]]=chosen;}`;function h(t,o=8192){return e(0,"tab","f32")+e(1,"inputData","f32")+e(2,"codes","u32")+e(3,"pos","u32")+e(4,"x",r,!0)+a+`
 let j=pos[0];let i=w.x*128u+t;var value=inputData[i];
 if(j>0u){let ix=codes[j-1u];if(ix/${o}u!=${t}u){return;}value=tab[(ix%${o}u)*1024u+i]+inputData[1024u+i];}
 else if(${t}u!=0u){return;}x[i]=vec2<f32>(value+inputData[2048u+j*1024u+i]);}`}export{c as blockMax,h as embedding,n as expSum,j as findCut,m as mass,d as mergeRuns,v as norm,w as selectCode,k as sortGlobal,g as sortLocal,x as sortedMass,b as total};
