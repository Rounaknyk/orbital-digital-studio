import {readFile,writeFile,readdir,unlink} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
let html=await readFile(path.join(root,'index.html'),'utf8');
for(const name of ['app.js','style.css']){
 const data=await readFile(path.join(root,name));const ext=path.extname(name),stem=path.basename(name,ext),target=`${stem}-${createHash('sha256').update(data).digest('hex').slice(0,10)}${ext}`;
 for(const old of await readdir(path.join(root,'assets')))if(new RegExp(`^${stem}-[a-f0-9]{10}\\${ext}$`).test(old)&&old!==target)await unlink(path.join(root,'assets',old));
 await writeFile(path.join(root,'assets',target),data);
 html=html.replace(new RegExp(`(?:assets/${stem}-[a-f0-9]{10}\\${ext}|${name.replace('.','\\.')})`,'g'),`assets/${target}`);
}
const contentHash=createHash('sha256').update(await readFile(path.join(root,'content.js'))).digest('hex').slice(0,10);
html=html.replace(/content\.js(?:\?v=[a-f0-9]+)?/g,`content.js?v=${contentHash}`);
// Generate crawler-visible metadata from the same central content file.
const context={window:{}};vm.runInNewContext(await readFile(path.join(root,'content.js'),'utf8'),context);
const C=context.window.CONTENT,seo=C.seo||{},siteUrl=(process.env.SITE_URL||seo.siteUrl||'').replace(/\/$/,'');
const escape=value=>String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
html=html.replace(/<!-- SEO START -->[\s\S]*?<!-- SEO END -->/,'').replace(/<title>[\s\S]*?<\/title>/,'').replace(/<meta name="description"[^>]*>/,'');
if(C.enquiryServices)html=html.replace(/<fieldset>[\s\S]*?<\/fieldset>/,`<fieldset><legend>I’m looking for</legend>${C.enquiryServices.map((service,i)=>`<label><input type="radio" name="service" value="${escape(service.value)}"${i===0?' checked':''}><span>${escape(service.label)}</span></label>`).join('')}</fieldset>`);
const title=seo.title||C.brand,description=seo.description||C.intro,image=siteUrl+(seo.socialImage||'/social-preview-v1.png');
const schema={'@context':'https://schema.org','@graph':[{'@type':'Organization','@id':siteUrl+'/#organization',name:C.brand,url:siteUrl+'/',logo:siteUrl+'/icon-512.png',description,email:C.email,telephone:C.phoneHref.replace('tel:',''),hasOfferCatalog:{'@type':'OfferCatalog',name:'Digital development services',itemListElement:[{'@type':'Offer',itemOffered:{'@type':'Service',name:'Website design and development'}},{'@type':'Offer',itemOffered:{'@type':'Service',name:'Mobile app development'}},{'@type':'Offer',itemOffered:{'@type':'Service',name:'AI and workflow automation'}}]}},{'@type':'WebSite','@id':siteUrl+'/#website',url:siteUrl+'/',name:C.brand,description,publisher:{'@id':siteUrl+'/#organization'},inLanguage:'en'}]};
const metadata=`<!-- SEO START -->
<title>${escape(title)}</title>
<meta name="description" content="${escape(description)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta name="theme-color" content="#f3f1e9">
<link rel="canonical" href="${escape(siteUrl)}/">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta property="og:type" content="website">
<meta property="og:locale" content="en_US">
<meta property="og:site_name" content="${escape(C.brand)}">
<meta property="og:title" content="${escape(title)}">
<meta property="og:description" content="${escape(description)}">
<meta property="og:url" content="${escape(siteUrl)}/">
<meta property="og:image" content="${escape(image)}">
<meta property="og:image:secure_url" content="${escape(image)}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${escape(seo.socialImageAlt||title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escape(title)}">
<meta name="twitter:description" content="${escape(description)}">
<meta name="twitter:image" content="${escape(image)}">
<meta name="twitter:image:alt" content="${escape(seo.socialImageAlt||title)}">
<script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script>
<!-- SEO END -->`;
html=html.replace('</head>',metadata+'</head>');
// Useful introductory text also exists before JavaScript executes.
html=html.replace(/(<h1 id="headline">)[\s\S]*?(<\/h1>)/,`$1${C.hero.map(t=>`<span>${escape(t)}</span>`).join('')}$2`).replace(/(<p id="intro">)[\s\S]*?(<\/p>)/,`$1${escape(C.intro)}$2`).replace(/(<span data-brand>)[\s\S]*?(<\/span>)/g,`$1${escape(C.brand)}$2`);
await writeFile(path.join(root,'site.webmanifest'),JSON.stringify({name:C.brand,short_name:C.brand,start_url:'/',display:'browser',background_color:'#f3f1e9',theme_color:'#ff5b30',icons:[{src:'/icon-192.png',sizes:'192x192',type:'image/png'},{src:'/icon-512.png',sizes:'512x512',type:'image/png'}]},null,2));
await writeFile(path.join(root,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`);
await writeFile(path.join(root,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escape(siteUrl)}/</loc></url></urlset>`);
await writeFile(path.join(root,'index.html'),html);
console.log('Prepared fingerprinted CSS and JavaScript.');
