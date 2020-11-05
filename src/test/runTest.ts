// This file is called by 'npm run test'
// It runs the same tests as the debugger step 'Run Extension Tests' from launch.json
import * as path from 'path';

import { runTests } from 'vscode-test';

async function main() {
  try {
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');

    // The path to the extension test script
    // Passed to --extensionTestsPath
    const extensionTestsPath = path.resolve(__dirname, './suite/index');

    const launchArgs = [
      // This disables all extensions except the one being testing
      '--disable-extensions'
    ];

    // Download VS Code, unzip it and run the integration test
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs,
    });
  } catch (err) {
    console.log(err);
    console.error('Failed to run tests (src/test/runTest.ts)');
    process.exit(1);
  }
}

main();
