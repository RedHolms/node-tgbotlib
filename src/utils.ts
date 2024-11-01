import { stat } from "node:fs/promises";

export function isPathExists(path: string): Promise<boolean> {
  return stat(path)
    .then(() => true)
    .catch(() => false);
}
