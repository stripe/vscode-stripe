import * as fs from 'fs';
import {Uri, workspace} from 'vscode';
import path from 'path';

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
}
