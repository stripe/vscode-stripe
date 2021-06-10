using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.MSBuild;
using Microsoft.CodeAnalysis.Text;
using Microsoft.Extensions.Logging;
using OmniSharp.Extensions.LanguageServer.Protocol;
using System.IO;
using System.Linq;

namespace stripe.LanguageServer
{
    public class WorkspaceManager
    {
        private readonly ILogger<WorkspaceManager> _logger;

        // Workspace for project context
        private Workspace _workspace;

        private Solution _currentSolution;

        public WorkspaceManager(ILogger<WorkspaceManager> logger, Workspace workspace)
        {
            _logger = logger;
            _workspace = workspace;
            _currentSolution = workspace.CurrentSolution;
        }

        public Workspace GetWorkspace()
        {
            return _workspace;
        }

        public Solution GetCurrentSolution()
        {
            return _currentSolution;
        }

        public Document GetDocument(DocumentUri uri)
        {
            var documentId = this._currentSolution.GetDocumentIdsWithFilePath(uri.GetFileSystemPath()).FirstOrDefault();
            _logger.LogDebug("Getting DocumentId: " + documentId);
            return this._currentSolution.GetDocument(documentId);
        }

        // Handles OpenDocument events
        // If document already exists in the project, return it. If document does not exist, it can be for two reasons:
        //  1. the .cs file is a metdata file that was opened. i.e. a library reference. In this case, the scheme of the uri returned will be "omnisharp-metadata"
        //  2. the .cs file is a new file created for the project.
        public void HandleDidOpenTextDocument(DocumentUri uri)
        {

            if (uri.Scheme.Equals("omnisharp-metadata")) return;

            var document = this.GetDocument(uri);
            if (document == null)
            {
                var project = this._currentSolution.Projects.First();
                var documentInfo = DocumentInfo.Create(
                    DocumentId.CreateNewId(project.Id),
                    Path.GetFileName(uri.GetFileSystemPath())).WithFilePath(uri.GetFileSystemPath());
                ApplyUpdate(this._currentSolution.AddDocument(documentInfo));
            }

        }

        public void HandleDidUpdateTextDocument(DocumentUri uri, string contents)
        {
            Document document = this.GetDocument(uri);

            if (document == null)
            {
                // an untracked document, such as metadata documents.
                _logger.LogDebug("Document was not found in the workspace. Ignoring. " + uri);
                return;
            }

            Document updatedDocument = document.WithText(SourceText.From(contents));
            ApplyUpdate(updatedDocument.Project.Solution);

            Document testdoc = this.GetDocument(uri);
        }

        private void ApplyUpdate(Solution solution)
        {
            this._currentSolution = solution;
        }
    }
}
