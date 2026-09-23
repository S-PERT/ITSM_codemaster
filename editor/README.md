# 다른 SAPUI5 앱에 Tiptap 에디터 적용하기

이 에디터는 `value`(HTML 문자열)와 `editable`(편집 가능 여부)만 연결하면 됩니다.
특정 테이블, OData 서비스, 라우트에 의존하지 않습니다.

## 1. 파일 4개 복사

현재 프로젝트에서 아래 파일을 대상 앱의 같은 위치로 복사합니다.

| 복사할 파일 | 역할 |
| --- | --- |
| `webapp/ext/control/TiptapEditor.js` | UI5 바인딩과 에디터 생성·종료 처리 |
| `webapp/ext/vendor/tiptap.js` | Tiptap과 툴바 기능을 합쳐둔 실행 파일 |
| `webapp/ext/vendor/tiptap.js.LEGAL.txt` | 사용 라이브러리의 라이선스 안내 |
| `webapp/css/editor.css` | 툴바·본문 디자인, 조회 모드 자동 높이 |

완성된 에디터를 그대로 사용하는 경우에는 대상 앱에 React나 Tiptap npm 패키지를
따로 설치할 필요가 없습니다. 실행에 필요한 코드가 `tiptap.js`에 포함되어 있습니다.

## 2. 앱 네임스페이스 변경

대상 앱의 `manifest.json`에서 `sap.app.id`를 확인합니다.
예를 들어 대상 앱 ID가 `zsp.itsm.request`라면,
복사한 `TiptapEditor.js`에서 아래 두 부분을 변경합니다.

```js
// 모듈 경로: 점 대신 슬래시 사용
"zsp/itsm/codemaster/ext/vendor/tiptap"
// ↓
"zsp/itsm/request/ext/vendor/tiptap"

// 컨트롤 이름: 점 사용
"zsp.itsm.codemaster.ext.control.TiptapEditor"
// ↓
"zsp.itsm.request.ext.control.TiptapEditor"
```

자동 생성된 `tiptap.js` 내부는 변경하지 않습니다.

## 3. CSS 등록

대상 앱의 `manifest.json` → `sap.ui5` → `resources` → `css` 배열에 추가합니다.
기존에 등록된 CSS가 있다면 유지하고 항목만 추가합니다.

```json
"resources": {
  "css": [
    { "uri": "css/editor.css" }
  ]
}
```

## 4. 기존 에디터 자리에 컨트롤 배치

대상 앱의 기존 Fragment나 XML View에 아래처럼 배치합니다.
예시의 `zsp.itsm.request`는 대상 앱 ID로, `Content`는 HTML을 저장하는 필드명으로 바꿉니다.

```xml
<core:FragmentDefinition
    xmlns:core="sap.ui.core"
    xmlns:editor="zsp.itsm.request.ext.control">
    <editor:TiptapEditor
        id="contentEditor"
        value="{path: 'Content', mode: 'TwoWay'}"
        editable="{ui>/isEditable}" />
</core:FragmentDefinition>
```

- `value`: 현재 화면의 바인딩 컨텍스트에서 HTML 문자열 필드를 읽고 수정합니다.
- `editable`: `true`이면 편집, `false`이면 조회 화면입니다.
- `ui>/isEditable`: 현재 코드마스터와 같은 Fiori elements OData V4 앱의 편집 상태입니다.
  일반 UI5 앱이나 다른 구성에서는 해당 앱이 관리하는 편집 상태에 연결합니다.

예를 들어 일반 UI5 앱에서 `view`라는 JSONModel에 `isEditing`을 관리한다면:

```xml
editable="{view>/isEditing}"
```

이름 있는 모델에 본문이 저장되어 있다면 모델명도 지정합니다.
예를 들어 `doc` 모델의 루트에 `Content`가 있는 경우:

```xml
value="{path: 'doc>/Content', mode: 'TwoWay'}"
```

새 Fragment를 만들었다면 대상 화면에서 해당 Fragment를 포함하거나,
Fiori elements의 사용자 정의 섹션에 등록해야 합니다.
기존에 표시되고 있는 에디터 Fragment의 내부만 교체하면 기존 화면 등록을 재사용할 수 있습니다.

## 5. 기존 에디터 생성 코드 정리

기존 컨트롤러에서 `new RichTextEditor(...)`, `addItem(...)` 등으로 에디터를 직접
생성하던 코드는 제거합니다. 새 컨트롤은 XML에서 생성되고 UI5가 수명을 관리합니다.

기존 컨테이너의 `height="1000px"` 같은 고정 높이도 제거합니다.
조회 모드는 내용 높이만큼 표시되고, 편집 모드는 최소 320px에서 내용에 따라 늘어납니다.
다른 화면에서도 사용 중인 컨트롤러 코드나 라이브러리 설정까지 삭제하지 않도록 합니다.

## 저장 방식과 확인 사항

- HTML 문자열 저장 방식을 유지합니다. DB 필드를 JSON 형식으로 바꿀 필요는 없습니다.
- 이미지는 `<img src="data:image/...;base64,...">` 형태로 HTML 안에 포함됩니다.
- 새 이미지는 파일 선택, 붙여넣기, 끌어놓기로 추가할 수 있습니다.
- 조회하거나 편집 모드에 진입하기만 해서는 원본 문자열을 변경하지 않습니다.
- 실제 본문을 편집하면 Tiptap이 생성한 HTML이 `value`에 반영됩니다.
- 기존 글과 Base64 이미지는 유지하는 방향이며, 기존 서식이나 HTML 구조는 달라질 수 있습니다.
- 스크립트 등 실행 가능한 HTML은 제거하며, iframe 같은 외부 삽입 콘텐츠는 지원하지 않습니다.
- 모델의 값 변경과 서버 저장은 별개입니다. 서버 저장은 대상 앱의 기존 저장·드래프트·
  `submitBatch` 흐름을 사용합니다. JSONModel만 연결하면 서버에 자동 저장되지 않습니다.
- Base64 이미지 크기에 따른 서버 필드·요청 용량 제한은 기존과 동일하게 적용됩니다.

적용 후에는 기존 글과 이미지가 있는 문서를 열어 보고,
수정 → 앱의 저장 버튼 → 재조회까지 확인합니다.
조회 모드 높이와 편집 취소 시 원래 내용으로 돌아오는지도 확인합니다.

## 에디터 기능 자체를 수정할 때

툴바나 이미지 처리 기능을 변경하려면 `editor/runtime.mjs`를 수정합니다.
`webapp/ext/vendor/tiptap.js`는 자동 생성 파일이므로 직접 수정하지 않습니다.

현재 프로젝트에서 아래 명령을 실행한 뒤 생성된 번들과 라이선스 파일을 대상 앱에 복사합니다.

```sh
npm run build:editor
```

대상 앱에서도 소스부터 빌드하고 싶다면 `editor/runtime.mjs`, `scripts/build-editor.mjs`와
현재 `package.json`에 기록된 Tiptap 관련 의존성, `dompurify`, `esbuild` 및 빌드 스크립트를
함께 옮깁니다. 다른 앱의 `package.json` 전체를 덮어쓰지 말고 필요한 항목만 추가합니다.

현재 프로젝트의 `npm run test:editor`는 글·이미지 유지 등을 검사합니다.
`webapp/test/editor.html`은 SAP 업무 데이터를 수정하지 않는 별도 샘플 화면입니다.


## 라이선스

현재 번들에 포함된 Tiptap·ProseMirror 및 관련 편집 패키지는 MIT 라이선스입니다.
DOMPurify는 MPL-2.0 또는 Apache-2.0 중 선택할 수 있으며, 이 번들은 Apache-2.0 조건으로 사용합니다.
Tiptap의 유료 Pro 확장이나 Cloud 서비스는 사용하지 않습니다.

`npm run build:editor`는 실제 번들에 들어간 패키지를 확인하여 저작권 고지와 라이선스 전문을
`webapp/ext/vendor/tiptap.js.LEGAL.txt`에 함께 수록합니다.
다른 앱에 복사하거나 고객에게 배포할 때 이 파일도 반드시 함께 전달해야 합니다.
라이브러리 버전을 올리거나 유료 기능을 추가할 때는 해당 버전의 조건을 다시 확인합니다.
이 안내는 현재 에디터 의존성에 대한 것으로, SAPUI5 이용 계약 등 앱 전체의 조건을 대신하지 않습니다.
