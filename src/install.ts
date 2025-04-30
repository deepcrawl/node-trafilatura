import * as os from "node:os";
import { join, resolve } from "node:path";

import { chmod, createReadStream, exists, mkdir, unlink } from "fs-extra";
import * as shell from "shelljs";
import * as unzipper from "unzipper";

import { version } from "../package.json";

const SupportedTargets = ["linux-arm64", "darwin-arm64"];

void (async () => {
  if (await exists(resolve(__dirname, "..", ".no-postinstall"))) return;

  const target = `${os.platform()}-${os.arch()}`;
  if (!SupportedTargets.includes(target)) throw new Error(`Unsupported target: ${target}`);

  const binaryName = `trafilatura-recall-extractor.zip`;
  const outputDir = resolve(__dirname, "..", "node", "bin");
  const zipPath = join(outputDir, binaryName);

  await mkdir(outputDir, { recursive: true });
  const res = shell.exec(
    `gh release download v${version} --repo deepcrawl/node-trafilatura --pattern "${binaryName}" --dir "${outputDir}"`,
  );
  if (res.code !== 0) throw new Error(`Download failed with code ${res.code}: ${res.stderr}`);
  await createReadStream(zipPath)
    .pipe(unzipper.Extract({ path: outputDir }))
    .promise();

  const binPath = join(outputDir, "trafilatura-recall-extractor");
  await chmod(binPath, 0o755);
  await unlink(zipPath);
})();
