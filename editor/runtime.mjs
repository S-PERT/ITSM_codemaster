import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { TableKit } from '@tiptap/extension-table';
import { TextStyleKit } from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import DOMPurify from 'dompurify';

export function sanitize(html) {
  return DOMPurify.sanitize(html || '', { USE_PROFILES: { html: true } });
}

export function extensions() {
  return [StarterKit.configure({ link: { openOnClick: false } }),
    Image.configure({ allowBase64: true, inline: true }), TableKit,
    TextStyleKit, TextAlign.configure({ types: ['heading', 'paragraph'] })];
}

export function mount(host, { value = '', editable = false, onChange }) {
  host.replaceChildren();
  if (!editable) {
    const content = document.createElement('div');
    content.className = 'cm-document cm-document-readonly';
    content.innerHTML = sanitize(value);
    host.append(content);
    return { destroy() { host.replaceChildren(); } };
  }
  const toolbar = document.createElement('div');
  toolbar.className = 'cm-toolbar';
  toolbar.setAttribute('role', 'toolbar');
  toolbar.setAttribute('aria-label', '본문 서식');
  const content = document.createElement('div');
  host.append(toolbar, content);
  let active = true;
  const editor = new Editor({
    element: content, extensions: extensions(), content: sanitize(value),
    editorProps: {
      attributes: { class: 'cm-document', 'aria-label': '본문 편집', role: 'textbox', 'aria-multiline': 'true' },
      handlePaste(view, event) {
        const files = Array.from(event.clipboardData?.files || []).filter(file => file.type.startsWith('image/'));
        if (!files.length) return false;
        event.preventDefault();
        insertImages(files);
        return true;
      },
      handleDrop(view, event) {
        const files = Array.from(event.dataTransfer?.files || []).filter(file => file.type.startsWith('image/'));
        if (!files.length) return false;
        event.preventDefault();
        const position = view.posAtCoords({ left: event.clientX, top: event.clientY });
        if (position) editor.commands.setTextSelection(position.pos);
        insertImages(files);
        return true;
      },
    },
    onUpdate: ({ editor: current }) => onChange(current.getHTML()),
  });
  const destroy = () => { active = false; editor.destroy(); host.replaceChildren(); };
  async function insertImages(files) {
    for (const file of files) {
      try {
        const src = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        if (!active) return;
        editor.chain().focus().setImage({ src, alt: file.name }).run();
      } catch {
        if (active) status.textContent = '이미지를 읽지 못했습니다. 다시 선택해주세요.';
      }
    }
  }
  const actions = [];
  function button(label, text, action, isActive) {
    const item = document.createElement('button');
    item.type = 'button'; item.title = label; item.setAttribute('aria-label', label);
    item.textContent = text;
    item.addEventListener('mousedown', event => event.preventDefault());
    item.addEventListener('click', action);
    toolbar.append(item);
    if (isActive) actions.push(() => item.setAttribute('aria-pressed', String(isActive())));
    return item;
  }
  const select = document.createElement('select');
  select.setAttribute('aria-label', '문단 스타일');
  [['본문', '0'], ['제목 1', '1'], ['제목 2', '2'], ['제목 3', '3']].forEach(([label, val]) => select.add(new Option(label, val)));
  select.onchange = () => Number(select.value) ? editor.chain().focus().setHeading({ level: Number(select.value) }).run() : editor.chain().focus().setParagraph().run();
  toolbar.append(select);
  button('굵게', 'B', () => editor.chain().focus().toggleBold().run(), () => editor.isActive('bold')).className = 'cm-bold';
  button('기울임', 'I', () => editor.chain().focus().toggleItalic().run(), () => editor.isActive('italic')).className = 'cm-italic';
  button('밑줄', 'U', () => editor.chain().focus().toggleUnderline().run(), () => editor.isActive('underline'));
  button('취소선', 'S̶', () => editor.chain().focus().toggleStrike().run(), () => editor.isActive('strike'));
  button('글머리 기호', '• 목록', () => editor.chain().focus().toggleBulletList().run(), () => editor.isActive('bulletList'));
  button('번호 목록', '1. 목록', () => editor.chain().focus().toggleOrderedList().run(), () => editor.isActive('orderedList'));
  button('인용', '❝', () => editor.chain().focus().toggleBlockquote().run(), () => editor.isActive('blockquote'));
  button('코드 블록', '</>', () => editor.chain().focus().toggleCodeBlock().run(), () => editor.isActive('codeBlock'));
  const linkPanel = document.createElement('form');
  linkPanel.className = 'cm-link-panel'; linkPanel.hidden = true;
  const linkInput = document.createElement('input');
  linkInput.type = 'url'; linkInput.placeholder = 'https://example.com'; linkInput.setAttribute('aria-label', '링크 주소');
  const linkApply = document.createElement('button'); linkApply.textContent = '적용'; linkApply.type = 'submit';
  const linkRemove = document.createElement('button'); linkRemove.textContent = '링크 해제'; linkRemove.type = 'button';
  linkRemove.onclick = () => { editor.chain().focus().extendMarkRange('link').unsetLink().run(); linkPanel.hidden = true; };
  linkPanel.append(linkInput, linkApply, linkRemove);
  linkPanel.onsubmit = event => {
    event.preventDefault();
    if (/^https?:\/\//i.test(linkInput.value)) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkInput.value }).run(); linkPanel.hidden = true;
    } else linkInput.reportValidity();
  };
  button('링크', '↗ 링크', () => { linkPanel.hidden = !linkPanel.hidden; linkInput.value = editor.getAttributes('link').href || ''; if (!linkPanel.hidden) linkInput.focus(); });
  const upload = document.createElement('input');
  upload.type = 'file'; upload.accept = 'image/*'; upload.multiple = true; upload.hidden = true;
  upload.onchange = () => { insertImages(Array.from(upload.files)); upload.value = ''; };
  button('이미지 삽입', '▧ 이미지', () => upload.click());
  button('표 삽입', '▦ 표', () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run());
  const tableActions = document.createElement('span'); tableActions.className = 'cm-table-actions';
  [['행 추가', 'addRowAfter'], ['열 추가', 'addColumnAfter'], ['행 삭제', 'deleteRow'], ['열 삭제', 'deleteColumn'], ['셀 병합', 'mergeCells'], ['셀 분할', 'splitCell'], ['표 삭제', 'deleteTable']].forEach(([label, command]) => {
    const item = button(label, label, () => editor.chain().focus()[command]().run()); tableActions.append(item);
  });
  toolbar.append(tableActions);
  const undo = button('실행 취소', '↶', () => editor.chain().focus().undo().run());
  const redo = button('다시 실행', '↷', () => editor.chain().focus().redo().run());
  const status = document.createElement('div'); status.className = 'cm-editor-status'; status.setAttribute('aria-live', 'polite');
  host.insertBefore(linkPanel, content); host.append(upload, status);
  function update() {
    actions.forEach(action => action());
    select.value = String(editor.getAttributes('heading').level || 0);
    tableActions.hidden = !editor.isActive('table');
    undo.disabled = !editor.can().undo(); redo.disabled = !editor.can().redo();
    status.textContent = `${editor.getText().length.toLocaleString()}자 · 이미지를 붙여넣거나 끌어놓을 수 있습니다`;
  }
  editor.on('transaction', update); update();
  return { editor, destroy };
}
