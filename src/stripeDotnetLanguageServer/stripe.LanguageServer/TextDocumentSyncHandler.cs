using MediatR;
using Microsoft.Extensions.Logging;
using OmniSharp.Extensions.LanguageServer.Protocol;
using OmniSharp.Extensions.LanguageServer.Protocol.Client.Capabilities;
using OmniSharp.Extensions.LanguageServer.Protocol.Document;
using OmniSharp.Extensions.LanguageServer.Protocol.Models;
using OmniSharp.Extensions.LanguageServer.Protocol.Server;
using OmniSharp.Extensions.LanguageServer.Protocol.Server.Capabilities;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace stripe.LanguageServer
{
    internal class TextDocumentSyncHandler : TextDocumentSyncHandlerBase
    {
        private readonly ILogger<TextDocumentSyncHandler> _logger;
        private readonly WorkspaceManager _workspaceManager;
        private readonly ILanguageServerConfiguration _configuration;

        private readonly DocumentSelector _documentSelector = new DocumentSelector(
            new DocumentFilter
            {
                Pattern = "**/*.cs"
            }
        );

        public TextDocumentSyncHandler(ILogger<TextDocumentSyncHandler> logger, WorkspaceManager workspaceManager, ILanguageServerConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
            _workspaceManager = workspaceManager;
        }

        public TextDocumentSyncKind Change { get; } = TextDocumentSyncKind.Full;

        public override Task<Unit> Handle(DidChangeTextDocumentParams notification, CancellationToken token)
        {
            _logger.LogDebug("Received DidChangeTextDocument Notification");

            // we have full sync enabled, so first change is the whole document
            var contents = notification.ContentChanges.First().Text;
            _workspaceManager.HandleDidUpdateTextDocument(notification.TextDocument.Uri, contents);
            return Unit.Task;
        }

        public override Task<Unit> Handle(DidOpenTextDocumentParams notification, CancellationToken token)
        {
            _logger.LogDebug("Received DidOpenTextDocument Notification for " + notification.TextDocument.Uri);
            _workspaceManager.HandleDidOpenTextDocument(notification.TextDocument.Uri);
            return Unit.Task;
        }
        public override Task<Unit> Handle(DidCloseTextDocumentParams notification, CancellationToken token) => Unit.Task;

        public override Task<Unit> Handle(DidSaveTextDocumentParams notification, CancellationToken token) => Unit.Task;

        protected override TextDocumentSyncRegistrationOptions CreateRegistrationOptions(SynchronizationCapability capability, ClientCapabilities clientCapabilities) => new TextDocumentSyncRegistrationOptions()
        {
            DocumentSelector = _documentSelector,
            Change = Change,
            Save = new SaveOptions() { IncludeText = true }
        };

        public override TextDocumentAttributes GetTextDocumentAttributes(DocumentUri uri) => new TextDocumentAttributes(uri, "csharp");
    }
}
