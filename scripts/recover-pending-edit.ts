import fs from 'node:fs/promises';
import path from 'node:path';
import { ROOT,projectDir } from '../packages/core/src/common/server/config';
import {readEditor} from '../packages/core/src/modules/editor/server/store';
import {executeEditorTool,EditorToolCall} from '../packages/core/src/modules/editor/server/tools';
async function main(){
 const id='c920e7ce-0';
 const run=path.join(projectDir(id),'editor-runs','55dc9f56-b2c2-485b-82c6-548e2fe2323b');
 const call=EditorToolCall.parse(JSON.parse(await fs.readFile(path.join(run,'request-00011.json'),'utf8')));
 const before=readEditor(id);
 if(call.tool!=='project.edit'||before.revision!==call.expectedRevision||before.edl.sequences.some(s=>s.items.length)) throw new Error('Project changed; refusing stale recovery.');
 await fs.writeFile(path.join(ROOT,'verification','recovery-before.json'),JSON.stringify(before,null,2));
 const result=await executeEditorTool(id,call);
 await fs.writeFile(path.join(run,'response-00011.json'),JSON.stringify({ok:true,data:result},null,2));
 console.log(JSON.stringify({recovered:true,project:id,state:result}));
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});
