import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
test('four and five digit requests execute in numeric order and return confirmed state', async () => {
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'agentcut-numbering-'));
  process.env.AGENTCUT_WORKSPACE=dir;
  const {createVideoProject}=await import('../../media/server/media-import');
  const {readEditor}=await import('../../editor/server/store');
  const {runEditorAgent}=await import('../server/editor-agent');
  const {db}=await import('../../../common/server/db');
  try {
    const {id}=await createVideoProject('Transport regression',[],{transcribe:false});
    const initial=readEditor(id);
    await runEditorAgent(id,'Update project goal',{media:false,runner:{id:'test',label:'Test',available:async()=>true,run:async o=>{
      const requests=[['00011',{tool:'project.read'}],['00010',{tool:'project.edit',expectedRevision:initial.revision,operations:[{type:'plan.patch',patch:{brief:{goal:'Confirmed transport'}}}]}],['0009',{tool:'project.read'}]] as const;
      for(const [n,body] of requests) await fs.writeFile(path.join(o.cwd,`request-${n}.json`),JSON.stringify(body));
      const until=Date.now()+10000;
      let result;
      while(Date.now()<until){try{result=JSON.parse(await fs.readFile(path.join(o.cwd,'response-00011.json'),'utf8'));break;}catch{await new Promise(r=>setTimeout(r,50));}}
      assert.equal(result?.ok,true,'five digit response must be written');
      assert.equal(result.data.edl.plan.brief.goal,'Confirmed transport');
      assert.equal(result.data.revision,initial.revision+1);
      return {provider:'test',text:'Saved',events:[],durationMs:1};
    }}});
  } finally { db.close(); await fs.rm(dir,{recursive:true,force:true}); }
});
