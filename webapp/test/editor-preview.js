sap.ui.define([
    'zsp/itsm/codemaster/ext/control/TiptapEditor', 'sap/ui/model/json/JSONModel',
    'sap/m/VBox', 'sap/m/Switch', 'sap/m/Text', 'sap/m/HBox'
], function (TiptapEditor, JSONModel, VBox, Switch, Text, HBox) {
    'use strict';
    var model = new JSONModel({
        editable: true,
        content: '<h2>더 편안하게 작성하는 업무 기록</h2><p>기존에 저장한 <strong>한글 본문</strong>과 이미지를 유지하면서, 깔끔한 화면에서 문서를 작성하세요.</p><blockquote><p>조회 모드에서는 내용만큼 높이가 자동으로 조절됩니다.</p></blockquote><ul><li><p>이미지 붙여넣기와 끌어놓기</p></li><li><p>표와 링크, 다양한 문단 스타일</p></li></ul>'
    });
    new VBox({ items: [
        new HBox({ alignItems: 'Center', items: [new Text({ text: '편집 모드' }), new Switch({ state: '{/editable}' })] }),
        new TiptapEditor('previewEditor', { value: '{/content}', editable: '{/editable}' })
    ] }).setModel(model).placeAt('preview');
});
