package lsp

import (
	"context"
	"go.lsp.dev/jsonrpc2"
	"go.lsp.dev/protocol"
	"gopkg.in/yaml.v3"
	"log/slog"
)

type Server struct {
	conn jsonrpc2.Conn
	// documents stores the content of open files.
	documents Map[protocol.DocumentURI, string]
}

func NewServer() *Server {
	return &Server{
		documents: Map[protocol.DocumentURI, string]{},
	}
}

// Initialize is the first request from the client.
// We must respond with our server's capabilities.
func (s *Server) Initialize(ctx context.Context, params *protocol.InitializeParams) (*protocol.InitializeResult, error) {
	return &protocol.InitializeResult{
		Capabilities: protocol.ServerCapabilities{
			TextDocumentSync: protocol.TextDocumentSyncKindFull,
		},
	}, nil
}

// Initialized is a notification from the client that the handshake is complete.
func (s *Server) Initialized(ctx context.Context, params *protocol.InitializedParams) error {
	// We can do any post-initialization setup here.
	// For now, we'll do nothing.
	return nil
}

// Shutdown is called by the client when it's about to exit.
func (s *Server) Shutdown(ctx context.Context) error {
	return nil
}

// Exit is called by the client to ask the server to exit.
func (s *Server) Exit(ctx context.Context) error {
	return nil
}

func (s *Server) DidOpen(ctx context.Context, params *protocol.DidOpenTextDocumentParams) (err error) {
	s.documents.Store(params.TextDocument.URI, params.TextDocument.Text)

	// After opening, we should immediately analyze the document for errors.
	s.analyzeAndPublishDiagnostics(ctx, params.TextDocument.URI, params.TextDocument.Text)
	return nil
}

func (s *Server) analyzeAndPublishDiagnostics(ctx context.Context, uri protocol.DocumentURI, content string) {
	var diagnostics []protocol.Diagnostic

	// Try to parse the YAML content.
	var a any
	err := yaml.Unmarshal([]byte(content), &a)

	if err != nil {
		// If there's a parsing error, create a diagnostic.
		diagnostic := protocol.Diagnostic{
			Range: protocol.Range{ // A default range for the top of the file
				Start: protocol.Position{Line: 0, Character: 0},
				End:   protocol.Position{Line: 0, Character: 1},
			},
			Severity: protocol.DiagnosticSeverityError,
			Source:   "Compose LSP",
			Message:  "YAML Parse Error: " + err.Error(),
		}
		diagnostics = append(diagnostics, diagnostic)
	}

	// Send the diagnostics to the client.
	// This will show underlines in the editor.
	err = s.conn.Notify(ctx, protocol.MethodTextDocumentPublishDiagnostics,
		&protocol.PublishDiagnosticsParams{
			URI:         uri,
			Diagnostics: diagnostics,
		},
	)
	if err != nil {
		slog.Error("Error publishing diagnostics: ", err)
		return
	}
}

func (s *Server) WorkDoneProgressCancel(ctx context.Context, params *protocol.WorkDoneProgressCancelParams) (err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) LogTrace(ctx context.Context, params *protocol.LogTraceParams) (err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) SetTrace(ctx context.Context, params *protocol.SetTraceParams) (err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) CodeAction(ctx context.Context, params *protocol.CodeActionParams) (result []protocol.CodeAction, err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) CodeLens(ctx context.Context, params *protocol.CodeLensParams) (result []protocol.CodeLens, err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) CodeLensResolve(ctx context.Context, params *protocol.CodeLens) (result *protocol.CodeLens, err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) ColorPresentation(ctx context.Context, params *protocol.ColorPresentationParams) (result []protocol.ColorPresentation, err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) Completion(ctx context.Context, params *protocol.CompletionParams) (result *protocol.CompletionList, err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) CompletionResolve(ctx context.Context, params *protocol.CompletionItem) (result *protocol.CompletionItem, err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) Declaration(ctx context.Context, params *protocol.DeclarationParams) (result []protocol.Location, err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) Definition(ctx context.Context, params *protocol.DefinitionParams) (result []protocol.Location, err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) DidChange(ctx context.Context, params *protocol.DidChangeTextDocumentParams) (err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) DidChangeConfiguration(ctx context.Context, params *protocol.DidChangeConfigurationParams) (err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) DidChangeWatchedFiles(ctx context.Context, params *protocol.DidChangeWatchedFilesParams) (err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) DidChangeWorkspaceFolders(ctx context.Context, params *protocol.DidChangeWorkspaceFoldersParams) (err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) DidClose(ctx context.Context, params *protocol.DidCloseTextDocumentParams) (err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) DidSave(ctx context.Context, params *protocol.DidSaveTextDocumentParams) (err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) DocumentColor(ctx context.Context, params *protocol.DocumentColorParams) (result []protocol.ColorInformation, err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) DocumentHighlight(ctx context.Context, params *protocol.DocumentHighlightParams) (result []protocol.DocumentHighlight, err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) DocumentLink(ctx context.Context, params *protocol.DocumentLinkParams) (result []protocol.DocumentLink, err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) DocumentLinkResolve(ctx context.Context, params *protocol.DocumentLink) (result *protocol.DocumentLink, err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) DocumentSymbol(ctx context.Context, params *protocol.DocumentSymbolParams) (result []interface{}, err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) ExecuteCommand(ctx context.Context, params *protocol.ExecuteCommandParams) (result interface{}, err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) FoldingRanges(ctx context.Context, params *protocol.FoldingRangeParams) (result []protocol.FoldingRange, err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) Formatting(ctx context.Context, params *protocol.DocumentFormattingParams) (result []protocol.TextEdit, err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) Hover(ctx context.Context, params *protocol.HoverParams) (result *protocol.Hover, err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) Implementation(ctx context.Context, params *protocol.ImplementationParams) (result []protocol.Location, err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) OnTypeFormatting(ctx context.Context, params *protocol.DocumentOnTypeFormattingParams) (result []protocol.TextEdit, err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) PrepareRename(ctx context.Context, params *protocol.PrepareRenameParams) (result *protocol.Range, err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) RangeFormatting(ctx context.Context, params *protocol.DocumentRangeFormattingParams) (result []protocol.TextEdit, err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) References(ctx context.Context, params *protocol.ReferenceParams) (result []protocol.Location, err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) Rename(ctx context.Context, params *protocol.RenameParams) (result *protocol.WorkspaceEdit, err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) SignatureHelp(ctx context.Context, params *protocol.SignatureHelpParams) (result *protocol.SignatureHelp, err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) Symbols(ctx context.Context, params *protocol.WorkspaceSymbolParams) (result []protocol.SymbolInformation, err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) TypeDefinition(ctx context.Context, params *protocol.TypeDefinitionParams) (result []protocol.Location, err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) WillSave(ctx context.Context, params *protocol.WillSaveTextDocumentParams) (err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) WillSaveWaitUntil(ctx context.Context, params *protocol.WillSaveTextDocumentParams) (result []protocol.TextEdit, err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) ShowDocument(ctx context.Context, params *protocol.ShowDocumentParams) (result *protocol.ShowDocumentResult, err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) WillCreateFiles(ctx context.Context, params *protocol.CreateFilesParams) (result *protocol.WorkspaceEdit, err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) DidCreateFiles(ctx context.Context, params *protocol.CreateFilesParams) (err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) WillRenameFiles(ctx context.Context, params *protocol.RenameFilesParams) (result *protocol.WorkspaceEdit, err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) DidRenameFiles(ctx context.Context, params *protocol.RenameFilesParams) (err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) WillDeleteFiles(ctx context.Context, params *protocol.DeleteFilesParams) (result *protocol.WorkspaceEdit, err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) DidDeleteFiles(ctx context.Context, params *protocol.DeleteFilesParams) (err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) CodeLensRefresh(ctx context.Context) (err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) PrepareCallHierarchy(ctx context.Context, params *protocol.CallHierarchyPrepareParams) (result []protocol.CallHierarchyItem, err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) IncomingCalls(ctx context.Context, params *protocol.CallHierarchyIncomingCallsParams) (result []protocol.CallHierarchyIncomingCall, err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) OutgoingCalls(ctx context.Context, params *protocol.CallHierarchyOutgoingCallsParams) (result []protocol.CallHierarchyOutgoingCall, err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) SemanticTokensFull(ctx context.Context, params *protocol.SemanticTokensParams) (result *protocol.SemanticTokens, err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) SemanticTokensFullDelta(ctx context.Context, params *protocol.SemanticTokensDeltaParams) (result interface{}, err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) SemanticTokensRange(ctx context.Context, params *protocol.SemanticTokensRangeParams) (result *protocol.SemanticTokens, err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) SemanticTokensRefresh(ctx context.Context) (err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) LinkedEditingRange(ctx context.Context, params *protocol.LinkedEditingRangeParams) (result *protocol.LinkedEditingRanges, err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) Moniker(ctx context.Context, params *protocol.MonikerParams) (result []protocol.Moniker, err error) {
	//TODO implement me
	panic("implement me")
}

func (s *Server) Request(ctx context.Context, method string, params interface{}) (result interface{}, err error) {
	//TODO implement me
	panic("implement me")
}
