# Stripe Dotnet Language Server

## Developing

Open this project using the workspace file: `vscode-stripe.code-workspace`.

### C# Intellisense

If you find that intellisense is not working in this directory, you may have to help the omnisharp extension out a bit due to our project having multiple workspace folders.

1. Open the Command Palette
1. Write "OmniSharp: Select Project" and press Enter.
1. Choose stripeDotnetLanguageServer.sln

## Running

```
# Build
dotnet build

# Clean output
dotnet clean

# Run main
dotnet run
```

## Documents that are helpful

## Debugging

Log files are locally saved to /tmp/stripe.LanguageServer-logs[date].txt. Ex: /tmp/stripe.LanguageServer-logs20210520.txt

To run the language server end to end:

1. Start the client -- Hit "Run Extension (vscode-stripe)"
1. Wait for the extension and the language server to start up.
1. In this workspace, hit ".NET Server Attach (stripeDotnetLanguageServer)" -- this will bring up a list of processes, there should just be one that the client started.

## Helpful Documents

https://docs.microsoft.com/en-us/dotnet/api/microsoft.visualstudio.languageserver.protocol?view=visualstudiosdk-2019
https://microsoft.github.io/language-server-protocol/specifications/specification-3-14/
https://sharplab.io/ -- Syntax tree crawler
