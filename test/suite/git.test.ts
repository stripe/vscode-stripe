import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import {Git} from '../../src/git';

suite('git', () => {
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('isGitRepo', () => {
    const workspaceFolder = path.resolve('/', 'foo');
    const dotGitPath = path.resolve(workspaceFolder, '.git');
    const filePath = path.resolve(workspaceFolder, 'baz');
    const fileUri = vscode.Uri.parse(`file://${filePath}`);

    setup(() => {
      sandbox
        .stub(vscode.workspace, 'getWorkspaceFolder')
        .withArgs(fileUri)
        .returns(<any>{uri: {fsPath: workspaceFolder}});
    });

    test('identifies a workspace initialized with git', async () => {
      sandbox.stub(fs.promises, 'access').withArgs(dotGitPath, fs.constants.F_OK).resolves();
      const git = new Git();
      assert.strictEqual(await git.isGitRepo(fileUri), true);
    });

    test('identifies a workspace without git', async () => {
      sandbox.stub(fs.promises, 'access').withArgs(dotGitPath, fs.constants.F_OK).rejects();
      const git = new Git();
      assert.strictEqual(await git.isGitRepo(fileUri), false);
    });
  });
});
