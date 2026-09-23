import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><body></body>', { url: 'https://example.test' });
for (const name of ['window', 'document', 'navigator', 'Node', 'HTMLElement', 'Element', 'MutationObserver', 'DOMParser', 'getComputedStyle', 'FileReader', 'Option']) {
  Object.defineProperty(globalThis, name, { value: dom.window[name], configurable: true });
}
globalThis.requestAnimationFrame = fn => setTimeout(fn, 0);
globalThis.cancelAnimationFrame = clearTimeout;
const { mount } = await import('../editor/runtime.mjs');
const image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j1WQAAAAASUVORK5CYII=';
function create(value, editable = true) {
  const host = document.createElement('div'); document.body.append(host);
  const changes = [];
  const runtime = mount(host, { value, editable, onChange: html => changes.push(html) });
  return { host, changes, runtime, cleanup() { runtime.destroy(); host.remove(); } };
}

test('legacy Korean text, nested formatting, table cells and base64 survive editing and reload', () => {
  const html = `<div><p style="font-size:18px"><span style="color:red">기존 한글 본문</span> <b>굵은 글씨</b></p><p><img src="${image}" width="120" style="float:left"></p><table><tbody><tr><td><p>표 안의 내용</p></td><td>두 번째 셀</td></tr></tbody></table><ul><li>목록 내용</li></ul></div>`;
  const first = create(html);
  assert.equal(first.changes.length, 0, 'loading must not write normalized HTML back');
  for (const text of ['기존 한글 본문', '굵은 글씨', '표 안의 내용', '두 번째 셀', '목록 내용']) assert.ok(first.runtime.editor.getText().includes(text));
  assert.equal(first.host.querySelector('img').getAttribute('src'), image);
  first.runtime.editor.commands.insertContentAt(1, '추가 ');
  assert.equal(first.changes.length, 1);
  const second = create(first.changes[0]);
  assert.ok(second.runtime.editor.getText().includes('추가 기존 한글 본문'));
  assert.equal(second.host.querySelector('img').getAttribute('src'), image);
  first.cleanup(); second.cleanup();
});

test('read-only mode renders original content without editor toolbar or writes', () => {
  const instance = create(`<p>조회 본문</p><img src="${image}">`, false);
  assert.equal(instance.host.querySelector('.cm-toolbar'), null);
  assert.equal(instance.host.querySelector('[contenteditable]'), null);
  assert.equal(instance.host.querySelector('img').getAttribute('src'), image);
  assert.equal(instance.changes.length, 0);
  instance.cleanup();
});

test('image upload uses embedded base64 and does not require a server', async () => {
  const instance = create('');
  const upload = instance.host.querySelector('input[type=file]');
  Object.defineProperty(upload, 'files', { value: [new dom.window.File(['image'], 'test.png', { type: 'image/png' })] });
  upload.dispatchEvent(new dom.window.Event('change'));
  await new Promise(resolve => setTimeout(resolve, 30));
  assert.ok(instance.changes.at(-1).includes('data:image/png;base64,aW1hZ2U='));
  instance.cleanup();
});

test('destroying the editor while an image loads cannot change another record', async () => {
  const instance = create('<p>첫 문서</p>');
  const upload = instance.host.querySelector('input[type=file]');
  Object.defineProperty(upload, 'files', { value: [new dom.window.File(['image'], 'test.png', { type: 'image/png' })] });
  upload.dispatchEvent(new dom.window.Event('change')); instance.cleanup();
  await new Promise(resolve => setTimeout(resolve, 30));
  assert.equal(instance.changes.length, 0);
});

test('display removes executable markup while retaining text and embedded images', () => {
  const instance = create(`<p onclick="alert(1)">안전한 본문</p><script>alert(1)</script><img src="${image}" onerror="alert(1)">`, false);
  assert.equal(instance.host.querySelector('script'), null);
  assert.equal(instance.host.querySelector('[onclick],[onerror]'), null);
  assert.equal(instance.host.querySelector('p').textContent, '안전한 본문');
  assert.equal(instance.host.querySelector('img').getAttribute('src'), image);
  instance.cleanup();
});
