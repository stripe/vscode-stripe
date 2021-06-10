using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.FindSymbols;
using Microsoft.CodeAnalysis.Text;
using Microsoft.Extensions.Logging;
using OmniSharp.Extensions.LanguageServer.Protocol.Client.Capabilities;
using OmniSharp.Extensions.LanguageServer.Protocol.Document;
using OmniSharp.Extensions.LanguageServer.Protocol.Models;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace stripe.LanguageServer
{
    internal class APIReferenceHandler : HoverHandlerBase
    {
        private static string _configFilePath = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location)
             + "/config/api_reference.json";
        private readonly Dictionary<string, string> _apiReferences;
        private readonly ILogger<APIReferenceHandler> _logger;
        private readonly WorkspaceManager _workspaceManager;
        private readonly DocumentSelector _documentSelector = new DocumentSelector(
            new DocumentFilter
            {
                Pattern = "**/*.cs"
            }
        );

        public APIReferenceHandler(ILogger<APIReferenceHandler> logger, WorkspaceManager workspaceManager)
        {
            string jsonString = File.ReadAllText(_configFilePath);
            _apiReferences = JsonSerializer.Deserialize<Dictionary<string, string>>(jsonString);
            _logger = logger;
            _workspaceManager = workspaceManager;
        }

        public APIReferenceHandler(Dictionary<string, string> apiReferences, ILogger<APIReferenceHandler> logger, WorkspaceManager workspaceManager)
        {
            _apiReferences = apiReferences;
            _logger = logger;
            _workspaceManager = workspaceManager;
        }

        protected override HoverRegistrationOptions CreateRegistrationOptions(HoverCapability capability, ClientCapabilities clientCapabilities)
        {
            var options = new HoverRegistrationOptions();
            options.DocumentSelector = _documentSelector;
            return options;
        }

        public override async Task<Hover> Handle(HoverParams request, CancellationToken cancellationToken)
        {
            if (cancellationToken.IsCancellationRequested)
            {
                _logger.LogDebug("Hover request canceled for file: {0}", request.TextDocument.Uri);
                return null;
            }

            _logger.LogDebug("Hover Request: " + request);

            string referenceKey = await GetReferenceKeyFromRequestAsync(request, cancellationToken);
            _logger.LogDebug("Key: " + referenceKey);

            // Probably not a stripe resource call.
            if (referenceKey == null || !_apiReferences.ContainsKey(referenceKey))
            {
                return null;
            }

            string url = $"https://stripe.com/docs/api{_apiReferences[referenceKey]}?lang=dotnet";
            _logger.LogDebug("URL: " + url);

            return new Hover()
            {
                Contents = new MarkedStringsOrMarkupContent(new MarkupContent()
                {
                    Kind = MarkupKind.Markdown,
                    Value = $"See this method in the [Stripe API Reference]({url})"
                })
            };
        }

        /*
            Generates a lookup key for the API reference given the hover position of the doc.
            The reference key will consist of the full namespaced type and the name of the method invoked.
            Example: "Stripe.PriceService.GetAsync"

            The reference key will be null if the hovered node is not a method invocation.

            This function uses the semantic model to derive the symbol definition to construct the key.
            This means this returns a key regardless of the syntax of the hover code.
        */

        public async Task<string> GetReferenceKeyFromRequestAsync(HoverParams request, CancellationToken cancellationToken)
        {
            // TODO -- update workspace on text sync
            Document document = _workspaceManager.GetDocument(request.TextDocument.Uri);

            // Likely not a document in our project -- check after openTextDoc event.
            if (document == null) return null;

            SemanticModel semanticModel = await document.GetSemanticModelAsync(cancellationToken);

            SourceText sourceText = await document.GetTextAsync(cancellationToken);
            int position = sourceText.Lines.GetPosition(new LinePosition(request.Position.Line, request.Position.Character));
            _logger.LogDebug("Postion: " + position);

            ISymbol hoverSymbol = await SymbolFinder.FindSymbolAtPositionAsync(
                semanticModel, position, _workspaceManager.GetWorkspace(), cancellationToken);
            string type = hoverSymbol?.ContainingType?.ToString();
            string name = hoverSymbol?.Name;

            if (type == null || name == null) return null;
            return type + "." + name;
        }
    }

}
