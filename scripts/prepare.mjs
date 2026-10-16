import {readFile,writeFile,readdir,unlink} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
let html=await readFile(path.join(root,'index.html'),'utf8');
for(const name of ['app.js','style.css']){
 const data=await readFile(path.join(root,name));const ext=path.extname(name),stem=path.basename(name,ext),target=`${stem}-${createHash('sha256').update(data).digest('hex').slice(0,10)}${ext}`;
 for(const old of await readdir(path.join(root,'assets')))if(new RegExp(`^${stem}-[a-f0-9]{10}\\${ext}$`).test(old)&&old!==target)await unlink(path.join(root,'assets',old));
 await writeFile(path.join(root,'assets',target),data);
 html=html.replace(new RegExp(`(?:assets/${stem}-[a-f0-9]{10}\\${ext}|${name.replace('.','\\.')})`,'g'),`assets/${target}`);
}
await writeFile(path.join(root,'index.html'),html);
console.log('Prepared fingerprinted CSS and JavaScript.');
