import {readFile,readdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
async function files(dir){const out=[];for(const n of await readdir(dir)){const p=path.join(dir,n);if((await stat(p)).isDirectory())out.push(...await files(p));else if(n.endsWith('.html'))out.push(p)}return out}
const pages=await files(root),errors=[],titles=new Set();
const exists=async p=>{try{return (await stat(p)).isFile()}catch{return false}};
for(const file of pages){const html=await readFile(file,'utf8'),label=path.relative(root,file),title=html.match(/<title>(.*?)<\/title>/s)?.[1];
 if(/^google[a-f0-9]+\.html$/.test(label)){if(html.trim()!==`google-site-verification: ${label}`)errors.push(label+': invalid verification file');continue}
 if(!title||titles.has(title))errors.push(label+': missing or duplicate title');titles.add(title);
 if((html.match(/<h1\b/g)||[]).length!==1)errors.push(label+': expected one H1');
 if((html.match(/<meta name="description" /g)||[]).length!==1)errors.push(label+': description count');
 if((html.match(/rel="canonical"/g)||[]).length!==1)errors.push(label+': canonical count');
 if(!html.includes('name="twitter:card"')||!html.includes('property="og:image"'))errors.push(label+': sharing metadata');
 if(html.includes('rounakpro18.chatgpt.site'))errors.push(label+': old private origin');
 for(const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)){try{JSON.parse(match[1])}catch{errors.push(label+': invalid structured data')}}
 for(const image of html.matchAll(/<img\b[^>]*>/g))if(!/\balt="/.test(image[0]))errors.push(label+': image without alt');
 for(const [,raw] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
  if(/^(https?:|mailto:|tel:|#|data:)/.test(raw))continue;
  const url=raw.split(/[?#]/)[0];if(!url)continue;const target=path.resolve(root,url.startsWith('/')?url.slice(1):path.join(path.dirname(label),url));
  if(target!==path.resolve(root)&&!target.startsWith(root))errors.push(label+': invalid local path '+raw);
  else if(!(await exists(target))&&!(await exists(target+'.html'))&&!(await exists(path.join(target,'index.html'))))errors.push(label+': broken local link '+raw);
 }
}
const home=await readFile(path.join(root,'index.html'),'utf8');for(const phrase of ['StyleStack','AI or Automation','privacy-notice','faq-list','/work/stylestack','/services/ai-automation'])if(!home.includes(phrase))errors.push('homepage lacks static '+phrase);
const app=await readFile(path.join(root,'app.js'),'utf8');if(!app.includes("$('#services').replaceChildren()")||!app.includes("$('#markets').replaceChildren()"))errors.push('SSR enhancement duplicates content');
const robots=await readFile(path.join(root,'robots.txt'),'utf8');for(const bot of ['OAI-SearchBot','Claude-SearchBot'])if(!robots.includes(bot))errors.push('missing search bot '+bot);
const sitemap=await readFile(path.join(root,'sitemap.xml'),'utf8');if(sitemap.includes('/404'))errors.push('404 indexed in sitemap');
if(errors.length){console.error(errors.join('\n'));process.exit(1)}console.log(`SEO checks passed: ${pages.length} HTML pages; titles, H1s, canonical tags, schema, local links, static content, and crawler access.`);
