/** Cheap hysteresis. Never assume a headless test profile equals player hardware. */
export type QualityTier='high'|'normal'|'economy';
export function recommendedTier(samples:readonly number[],current:QualityTier):QualityTier{
 if(samples.length<90)return current;
 const s=samples.filter(n=>Number.isFinite(n)&&n>0&&n<250).sort((a,b)=>a-b);
 if(s.length<90)return current;
 const p75=s[Math.floor(s.length*.75)];
 if(current==='high'&&p75>26)return'normal';
 if(current==='normal'&&p75>37)return'economy';
 if(current==='economy'&&p75<23)return'normal';
 return current;
}
