'use client';

import { useCallback, useMemo } from 'react';
import { LexicalComposer, type InitialConfigType } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { ParagraphNode, TextNode, IS_HIGHLIGHT } from 'lexical';
import { ListItemNode, ListNode } from '@lexical/list';
import { HeadingNode } from '@lexical/rich-text';
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical';
import type { EditorState, LexicalEditor, SerializedEditorState } from 'lexical';

import Theme from './theme';
import ClauseToolbarPlugin from './ClauseToolbarPlugin';
import { HighlightAddedPlugin } from './HighlightAddedPlugin';

const CLAUSE_EDITOR_NAMESPACE = 'ClauseLexicalEditor';

function isLexicalJsonString(value: string): boolean {
  if (typeof value !== 'string' || !value.trim()) return false;
  const trimmed = value.trim();
  if (trimmed[0] !== '{') return false;
  try {
    const parsed = JSON.parse(value) as unknown;
    return typeof parsed === 'object' && parsed !== null && 'root' in parsed;
  } catch {
    return false;
  }
}

function plainTextToEditorStateFn(plainText: string) {
  return (editor: LexicalEditor) => {
    editor.update(
      () => {
        const root = $getRoot();
        root.clear();
        const paragraph = $createParagraphNode();
        const textNode = $createTextNode(plainText);
        paragraph.append(textNode);
        root.append(paragraph);
      },
      { tag: 'history-merge' },
    );
  };
}

function stripHighlightFromLexicalJson(value: string): string {
  if (!isLexicalJsonString(value)) return value;
  try {
    const parsed = JSON.parse(value) as {
      root?: { children?: Array<{ type?: string; format?: number; children?: unknown[] }> };
    };
    const children = parsed.root?.children;
    if (!Array.isArray(children)) return value;
    function walk(nodes: Array<{ type?: string; format?: number; children?: unknown[] }>) {
      for (const node of nodes) {
        if (node.type === 'text' && typeof node.format === 'number') {
          node.format = node.format & ~IS_HIGHLIGHT;
        }
        if (Array.isArray(node.children)) {
          walk(node.children as Array<{ type?: string; format?: number; children?: unknown[] }>);
        }
      }
    }
    walk(children);
    return JSON.stringify(parsed);
  } catch {
    return value;
  }
}

type ClauseLexicalEditorProps = {
  /** Initial content: Lexical JSON string, or plain text (legacy). */
  initialContent: string;
  readOnly?: boolean;
  /** When set (and not readOnly), content added beyond this baseline is highlighted. For division member clause edits. */
  baselineContent?: string;
  /** When true, suppress visual highlight styling (used for client views). */
  disableHighlight?: boolean;
  /** Called when content changes (editable mode only). Passes Lexical JSON object. */
  onChange?: (json: SerializedEditorState) => void;
  placeholder?: string;
  className?: string;
  'data-testid'?: string;
};

export function ClauseLexicalEditor({
  initialContent,
  readOnly = false,
  baselineContent,
  disableHighlight = false,
  onChange,
  placeholder,
  className = '',
  'data-testid': dataTestId,
}: ClauseLexicalEditorProps) {
  const initialConfig = useMemo(() => {
    let editorState: null | string | ((editor: LexicalEditor) => void) = null;
    let contentForEditor = initialContent;
    if (disableHighlight) {
      contentForEditor = stripHighlightFromLexicalJson(initialContent);
    }
    if (contentForEditor) {
      if (isLexicalJsonString(contentForEditor)) {
        editorState = contentForEditor;
      } else {
        editorState = plainTextToEditorStateFn(contentForEditor);
      }
    }
    const theme = disableHighlight
      ? {
          ...Theme,
          text: {
            ...Theme.text,
            highlight: '',
          },
        }
      : Theme;
    return {
      namespace: CLAUSE_EDITOR_NAMESPACE,
      theme,
      nodes: [ParagraphNode, TextNode, ListNode, ListItemNode, HeadingNode],
      onError: (error: Error) => {
        console.error('[ClauseLexicalEditor]', error?.message ?? error);
        console.error('[ClauseLexicalEditor] stack:', error.stack);
      },
      editable: !readOnly,
      editorState: editorState ?? undefined,
    } as unknown as InitialConfigType;
  }, [initialContent, readOnly, disableHighlight]);

  const handleChange = useCallback(
    (editorState: EditorState, _editor: LexicalEditor, _tags: Set<string>) => {
      if (readOnly || !onChange) return;
      onChange(editorState.toJSON());
    },
    [onChange, readOnly],
  );

  const placeholderText = placeholder ?? 'Enter clause content...';

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div
        className={`clause-editor-container rounded-md border border-input ${readOnly ? 'clause-editor-readonly' : ''} ${className}`}
        data-testid={dataTestId}
      >
        {!readOnly && <ClauseToolbarPlugin />}
        <div className="clause-editor-inner rounded-b-md">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="clause-editor-input w-full rounded-b-md border-0 bg-background text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                aria-placeholder={placeholderText}
                placeholder={
                  <div className="clause-editor-placeholder">
                    {placeholderText}
                  </div>
                }
              />
            }
            placeholder={null}
            ErrorBoundary={LexicalErrorBoundary}
          />
          {!readOnly && <ListPlugin />}
          {!readOnly && <HistoryPlugin />}
          {!readOnly && <AutoFocusPlugin />}
          {!readOnly && baselineContent != null && baselineContent !== '' && (
            <HighlightAddedPlugin baselineContent={baselineContent} />
          )}
          {!readOnly && (
            <OnChangePlugin
              ignoreSelectionChange
              onChange={handleChange as any}
            />
          )}
        </div>
      </div>
    </LexicalComposer>
  );
}

/** Serialize current Lexical state to a JSON string for storage. */
export function serializeClauseContentToJson(
  editorState: SerializedEditorState,
): string {
  return JSON.stringify(editorState);
}

/** Parse stored clause content: Lexical JSON string or plain text. Returns string for initialContent. */
export function parseClauseContentFromStorage(
  stored: string | null | undefined,
): string {
  if (stored == null || stored === '') return '';
  const trimmed = stored.trim();
  if (!trimmed) return '';
  return trimmed;
}

/** Extract plain text from clause content (Lexical JSON or plain) for one-line previews with ellipsis. */
export function getPlainTextPreview(clauseContent: string | null | undefined): string {
  if (clauseContent == null || !clauseContent.trim()) return '';
  const trimmed = clauseContent.trim();
  if (trimmed[0] !== '{') return trimmed;
  try {
    type TextChild = { type?: string; text?: string };
    type BlockChild = { type?: string; children?: TextChild[] };
    type ListNode = { type?: string; children?: Array<{ type?: string; children?: TextChild[] }> };
    const parsed = JSON.parse(clauseContent) as {
      root?: { children?: Array<BlockChild | ListNode> };
    };
    if (!parsed?.root?.children) return trimmed;
    const parts: string[] = [];
    for (const node of parsed.root.children) {
      if (node.type === 'paragraph' && 'children' in node && node.children) {
        for (const c of node.children) {
          if ('text' in c && typeof c.text === 'string') parts.push(c.text);
        }
      }
      if (node.type === 'list' && 'children' in node && node.children) {
        for (const item of node.children) {
          const itemChildren = (item as { children?: Array<{ type?: string; text?: string }> }).children;
          if (itemChildren) {
            for (const c of itemChildren) {
              if ('text' in c && typeof c.text === 'string') parts.push(c.text);
            }
          }
        }
      }
    }
    return parts.join(' ').trim() || trimmed;
  } catch {
    return trimmed;
  }
}
