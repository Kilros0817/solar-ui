'use client';

import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getRoot,
  $createTextNode,
  $isTextNode,
  $isElementNode,
  $getSelection,
  $setSelection,
  $isRangeSelection,
  $createRangeSelection,
} from 'lexical';
import { $applyNodeReplacement } from 'lexical';
import type { LexicalNode, TextNode } from 'lexical';
import { IS_HIGHLIGHT } from 'lexical';
import { mergeRegister } from '@lexical/utils';

const HIGHLIGHT_UPDATE_TAG = 'highlight-added';

/** Extract plain text from Lexical JSON or plain string, in same order as getTextSegments (for diff). */
function getPlainTextFromContent(content: string): string {
  if (!content || !content.trim()) return '';
  const trimmed = content.trim();
  if (trimmed[0] !== '{') return trimmed;
  try {
    const parsed = JSON.parse(content) as { root?: { children?: Array<{ type?: string; text?: string; children?: unknown[] }> } };
    const children = parsed?.root?.children;
    if (!Array.isArray(children)) return trimmed;
    const parts: string[] = [];
    function walk(nodes: Array<{ type?: string; text?: string; children?: unknown[] }> | undefined): void {
      if (!nodes || !Array.isArray(nodes)) return;
      for (const node of nodes) {
        if (node.type === 'text' && typeof node.text === 'string') {
          parts.push(node.text);
          continue;
        }
        if (Array.isArray((node as { children?: unknown[] }).children)) {
          walk((node as { children: Array<{ type?: string; text?: string; children?: unknown[] }> }).children);
        }
      }
    }
    walk(children);
    return parts.join('');
  } catch {
    return trimmed;
  }
}

type Segment = { node: TextNode; start: number; end: number };

function getTextSegments(root: ReturnType<typeof $getRoot>): { text: string; segments: Segment[] } {
  const segments: Segment[] = [];
  let text = '';

  function visit(node: LexicalNode): void {
    if ($isTextNode(node)) {
      const nodeText = node.getTextContent();
      const start = text.length;
      text += nodeText;
      segments.push({ node, start, end: text.length });
      return;
    }
    if ($isElementNode(node)) {
      for (const child of node.getChildren()) {
        visit(child);
      }
    }
  }

  for (const child of root.getChildren()) {
    visit(child);
  }
  return { text, segments };
}

/**
 * Compute [start, end) ranges in `current` that are "added" compared to `baseline`.
 * Uses right-to-left alignment so that when you insert in the middle (e.g. "limited " before "the"),
 * the inserted text is marked as added and the following original text is not.
 * (Left-to-right would match the first "t" typed with the "t" of "the", highlighting the wrong character.)
 */
function getAddedRanges(baseline: string, current: string): [number, number][] {
  const ranges: [number, number][] = [];
  let i = baseline.length - 1;
  let j = current.length - 1;
  let addEnd = -1;
  while (j >= 0) {
    if (i >= 0 && baseline[i] === current[j]) {
      if (addEnd >= 0) {
        ranges.push([j + 1, addEnd + 1]);
        addEnd = -1;
      }
      i--;
      j--;
    } else {
      if (addEnd < 0) addEnd = j;
      j--;
    }
  }
  if (addEnd >= 0) ranges.push([0, addEnd + 1]);
  return ranges;
}

/** Save current selection as global character offset and its format/style (for bold/italic/underline). */
function getSelectionCharacterOffsets(
  segments: Segment[],
): { anchor: number; focus: number; format: number; style: string } | null {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return null;
  const anchorKey = selection.anchor.key;
  const anchorOffset = selection.anchor.offset;
  const focusKey = selection.focus.key;
  const focusOffset = selection.focus.offset;
  let anchorChar = -1;
  let focusChar = -1;
  for (const seg of segments) {
    const key = seg.node.getKey();
    if (key === anchorKey) anchorChar = seg.start + anchorOffset;
    if (key === focusKey) focusChar = seg.start + focusOffset;
  }
  if (anchorChar < 0 || focusChar < 0) return null;
  return {
    anchor: anchorChar,
    focus: focusChar,
    format: selection.format,
    style: selection.style ?? '',
  };
}

/** Restore selection from global character offsets and preserve format/style (bold/italic/underline). */
function restoreSelection(
  segments: Segment[],
  anchorChar: number,
  focusChar: number,
  format: number,
  style: string,
): void {
  if (segments.length === 0) return;
  const totalLen = segments[segments.length - 1].end;
  anchorChar = Math.max(0, Math.min(anchorChar, totalLen));
  focusChar = Math.max(0, Math.min(focusChar, totalLen));
  let anchorSeg: Segment | null = null;
  let anchorOffsetInNode = 0;
  let focusSeg: Segment | null = null;
  let focusOffsetInNode = 0;
  for (const seg of segments) {
    if (anchorSeg == null && anchorChar >= seg.start && anchorChar <= seg.end) {
      anchorSeg = seg;
      anchorOffsetInNode = anchorChar - seg.start;
    }
    if (focusSeg == null && focusChar >= seg.start && focusChar <= seg.end) {
      focusSeg = seg;
      focusOffsetInNode = focusChar - seg.start;
    }
  }
  if (anchorSeg == null) anchorSeg = segments[segments.length - 1];
  if (focusSeg == null) focusSeg = segments[segments.length - 1];
  if (!anchorSeg || !focusSeg) return;
  const sel = $createRangeSelection();
  sel.anchor.set(anchorSeg.node.getKey(), anchorOffsetInNode, 'text');
  sel.focus.set(focusSeg.node.getKey(), focusOffsetInNode, 'text');
  sel.format = format;
  sel.style = style;
  $setSelection(sel);
}

function mergeRanges(ranges: [number, number][]): [number, number][] {
  if (ranges.length <= 1) return ranges;
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const out: [number, number][] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const [a, b] = sorted[i];
    const last = out[out.length - 1];
    if (a <= last[1]) {
      last[1] = Math.max(last[1], b);
    } else {
      out.push([a, b]);
    }
  }
  return out;
}

function applyHighlightToSegment(
  segment: Segment,
  addedRanges: [number, number][],
): void {
  const { node, start, end } = segment;
  const segLen = end - start;
  const nodeText = node.getTextContent();
  if (segLen === 0 || nodeText.length === 0) return;

  const inSegment: [number, number][] = [];
  for (const [a, b] of addedRanges) {
    const lo = Math.max(a, start);
    const hi = Math.min(b, end);
    if (lo < hi) inSegment.push([lo - start, hi - start]);
  }
  const merged = mergeRanges(inSegment);
  if (merged.length === 0) {
    node.setFormat(node.getFormat() & ~IS_HIGHLIGHT);
    return;
  }
  const fullAdded = merged.length === 1 && merged[0][0] === 0 && merged[0][1] === segLen;
  if (fullAdded) {
    node.setFormat(node.getFormat() | IS_HIGHLIGHT);
    return;
  }

  const parent = node.getParent();
  if (!parent) return;
  const index = node.getIndexWithinParent();
  node.remove();

  let offset = 0;
  const newNodes: TextNode[] = [];
  const baseFormat = node.getFormat() & ~IS_HIGHLIGHT;
  for (const [a, b] of merged) {
    if (offset < a) {
      const before = $createTextNode(nodeText.slice(offset, a)).setFormat(baseFormat);
      newNodes.push($applyNodeReplacement(before));
    }
    const added = $createTextNode(nodeText.slice(a, b)).setFormat(baseFormat | IS_HIGHLIGHT);
    newNodes.push($applyNodeReplacement(added));
    offset = b;
  }
  if (offset < segLen) {
    const after = $createTextNode(nodeText.slice(offset)).setFormat(baseFormat);
    newNodes.push($applyNodeReplacement(after));
  }

  const siblings = parent.getChildren();
  const ref = siblings[index] || null;
  for (let i = 0; i < newNodes.length; i++) {
    if (i === 0) {
      if (ref) ref.insertBefore(newNodes[i]);
      else parent.append(newNodes[i]);
    } else {
      newNodes[i - 1].insertAfter(newNodes[i]);
    }
  }
}

export function HighlightAddedPlugin({ baselineContent }: { baselineContent: string }) {
  const [editor] = useLexicalComposerContext();
  const baselinePlainText = getPlainTextFromContent(baselineContent);
  const baselineRef = useRef(baselinePlainText);
  baselineRef.current = baselinePlainText;

  useEffect(() => {
    if (!editor || baselineContent === undefined) return;

    return mergeRegister(
      editor.registerUpdateListener(({ tags }) => {
        if (tags.has(HIGHLIGHT_UPDATE_TAG)) return;
        editor.update(
          () => {
            const root = $getRoot();
            const { text: currentText, segments } = getTextSegments(root);
            const selectionOffsets = getSelectionCharacterOffsets(segments);

            const baseline = baselineRef.current;
            const addedRanges = getAddedRanges(baseline, currentText);
            if (addedRanges.length === 0) {
              for (const seg of segments) {
                seg.node.setFormat(seg.node.getFormat() & ~IS_HIGHLIGHT);
              }
              if (selectionOffsets) {
                restoreSelection(
                  segments,
                  selectionOffsets.anchor,
                  selectionOffsets.focus,
                  selectionOffsets.format,
                  selectionOffsets.style,
                );
              }
              return;
            }
            for (const seg of segments) {
              applyHighlightToSegment(seg, addedRanges);
            }
            if (selectionOffsets) {
              const { segments: segmentsAfter } = getTextSegments(root);
              restoreSelection(
                segmentsAfter,
                selectionOffsets.anchor,
                selectionOffsets.focus,
                selectionOffsets.format,
                selectionOffsets.style,
              );
            }
          },
          { tag: HIGHLIGHT_UPDATE_TAG },
        );
      }),
    );
  }, [editor, baselineContent]);

  return null;
}
