import * as fs from 'fs';
import {Uri, workspace} from 'vscode';
import path from 'path';

const {spawn} = require('child_process');

export class Git {
  public async isGitRepo(uri: Uri): Promise<boolean> {
    const workspaceFolder = workspace.getWorkspaceFolder(uri);
    if (!workspaceFolder) {
      return false;
    }
    const dotGitPath = path.resolve(workspaceFolder.uri.fsPath, '.git');
    try {
      await fs.promises.access(dotGitPath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  public isIgnored(uri: Uri): Promise<boolean> {
    return new Promise((resolve) => {
      const workspaceFolder = workspace.getWorkspaceFolder(uri);
      if (!workspaceFolder) {
        resolve(false);
        return;
      }
      try {
        const gitCheckIgnore = spawn('git', ['check-ignore', uri.fsPath], {
          cwd: workspaceFolder.uri.fsPath,
        });
        gitCheckIgnore.on('close', (code: number) => {
          resolve(code === 0);
        });
      } catch {
        resolve(false);
      }
    });
  }
}
