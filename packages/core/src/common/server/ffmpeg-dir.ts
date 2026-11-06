import fs from "node:fs/promises";
import path from "node:path";
import { WORKSPACE } from "./config";
import { FFMPEG, FFPROBE, ensureBinaries } from "./bin";

let cached: string | null = null;

/**
 * yt-dlp merges streams by shelling out to ffmpeg/ffprobe and expects both in one
 * directory. It silently exits 0 when that merge fails, so pointing it at our
 * bundled binaries — rather than whatever ffmpeg the system happens to have — is
 * what keeps a download from ending as two unmerged stream files.
 */
export async function ffmpegBinDir(): Promise<string> {
  if (cached) return cached;
  await ensureBinaries();
  const dir = path.join(WORKSPACE, "bin");
  await fs.mkdir(dir, { recursive: true });

  for (const [name, target] of [["ffmpeg", FFMPEG], ["ffprobe", FFPROBE]] as const) {
    // Native Windows executables need .exe and file symlinks require privileges.
    // A real copy also gives yt-dlp a directory it can use without Developer Mode.
    if (process.platform === "win32") {
      const executable = path.join(dir, `${name}.exe`);
      const temp = `${executable}.${process.pid}.tmp`;
      await fs.copyFile(target, temp);
      try { await fs.rename(temp, executable); }
      catch (error) { await fs.rm(temp, { force: true }); throw error; }
      continue;
    }
    const link = path.join(dir, name);
    const current = await fs.readlink(link).catch(() => null);
    if (current !== target) {
      await fs.rm(link, { force: true });
      await fs.symlink(target, link);
    }
  }

  cached = dir;
  return dir;
}
