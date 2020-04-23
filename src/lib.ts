import { window } from 'vscode';
import { ConfigurationUtil } from './utils/configuration.util';
import { File, FileUtil } from './utils/file.util';
import { KeyValue, StringUtil } from './utils/string.util';
import fs = require('fs');
import path = require('path');

let dotProp = require('dot-prop-immutable');

export class GenerateTranslation {
    private static _config = ConfigurationUtil.getConfiguration();

    public static generate(key: string) {
        GenerateTranslation.fromSelectedText(key);
    }

    public static async fromSelectedText(textSelection: string) {
        try {
            let translationParams: KeyValue[] = [];
            let translationKey: string;
            let translationValue = '';

            if (this._config.selectedTextIsValue) {
                translationValue = textSelection;
                translationKey = StringUtil.buildTranslationKeyFromText(translationValue);
            } else {
                translationKey = textSelection;
            }
            translationKey = StringUtil.addPrefixToText(
                translationKey,
                this._config.includeFileNameName,
                this._config.includeLibraryName
            );

            const translationFiles = FileUtil.getFiles(this._config.path, '.json', null, []);

            for (let i = 0; i < translationFiles.length; i++) {
                const file = translationFiles[i];

                let translationFileContent = JSON.parse(fs.readFileSync(file.path, 'utf-8'));

                const existingKey = dotProp.get(translationFileContent, translationKey);
                if (existingKey) {
                    window.showErrorMessage(`${translationKey} already exists in the file ${file.name}.`);
                    continue;
                }

                if (!this._config.selectedTextIsValue) {
                    translationValue = await window.showInputBox({
                        prompt: `What is value in ${file.name} ?`,
                        placeHolder: translationKey,
                    });
                }
                if (!translationValue) {
                    continue;
                }

                translationParams = StringUtil.getTranslationParams(translationValue);
                translationParams.forEach((p) => {
                    translationValue = translationValue.replace(p.value, p.key);
                });

                GenerateTranslation.updateResourceFile(file, translationFileContent, translationKey, translationValue);

                GenerateTranslation.replaceSelectionInEditor(translationKey, translationParams);
            }
        } catch (error) {
            window.showErrorMessage(error.message);
        }
    }

    private static async updateResourceFile(
        file: File,
        translationFileContent: any,
        translationKey: string,
        translationValue: string
    ) {
        // Split the translation key.
        // We expect the last value in the key to be the value that needs translating
        // The prefixes, separated by '.', are are the directory to that translation
        // e.g. translationKey = 'library.component.title'

        const translationDirectory = translationKey.split('.');
        // Remove the last part 'title'
        // translationDirectory = ['library', 'component']
        translationDirectory.pop();

        // Check if the path exists in the translation file
        const directoryValue = dotProp.get(translationFileContent, translationDirectory.join('.'));

        // If a translation already exists at directory path, show message and continue;
        // e.g. { library: { component: 'translated value'} }
        const translationInDirectory = directoryValue && typeof directoryValue === 'string';

        if (translationInDirectory) {
            window.showErrorMessage(
                `${translationDirectory.join('.')} directly contains a translation: ${directoryValue}.`
            );
            return;
        }

        // Update the content
        translationFileContent = dotProp.set(
            translationFileContent,
            StringUtil.normalizeKey(translationKey),
            translationValue
        );
        // Write the content back to the file system
        await FileUtil.updateFile(file, translationFileContent, this._config.sort);

        window.showInformationMessage(`${translationKey} added in the file ${file.name}.`);
    }
    private static replaceSelectionInEditor(translationKey: string, paramList: { key: string; value: string }[] = []) {
        const editor = window.activeTextEditor;

        const replaceForExtensions = <Array<string>>this._config.replaceForExtensions;
        const templateSnippetToReplace = <string>this._config.templateSnippetToReplace;

        let translationSuffix = '';
        if (!!paramList && paramList.length > 0) {
            const paramsString = paramList
                .map((p) => {
                    if (p.key === p.value) {
                        return p.key;
                    }
                    return `${p.key}: ${p.value}`;
                })
                .join(', ');
            translationSuffix = `: { ${paramsString} }`;
        }

        const extname = path.extname(editor.document.fileName);

        if (editor && replaceForExtensions.indexOf(extname.replace('.', '')) > -1 && templateSnippetToReplace) {
            const translatePipeExpression = templateSnippetToReplace
                .replace('i18n', translationKey)
                .replace('params', translationSuffix);

            editor.edit((editBuilder) => {
                editBuilder.replace(editor.selection, translatePipeExpression);
            });
        }
    }
}
