import fs from 'node:fs/promises';
import path from 'node:path';
import { ROOT } from '../packages/core/src/common/server/root';
import { WORKSPACE } from '../packages/core/src/common/server/config';
import { q } from '../packages/core/src/common/server/db';
import { extractAudio } from '../packages/core/src/modules/media/server/ffmpeg';
import { transcribe } from '../packages/core/src/modules/transcription/server/whispercpp';
import { readEditor } from '../packages/core/src/modules/editor/server/store';
import { executeEditorTool } from '../packages/core/src/modules/editor/server/tools';
import { assetEdit } from '../packages/core/src/modules/editor/lib/asset-edit';
import { listMcpTools } from '../packages/core/src/modules/agent/server/mcp';

async function main() {
  const projectId = '975652b0-0';
  const asset = q.listAssets('audio', projectId).find(a => a.source === 'chatterbox');
  if (!asset) throw new Error('Generate narration in the local demo first.');
  const dir = path.join(ROOT, 'verification'); await fs.mkdir(dir, {recursive:true});
  const wav = await extractAudio(path.join(WORKSPACE, asset.path), path.join(dir,'speech-16k.wav'));
  const transcript = await transcribe(wav, {outDir:dir,language:'en',threads:2,vad:false});
  await fs.writeFile(path.join(dir,'transcript.json'),JSON.stringify(transcript,null,2));
  console.log(JSON.stringify({localTranscript:transcript.segments.map(s=>s.text).join(' '),words:transcript.words.length}));
  let state=readEditor(projectId);
  const sequence=state.edl.sequences[0];
  if (!sequence.items.some(i=>i.id==='narration-demo')) {
    await executeEditorTool(projectId,{tool:'project.edit',expectedRevision:state.revision,operations:[{type:'item.add',sequenceId:sequence.id,item:{id:'narration-demo',mediaId:null,at:0,layer:0,clip:{id:'narration-demo',title:'Local narration',start:0,end:asset.duration_sec, captions:{preset:'none'},edits:[assetEdit(asset,0,asset.duration_sec!)]}}}]});
  }
  state=readEditor(projectId);
  const tools=listMcpTools();
  await fs.writeFile(path.join(dir,'speech-check.json'),JSON.stringify({asset,revision:state.revision,words:transcript.words.length,mcpSpeechTools:tools.filter(t=>t.name.includes('voiceover')).map(t=>t.name)},null,2));
  console.log(JSON.stringify({placed:true,revision:state.revision,mcpSpeechTools:tools.filter(t=>t.name.includes('voiceover')).map(t=>t.name)}));
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});
