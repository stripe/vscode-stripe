import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import {StripeLanguageClient} from '../../src/languageServerClient';

suite('languageServerClient', () => {
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('getDotnetProjectFiles', () => {
    const workspaceRoot = vscode.Uri.file('my/path');
    console.log('Path: ' + workspaceRoot.path);
    console.log('FS Path: ' + workspaceRoot.fsPath);
    const workspacePath = workspaceRoot.fsPath;

    test('returns empty when no workspaces', async () => {
      sandbox.stub(vscode.workspace, 'workspaceFolders').value([]);
      const projectFiles = await StripeLanguageClient.getDotnetProjectFiles();
      assert.deepStrictEqual(projectFiles, []);
    });

    test('returns empty when workspaceFolder is undefined', async () => {
      sandbox.stub(vscode.workspace, 'workspaceFolders').value(undefined);
      const projectFiles = await StripeLanguageClient.getDotnetProjectFiles();
      assert.deepStrictEqual(projectFiles, []);
    });

    test('returns sln project if it exists', async () => {
      const slnFile = vscode.Uri.file('project.sln');
      sandbox.stub(vscode.workspace, 'workspaceFolders').value([
        {
          index: 0,
          name: 'workspace',
          uri: vscode.Uri.file(workspacePath),
        },
      ]);
      sandbox.stub(vscode.workspace, 'findFiles').returns(Promise.resolve([slnFile]));

      const projectFiles = await StripeLanguageClient.getDotnetProjectFiles();
      assert.deepStrictEqual(projectFiles, [slnFile.fsPath]);
    });

    test('returns csproj if it exists', async () => {
      const csprojFile = vscode.Uri.file('project.csproj');
      sandbox.stub(vscode.workspace, 'workspaceFolders').value([
        {
          index: 0,
          name: 'workspace',
          uri: vscode.Uri.file(workspacePath),
        },
      ]);
      const fileFilesStub = sandbox.stub(vscode.workspace, 'findFiles');
      fileFilesStub
        .withArgs(new vscode.RelativePattern(workspacePath, '**/*.sln'))
        .returns(Promise.resolve([]));
      fileFilesStub
        .withArgs(new vscode.RelativePattern(workspacePath, '**/*.csproj'))
        .returns(Promise.resolve([csprojFile]));

      const projectFiles = await StripeLanguageClient.getDotnetProjectFiles();
      assert.deepStrictEqual(projectFiles, [csprojFile.fsPath]);
    });

    test('returns empty when no dotnet projects', async () => {
      sandbox.stub(vscode.workspace, 'workspaceFolders').value([
        {
          index: 0,
          name: 'workspace',
          uri: vscode.Uri.file(workspacePath),
        },
      ]);
      const fileFilesStub = sandbox.stub(vscode.workspace, 'findFiles');
      fileFilesStub.onCall(0).returns(Promise.resolve([]));
      fileFilesStub.onCall(1).returns(Promise.resolve([]));

      const projectFiles = await StripeLanguageClient.getDotnetProjectFiles();
      assert.deepStrictEqual(projectFiles, []);
    });

    test('filters out non-dotnet projects', async () => {
      const slnFile = vscode.Uri.file('project.sln');
      const workspacePath1 = vscode.Uri.file('path/to/workspace/1');
      const workspacePath2 = vscode.Uri.file('path/to/workspace/2');

      sandbox.stub(vscode.workspace, 'workspaceFolders').value([
        {
          index: 0,
          name: 'workspace',
          uri: workspacePath1,
        },
        {
          index: 1,
          name: 'another workspace',
          uri: workspacePath2,
        },
      ]);
      const fileFilesStub = sandbox.stub(vscode.workspace, 'findFiles');

      // first workspace has a solution
      fileFilesStub
        .withArgs(new vscode.RelativePattern(workspacePath1.fsPath, '**/*.sln'))
        .returns(Promise.resolve([slnFile]));

      // second workspace is not a dotnet project
      fileFilesStub
        .withArgs(new vscode.RelativePattern(workspacePath2.fsPath, '**/*.sln'))
        .returns(Promise.resolve([]));
      fileFilesStub
        .withArgs(new vscode.RelativePattern(workspacePath2.fsPath, '**/*.csproj'))
        .returns(Promise.resolve([]));

      const projectFiles = await StripeLanguageClient.getDotnetProjectFiles();
      assert.deepStrictEqual(projectFiles, [slnFile.fsPath]);
    });
  });
});
