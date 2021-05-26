using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.MSBuild;
using Microsoft.Extensions.Logging;
using OmniSharp.Extensions.LanguageServer.Protocol;
using System.Linq;

namespace stripe.LanguageServer
{
    internal class WorkspaceManager
    {
        private readonly ILogger<WorkspaceManager> _logger;
        private MSBuildWorkspace _workspace;

        public WorkspaceManager(ILogger<WorkspaceManager> logger, MSBuildWorkspace workspace)
        {
            _logger = logger;
            _workspace = workspace;
        }

        public MSBuildWorkspace GetWorkspace()
        {
            return _workspace;
        }

        public Document GetDocument(DocumentUri uri)
        {
            var solution = _workspace.CurrentSolution;
            var documentId = solution.GetDocumentIdsWithFilePath(uri.GetFileSystemPath()).FirstOrDefault();
            _logger.LogDebug("Getting DocumentId: " + documentId);
            return solution.GetDocument(documentId);
        }
    }
}