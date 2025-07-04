import { editor } from 'monaco-editor';
import { EditorInstance, Monaco } from './types';

// Configure keyboard shortcuts for the Monaco Editor
export function configureEditorShortcuts(
  monaco: Monaco,
  editor: EditorInstance,
  onSave: () => void
): void {
  // Add command for saving
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
    onSave();
  });

  // Add command for undo/redo
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyZ, () => {
    editor.trigger('keyboard', 'undo', null);
  });

  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyZ, () => {
    editor.trigger('keyboard', 'redo', null);
  });

  // Add command to manually trigger suggest widget (Ctrl+Space)
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
    editor.trigger('keyboard', 'editor.action.triggerSuggest', null);
  });
}

// Configure auto-completion for brackets
export function configureBracketCompletion(editor: EditorInstance): void {
  // This is handled by Monaco's built-in bracket completion
  // Ensure it's enabled in the editor options
  editor.updateOptions({
    autoClosingBrackets: 'always',
    autoClosingQuotes: 'never' // Disable auto-closing quotes
  });
}

// Configure editor options and appearance
export function configureEditorOptions(
  editor: EditorInstance, 
  isDarkTheme: boolean,
  fontFamily?: string
): void {
  // Check if we're on a mobile device
  const isMobile = window.innerWidth < 768;
  
  editor.updateOptions({
    fontFamily: fontFamily || 'var(--font-mono)',
    fontSize: isMobile ? 16 : 14, // Larger font on mobile to prevent zoom
    lineHeight: isMobile ? 28 : 24,
    wordWrap: 'on',
    wrappingIndent: 'same',
    lineNumbers: isMobile ? 'off' : 'on', // Hide line numbers on mobile to save space
    renderLineHighlight: 'all',
    scrollBeyondLastLine: false,
    minimap: { enabled: false },
    scrollbar: {
      vertical: 'visible',
      horizontalScrollbarSize: isMobile ? 12 : 8, // Larger scrollbars on mobile
      verticalScrollbarSize: isMobile ? 12 : 8
    },
    padding: {
      top: 16,
      bottom: 16
    },
    fontLigatures: true,
    tabSize: 2,
    // Mobile-specific options to prevent zoom
    quickSuggestions: true, // Enable suggestions on all devices
    parameterHints: { enabled: true },
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnEnter: isMobile ? 'smart' : 'on',
    suggest: {
      showWords: true,
      showSnippets: true,
      showKeywords: true,
      showFunctions: true,
      showVariables: true,
      showClasses: true,
      showModules: true,
      showProperties: true,
      insertMode: 'insert'
    },
    // Improve touch interaction
    multiCursorModifier: 'alt',
    selectionHighlight: !isMobile, // Reduce visual noise on mobile
    occurrencesHighlight: !isMobile,
  });
}
