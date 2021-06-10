using Microsoft.Extensions.Logging;
using Moq;
using System;
using Xunit;
using stripe.LanguageServer;
using Microsoft.CodeAnalysis;
using System.Linq;
using OmniSharp.Extensions.LanguageServer.Protocol;
using System.Threading.Tasks;

namespace stripe.LanguageServer.Tests
{
    public class WorkspaceManagerTest
    {

        // Creates a logger that just prints to console.
        private ILogger<WorkspaceManager> GetLogger()
        {
            var loggerFactory = LoggerFactory.Create(
                builder => builder.AddConsole().SetMinimumLevel(LogLevel.Trace));
            return loggerFactory.CreateLogger<WorkspaceManager>();
        }

        private Workspace CreateWorkspaceWithDocument(string filePath)
        {
            var workspace = new AdhocWorkspace();
            var solutionInfo = Microsoft.CodeAnalysis.SolutionInfo.Create(SolutionId.CreateNewId(), VersionStamp.Default);
            workspace.AddSolution(solutionInfo);
            var project = workspace.AddProject("foo.dll", LanguageNames.CSharp);
            Console.WriteLine("ProjectId: " + project.Id);

            DocumentInfo documentInfo = DocumentInfo.Create(DocumentId.CreateNewId(project.Id), "HelloWorld.cs",
                filePath: filePath);
            workspace.TryApplyChanges(workspace.CurrentSolution.AddDocument(documentInfo));
            return workspace;

        }

        [Fact]
        public void GetDocument_ReturnsDocument()
        {
            var logger = GetLogger();
            string documentPath = "/hi/helloworld.cs";
            var workspace = CreateWorkspaceWithDocument(documentPath);

            WorkspaceManager workspaceManager = new WorkspaceManager(logger, workspace);

            Document fetchedDocument = workspaceManager.GetDocument(DocumentUri.FromFileSystemPath(documentPath));
            Assert.Equal(documentPath, fetchedDocument.FilePath);

        }

        [Fact]
        public void GetDocument_ReturnsNull_IfNotFound()
        {
            var logger = GetLogger();
            string documentPath = "/hi/helloworld.cs";
            var workspace = CreateWorkspaceWithDocument(documentPath);

            WorkspaceManager workspaceManager = new WorkspaceManager(logger, workspace);

            Document fetchedDocument = workspaceManager.GetDocument(DocumentUri.FromFileSystemPath("/hi/anotherfile.cs"));
            Assert.Null(fetchedDocument);
        }

        [Fact]
        public void OpenDocument_DoesNothing_IfAlreadyInProject()
        {
            var logger = GetLogger();
            string documentPath = "/hi/helloworld.cs";
            var workspace = CreateWorkspaceWithDocument(documentPath);

            WorkspaceManager workspaceManager = new WorkspaceManager(logger, workspace);
            workspaceManager.OpenDocument(DocumentUri.FromFileSystemPath(documentPath));

            Assert.Single(workspaceManager.GetCurrentSolution().Projects.First().DocumentIds);
        }

        [Fact]
        public void OpenDocument_DoesNothing_IfFileIsMetadata()
        {
            var logger = GetLogger();
            string documentPath = "/hi/helloworld.cs";
            var workspace = CreateWorkspaceWithDocument(documentPath);

            WorkspaceManager workspaceManager = new WorkspaceManager(logger, workspace);
            workspaceManager.OpenDocument(DocumentUri.From(new Uri("omnisharp-metadata://hello.cs")));
            Assert.Single(workspaceManager.GetCurrentSolution().Projects.First().DocumentIds);
        }

        [Fact]
        public void OpenDocument_AddsNewDocumentToProject()
        {
            var logger = GetLogger();
            string documentPath = "/hi/helloworld.cs";
            var workspace = CreateWorkspaceWithDocument(documentPath);

            WorkspaceManager workspaceManager = new WorkspaceManager(logger, workspace);
            workspaceManager.OpenDocument(DocumentUri.FromFileSystemPath("newfile.cs"));

            Assert.Equal(2, workspaceManager.GetCurrentSolution().Projects.First().DocumentIds.Count());
        }

        [Fact]
        public async Task UpdateDocument_UpdatesContents()
        {
            var logger = GetLogger();
            string documentPath = "/hi/helloworld.cs";
            var workspace = CreateWorkspaceWithDocument(documentPath);

            string content = "HELLO!";
            WorkspaceManager workspaceManager = new WorkspaceManager(logger, workspace);
            workspaceManager.UpdateDocument(DocumentUri.FromFileSystemPath(documentPath), content);

            var text = await workspaceManager.GetDocument(documentPath).GetTextAsync();
            Assert.Equal(content, text.ToString());
        }

        [Fact]
        public async Task UpdateDocument_DoesNothing_IfDocumentNotInWorkspace()
        {
            var logger = GetLogger();
            string documentPath = "/hi/helloworld.cs";
            var workspace = CreateWorkspaceWithDocument(documentPath);

            string content = "HELLO!";
            WorkspaceManager workspaceManager = new WorkspaceManager(logger, workspace);
            workspaceManager.UpdateDocument(DocumentUri.FromFileSystemPath("/newPath.cs"), content);

            var text = await workspaceManager.GetDocument(documentPath).GetTextAsync();

            var project = workspaceManager.GetCurrentSolution().Projects.First();
            Assert.Single(project.DocumentIds);
            Assert.Equal(documentPath, project.Documents.First().FilePath);
        }
    }
}
