import * as vscode from 'vscode';
import {LanguageClientOptions, Executable, ExecutableOptions, ServerOptions} from 'vscode-languageclient';

export class TestMemento implements vscode.Memento {
  storage: Map<string, any>;

  constructor() {
    this.storage = new Map();
  }

  public get(key: string, defaultValue?: any): any {
    const data = this.storage.has(key) ? this.storage.get(key) : undefined;
    return data ? data : defaultValue;
  }

  public update(key: string, value: any): Thenable<void> {
    this.storage.set(key, value);
    return Promise.resolve();
  }
}

export const mocks = {
  extensionContextMock: <vscode.ExtensionContext>{
    subscriptions: [],
    workspaceState: new TestMemento(),
    globalState: new TestMemento(),
    extensionPath: '',
    asAbsolutePath: (relativePath: string) => '',
    storagePath: '',
    globalStoragePath: '',
    logPath: '',
  },

  javaClientOptions: <LanguageClientOptions>{
    documentSelector: [{scheme: 'file', language: 'java'}],
    synchronize: {
      configurationSection: ['java', 'editor.insertSpaces', 'editor.tabSize'],
    },
    revealOutputChannelOn: 4,
  },
};

export function getMockJavaServerOptions(): Executable {
  const executable: Executable = Object.create(null);
  const options: ExecutableOptions = Object.create(null);
  options.env = Object.assign({syntaxserver: false}, process.env);
  executable.options = options;
  executable.command = '/path/to/java/home/bin/java';
  executable.args = [];
  return executable;
}
