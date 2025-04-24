import { execSync } from "node:child_process";
import { resolve } from "node:path";

import { remove, writeFile } from "fs-extra";
import { v4 as uuid } from "uuid";

export async function extract(html: string): Promise<string | undefined> {
  const path = await storeHtmlInTmp(html);
  try {
    return execSync(
      `${resolve(
        __dirname,
        "..",
        "bin",
        "trafilatura-recall-extractor"
      )} ${path}`,
      { stdio: "pipe" }
    ).toString();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    return;
  } finally {
    await removeHtmlFromTmp(path);
  }
}

async function storeHtmlInTmp(html: string): Promise<string> {
  const path = resolve("/", "tmp", `${uuid()}.html`);
  await writeFile(path, html);
  return path;
}

async function removeHtmlFromTmp(path: string): Promise<void> {
  await remove(path);
}
