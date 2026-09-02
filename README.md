## Application Details
|               |
| ------------- |
|**Generation Date and Time**<br>Wed Sep 02 2026 14:54:19 GMT+0900 (한국 표준시)|
|**App Generator**<br>SAP Fiori Application Generator|
|**App Generator Version**<br>1.23.0|
|**Generation Platform**<br>Visual Studio Code|
|**Template Used**<br>List Report Page V4|
|**Service Type**<br>SAP System (ABAP On-Premise)|
|**Service URL**<br>https://saphana2.s-pert.com:44360/sap/opu/odata4/sap/zsp_itsm_p_codemaster_ui_v4/srvd/sap/zsp_itsm_p_codemaster_ui/0001/|
|**Module Name**<br>codemaster|
|**Application Title**<br>Code master|
|**Namespace**<br>zsp.itsm|
|**UI5 Theme**<br>sap_horizon|
|**UI5 Version**<br>1.108.0|
|**Enable TypeScript**<br>False|
|**Add Eslint configuration**<br>True, see https://www.npmjs.com/package/@sap-ux/eslint-plugin-fiori-tools#rules for the eslint rules.|
|**Main Entity**<br>main|
|**Navigation Entity**<br>None|

## codemaster

Code master

### Starting the generated app

-   This app has been generated using the SAP Fiori tools - App Generator, as part of the SAP Fiori tools suite.  To launch the generated application, run the following from the generated application root folder:

```
    npm start
```

- It is also possible to run the application using mock data that reflects the OData Service URL supplied during application generation.  In order to run the application with Mock Data, run the following from the generated app root folder:

```
    npm run start-mock
```

#### Pre-requisites:

1. Active NodeJS LTS (Long Term Support) version and associated supported NPM version.  (See https://nodejs.org)

## Custom Extension: Rich Text Editor on Object Page ("상세내역")

이 앱은 SAP Fiori Elements(OData V4) 표준 생성 코드 위에, ObjectPage의 커스텀 섹션으로
`sap.ui.richtexteditor.RichTextEditor`(TinyMCE6 기반)를 추가해서 `main` 엔티티의 `Content`
필드를 리치텍스트로 보고/편집할 수 있게 확장했습니다. 이 문서만 보고도 다른 필드/다른
ObjectPage에 같은 패턴을 그대로 재현할 수 있도록 관련된 파일과 각 파일이 하는 역할, 서로
연결되는 지점(ID 규칙)을 설명합니다.

### 관련 파일

```
webapp/ext/fragment/RichTextEditor.fragment.xml   # 에디터를 담을 빈 컨테이너
webapp/ext/controller/ObjectPageExt.controller.js # 라우트 진입 시 에디터를 생성/바인딩
webapp/manifest.json                              # 위 두 파일을 표준 ObjectPage에 꽂아넣는 설정
webapp/i18n/i18n.properties                       # 섹션 제목 텍스트(detailContentTitle)
```

Fiori Elements 앱은 View/Controller를 직접 작성하지 않고 프레임워크가 자동 생성하기 때문에,
"커스텀 섹션 + 컨트롤러 확장(controller extension)"을 manifest.json에 선언하는 방식으로만
UI를 끼워 넣을 수 있습니다. 아래 4개 지점이 서로 어떻게 맞물리는지가 핵심입니다.

### 1) manifest.json — 커스텀 섹션을 ObjectPage에 등록

`sap.ui5 > routing > targets > mainObjectPage > options > settings > content.body.sections`
아래에 섹션을 하나 선언합니다. 이 섹션 키(`Richtexteditor`)가 나중에 컨트롤러에서 컨트롤을
찾을 때 쓰는 ID의 일부가 되므로 이름을 바꾸면 컨트롤러 쪽 ID 문자열도 같이 바꿔야 합니다.

```json
"mainObjectPage": {
  "options": {
    "settings": {
      "content": {
        "body": {
          "sections": {
            "Richtexteditor": {
              "template": "zsp.itsm.codemaster.ext.fragment.RichTextEditor",
              "title": "{i18n>detailContentTitle}",
              "position": {
                "placement": "After",
                "anchor": "Item"
              }
            }
          }
        }
      }
    }
  }
}
```

- `template` : 섹션 내용으로 렌더링할 프래그먼트의 전체 네임스페이스 경로
  (`webapp/ext/fragment/RichTextEditor.fragment.xml` → `zsp.itsm.codemaster.ext.fragment.RichTextEditor`)
- `position.anchor` : 기존 파셋(facet) ID 기준으로 앞/뒤 배치. 백엔드 CDS 어노테이션이 내려주는
  다른 파셋(예: 고객담당자, 사용처) 뒤/사이에 놓고 싶으면 실제 서비스가 내려주는 파셋 ID로
  바꿔주면 됩니다. (로컬 캐시된 `metadata.xml`에는 `Head`, `Item` 두 파셋만 있고, 나머지는
  백엔드가 라이브로 내려주는 값이라 로컬에서는 정확한 ID를 알 수 없습니다 — 브라우저 개발자
  도구로 실제 렌더된 섹션 ID를 확인하거나 백엔드 CDS 어노테이션을 확인하세요.)
- 같은 `sections` 오브젝트에 키를 추가하면 섹션을 여러 개 더 만들 수 있습니다.

같은 파일에서 이 섹션을 그리는 View의 컨트롤러를 확장하도록 아래도 함께 선언했습니다.

```json
"extends": {
  "extensions": {
    "sap.ui.controllerExtensions": {
      "sap.fe.templates.ObjectPage.ObjectPageController": {
        "controllerName": "zsp.itsm.codemaster.ext.controller.ObjectPageExt"
      }
    }
  }
}
```

- 타겟 이름(`sap.fe.templates.ObjectPage.ObjectPageController`)은 SAP Fiori Elements V4가
  ObjectPage에서 항상 쓰는 표준 컨트롤러 이름입니다. 이 값은 고정이며, ObjectPage가 여러 개인
  앱이라도 이 확장은 **앱에 있는 모든 ObjectPage에 공통 적용**됩니다. 특정 ObjectPage에서만
  동작하게 하려면(우리처럼) 컨트롤러 안에서 라우트 이름으로 분기해야 합니다. → 2)번 참고.
- `sap.ui.richtexteditor` 라이브러리도 `sap.ui5.dependencies.libs`에 추가해 두었습니다
  (지연 로딩되긴 하지만 매니페스트에 명시해 두는 것이 정석입니다).

### 2) RichTextEditor.fragment.xml — 빈 컨테이너

```xml
<core:FragmentDefinition xmlns:core="sap.ui.core" xmlns="sap.m" xmlns:macros="sap.fe.macros">
	<VBox id="idEditorContainer" height="1000px">
		<!-- <Text text="Richtexteditor" /> -->
	</VBox>
</core:FragmentDefinition>
```

이 프래그먼트는 실제 RichTextEditor 컨트롤을 담을 **빈 껍데기**일 뿐입니다. RichTextEditor
라이브러리(TinyMCE)는 XML로 선언하지 않고 컨트롤러에서 `sap.ui.require`로 비동기 로드한 뒤
JS로 생성해서 이 `VBox`(`idEditorContainer`) 안에 `addItem`으로 밀어 넣습니다. 이렇게 하는
이유는 (a) 편집 가능 여부(Editflag)를 URL 상태에 따라 동적으로 결정해야 하고, (b) TinyMCE
라이브러리 자체가 무거워서 XML 선언 시점이 아니라 실제 필요한 시점에 지연 로드하기 위해서입니다.

### 3) ObjectPageExt.controller.js — 실제로 에디터를 만들고 값을 바인딩

핵심 흐름:

1. `onInit`에서 앱 라우터의 `"mainObjectPage"` 라우트에 `attachPatternMatched`를 걸어,
   **이 ObjectPage로 진입할 때마다** `onRoutePatternMatched`가 실행되게 합니다.
   (컨트롤러 확장은 앱의 모든 ObjectPage에 붙지만, 라우트 이름으로 걸러서 이 라우트일 때만
   동작하게 만드는 지점입니다. 다른 ObjectPage에도 에디터를 붙이려면 그 라우트 이름을
   추가로 attach하거나, 라우트 이름을 파라미터로 받는 형태로 일반화하면 됩니다.)

2. `getEditableflag()`가 현재 URL에서 `IsActiveEntity=` 뒤의 값을 파싱해서, Draft(편집 중,
   `IsActiveEntity=false`)인지 Active(조회 전용, `IsActiveEntity=true`)인지 판단해 에디터의
   `editable` 여부를 결정합니다.

3. `initRichTextEditor(sId, Editflag, value)`가 실제로 RichTextEditor 인스턴스를 만들고,
   `value: "{Content}"` 로 바인딩합니다. **다른 필드에 적용하고 싶다면 이 문자열만 그 필드명
   (예: `"{Remark}"`)으로 바꾸면 됩니다.** 바인딩 경로는 ObjectPage의 컨텍스트(`main` 엔티티)
   기준 상대 경로입니다.

4. 생성한 에디터를 아래의 **완전한 ID 경로**로 `byId` 조회한 `VBox`에 `addItem`으로 붙입니다.

   ```
   zsp.itsm.codemaster::mainObjectPage--fe::CustomSubSection::Richtexteditor--idEditorContainer
   ```

   이 ID는 다음 규칙으로 조합됩니다 (숫자 순서대로 `--`로 연결):

   | 조각 | 값 | 어디서 오는가 |
   |---|---|---|
   | 뷰(컴포넌트) ID | `zsp.itsm.codemaster::mainObjectPage` | `manifest.json`의 `sap.app.id` + `routing.targets.mainObjectPage.id` |
   | 커스텀 섹션 ID | `fe::CustomSubSection::Richtexteditor` | Fiori Elements가 `content.body.sections.<key>` 의 `<key>`(=`Richtexteditor`)를 이용해 자동 생성하는 고정 패턴(`fe::CustomSubSection::`) |
   | 프래그먼트 내부 컨트롤 ID | `idEditorContainer` | `RichTextEditor.fragment.xml`에서 지정한 `id` |

   **즉, manifest.json의 섹션 키 이름을 바꾸면 이 ID 문자열의 가운데 조각도 반드시 같이
   바꿔야 합니다.** (짧은 상대 `byId("idEditorContainer")`로는 못 찾습니다 — 커스텀 섹션은
   자체 ID 스코프를 가진 별도 프래그먼트로 렌더링되기 때문에, 뷰의 `byId`에서는 전체 경로를
   써줘야 합니다.)

### 새로운 필드/새로운 ObjectPage에 같은 패턴을 적용하는 방법 (체크리스트)

1. `webapp/ext/fragment/`에 컨테이너용 프래그먼트를 하나 더 만듭니다 (내부 `VBox` id는
   자유롭게 지어도 되지만 겹치지 않게 유의).
2. `manifest.json`의 해당 ObjectPage 타겟에 `content.body.sections`로 섹션을 하나 추가하고,
   섹션 키를 정합니다.
3. 컨트롤러(기존 `ObjectPageExt.controller.js`를 재사용하거나 새로 작성)에서:
   - 대상 라우트 이름으로 `attachPatternMatched`
   - `value` 바인딩 경로를 원하는 필드명으로 지정
   - `byId(...)` 문자열을 `<컴포넌트ID>::<라우트타겟ID>--fe::CustomSubSection::<섹션키>--<프래그먼트내부ID>` 규칙에 맞게 조합
4. 필요하면 `i18n.properties`에 섹션 제목 텍스트를 추가하고 manifest에서 `{i18n>키}`로 참조합니다.
5. VS Code에서 앱을 재실행(`npm start` 또는 preview)해서 섹션 위치와 편집/조회 모드 전환이
   기대대로 동작하는지 확인합니다.

