import {ffmpegBinDir} from '../packages/core/src/common/server/ffmpeg-dir';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
async function main(){
 const dir=await ffmpegBinDir();
 for(const name of ['ffmpeg','ffprobe']){
  const file=path.join(dir,name+(process.platform==='win32'?'.exe':''));
  if(process.platform==='win32'&&fs.lstatSync(file).isSymbolicLink())throw new Error('Expected real executable');
  console.log(execFileSync(file,['-version'],{encoding:'utf8'}).split(/\r?\n/)[0]);
 }
 if(await ffmpegBinDir()!==dir)throw new Error('Cache mismatch');
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});
