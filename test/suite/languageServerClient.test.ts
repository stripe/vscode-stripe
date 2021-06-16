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
    const workspacePath = '/my/path';

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
      const slnFile = '/project.sln';
      sandbox.stub(vscode.workspace, 'workspaceFolders').value([
        {
          index: 0,
          name: 'workspace',
          uri: vscode.Uri.file(workspacePath),
        },
      ]);
      sandbox
        .stub(vscode.workspace, 'findFiles')
        .returns(Promise.resolve([vscode.Uri.file(slnFile)]));

      const projectFiles = await StripeLanguageClient.getDotnetProjectFiles();
      assert.deepStrictEqual(projectFiles, [slnFile]);
    });

    test('returns csproj if it exists', async () => {
      const csprojFile = '/project.csproj';
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
        .returns(Promise.resolve([vscode.Uri.file(csprojFile)]));

      const projectFiles = await StripeLanguageClient.getDotnetProjectFiles();
      assert.deepStrictEqual(projectFiles, [csprojFile]);
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
      const slnFile = '/project.sln';

      sandbox.stub(vscode.workspace, 'workspaceFolders').value([
        {
          index: 0,
          name: 'workspace',
          uri: vscode.Uri.file('/path/to/workspace/1'),
        },
        {
          index: 1,
          name: 'another workspace',
          uri: vscode.Uri.file('/path/to/workspace/2'),
        },
      ]);
      const fileFilesStub = sandbox.stub(vscode.workspace, 'findFiles');

      // first workspace has a solution
      fileFilesStub
        .withArgs(new vscode.RelativePattern('/path/to/workspace/1', '**/*.sln'))
        .returns(Promise.resolve([vscode.Uri.file(slnFile)]));

      // second workspace is not a dotnet project
      fileFilesStub
        .withArgs(new vscode.RelativePattern('/path/to/workspace/2', '**/*.sln'))
        .returns(Promise.resolve([]));
      fileFilesStub
        .withArgs(new vscode.RelativePattern('/path/to/workspace/2', '**/*.csproj'))
        .returns(Promise.resolve([]));

      const projectFiles = await StripeLanguageClient.getDotnetProjectFiles();
      assert.deepStrictEqual(projectFiles, [slnFile]);
    });
  });
});
