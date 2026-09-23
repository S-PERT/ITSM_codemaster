import fioriTools from '@sap-ux/eslint-plugin-fiori-tools';

export default [
    { ignores: ["webapp/ext/vendor/**"] },
    ...fioriTools.configs.recommended
];
