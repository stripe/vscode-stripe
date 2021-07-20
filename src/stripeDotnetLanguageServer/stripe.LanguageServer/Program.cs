
using Microsoft.Build.Locator;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.MSBuild;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using OmniSharp.Extensions.LanguageServer.Protocol;
using OmniSharp.Extensions.LanguageServer.Protocol.Models;
using OmniSharp.Extensions.LanguageServer.Server;
using Serilog;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace stripe.LanguageServer
{
    class Program
    {
        static async Task Main(string[] args)
        {

            // TODO -- Can we pipe it directly to the vscode output console?
            Log.Logger = new LoggerConfiguration()
                        .Enrich.FromLogContext()
                        .MinimumLevel.Debug()
                        .CreateLogger();

            string projectFile = args[0];
            Log.Debug("Creating project for " + projectFile);

            // Without this MSBuild can't find the SDK folder.
            MSBuildLocator.RegisterDefaults();
            var workspace = MSBuildWorkspace.Create();

            // We need to register to the failed event to be notified if there were any failures.
            // https://docs.microsoft.com/en-us/dotnet/standard/events/
            workspace.WorkspaceFailed += WorkspaceFailed;

            if (Path.GetExtension(projectFile) == ".sln")
            {
                await workspace.OpenSolutionAsync(projectFile);
            }
            else if (Path.GetExtension(projectFile) == ".csproj")
            {
                await workspace.OpenProjectAsync(projectFile);
            }

            Log.Debug("Created project...");

            Log.Debug("Starting language server...");
            var server = await OmniSharp.Extensions.LanguageServer.Server.LanguageServer.From(options =>
                options
                    .WithInput(Console.OpenStandardInput())
                    .WithOutput(Console.OpenStandardOutput())
                    .ConfigureLogging(
                            x => x
                                .AddSerilog(Log.Logger)
                                .AddLanguageProtocolLogging()
                                .SetMinimumLevel(LogLevel.Debug)
                        )
                    .WithHandler<TextDocumentSyncHandler>()
                    .WithHandler<APIReferenceHandler>()
                    .WithServices(x => x.AddLogging(b => b.SetMinimumLevel(LogLevel.Trace)))
                    .WithServices(
                        services =>
                        {
                            services.AddSingleton(
                                provider =>
                                {
                                    var loggerFactory = provider.GetService<ILoggerFactory>();
                                    var logger = loggerFactory.CreateLogger<WorkspaceManager>();
                                    return new WorkspaceManager(logger, workspace);
                                }
                            );
                        }
                    )
                );

            await server.WaitForExit;
        }

        private static void WorkspaceFailed(object sender, WorkspaceDiagnosticEventArgs e)
        {
            var message = e.Diagnostic.Message;
            Log.Error("Error while loading workspace: " + message);
        }

    }
}
