import * as os from "node:os";
import { join, resolve } from "node:path";

import { chmod, mkdir, readFile } from "fs-extra";
import fetch from "node-fetch";
import * as unzipper from "unzipper";

import { version } from "../package.json";

const SupportedTargets = ["linux-arm64", "linux-x64", "darwin-arm64"];
const AssetName = "trafilatura-recall-extractor";

function getAssetNameForTarget(): string {
  const target = `${os.platform()}-${os.arch()}`;
  if (!SupportedTargets.includes(target)) throw new Error(`Unsupported target: ${target}`);
  return `${AssetName}.zip`;
  // return `${AssetName}-${target}.zip`;
}

async function createBinDir(): Promise<string> {
  const binDir = resolve(__dirname, "..", "..", "node", "bin");
  await mkdir(binDir, { recursive: true });
  return binDir;
}

async function extractGitHubTokenFromNpmrc(): Promise<string> {
  const contents = await readFile(resolve(os.homedir(), ".npmrc"));
  const match = /\/\/npm\.pkg\.github\.com\/:_authToken=(\w+)/.exec(contents.toString());
  if (!match) throw new Error("GitHub token not found in .npmrc");
  return match[1];
}

async function getReleaseAssetUrl(token: string, assetName: string): Promise<string> {
  const res = await fetch(`https://api.github.com/repos/deepcrawl/node-trafilatura/releases/tags/v${version}`, {
    headers: { Authorization: `token ${token}`, Accept: "application/vnd.github+json" },
  });
  if (!res.ok) throw new Error(`Failed to get release: ${res.statusText}`);
  const release = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const url = release.assets.find((asset: any) => asset.name === assetName).url;
  if (!url) throw new Error(`Asset not found: ${assetName}`);
  return url;
}

async function downloadAsset(token: string, url: string, binDir: string): Promise<void> {
  const res = await fetch(url, { headers: { Authorization: `token ${token}`, Accept: "application/octet-stream" } });
  if (!res.ok) throw new Error(`Failed to download asset: ${res.statusText}`);
  await res.body.pipe(unzipper.Extract({ path: binDir })).promise();
  await chmod(join(binDir, "trafilatura-recall-extractor", "trafilatura-recall-extractor"), 0o755);
}

void (async () => {
  const assetName = getAssetNameForTarget();
  const binDir = await createBinDir();
  const token = await extractGitHubTokenFromNpmrc();
  const url = await getReleaseAssetUrl(token, assetName);
  await downloadAsset(token, url, binDir);
})();
