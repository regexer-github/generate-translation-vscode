import { window, workspace, Range, Position } from 'vscode';
import { ConfigurationUtil, GenerateTranslationConfiguration } from './utils/configuration.util';
import { File, FileUtil } from './utils/file.util';
import { KeyValue, StringUtil } from './utils/string.util';
import fs = require('fs');
import path = require('path');

let dotProp = require('dot-prop-immutable');

export class GenerateTranslation {
    private static _config: GenerateTranslationConfiguration;

    public static async fromCurrentFile() {
        GenerateTranslation.reloadConfig();

        const editor = window.activeTextEditor;
        const text = editor.document.getText();

        const textInTagsRegex = new RegExp(/(?<=>\s*)\w+[\w\s{}\'\.]*(?=<)/g);
        await GenerateTranslation.generateTranslationsForRegex(text, textInTagsRegex);
        const textTitleRegex = new RegExp(/(?<=title=")\w+[\w\s{}\'\.]*(?=")/g);
        await GenerateTranslation.generateTranslationsForRegex(text, textTitleRegex);
    }

    private static async generateTranslationsForRegex(text: string, textInTagsRegex: RegExp) {
        const matches = text.match(textInTagsRegex);
        if (matches) {
            for (let index = 0; index < matches.length; index++) {
                const m = matches[index].trim();
                const options: ReplaceOptions = {
                    fromSelection: false,
                    originalText: m,
                };
                await this.fromSelectedText(m, options);
            }
        }
    }

    public static fromKey(key: string) {
        GenerateTranslation.reloadConfig();
        GenerateTranslation.fromSelectedText(key);
    }

    public static async fromSelectedText(textSelection: string, options: ReplaceOptions = { fromSelection: true }) {
        GenerateTranslation.reloadConfig();
        try {
            let translationParams: KeyValue[] = [];
            console.log('for text', textSelection);
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

                const content = fs.readFileSync(file.path, 'utf-8');
                let translationFileContent = JSON.parse(content);

                const existingKey = dotProp.get(translationFileContent, translationKey);
                if (existingKey) {
                    window.showErrorMessage(`${translationKey} already exists in the file ${file.name}.`);
                } else {
                    if (!this._config.selectedTextIsValue) {
                        translationValue = await window.showInputBox({
                            prompt: `What is value in ${file.name} ?`,
                            placeHolder: translationKey,
                        });
                    }
                    if (!translationValue) {
                        continue;
                    }
                }
                translationParams = StringUtil.getTranslationParams(translationValue);
                translationParams.forEach((p) => {
                    translationValue = translationValue.replace(p.value, p.key);
                });
                if (!existingKey) {
                    await GenerateTranslation.updateResourceFile(
                        file,
                        translationFileContent,
                        translationKey,
                        translationValue
                    );
                }

                await GenerateTranslation.replaceSelectionInEditor(translationKey, translationParams, options);
            }
        } catch (error) {
            window.showErrorMessage(error.message);
        }
    }

    private static reloadConfig() {
        // Reload config with every command
        this._config = ConfigurationUtil.getConfiguration();
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

    private static async replaceSelectionInEditor(
        translationKey: string,
        paramList: { key: string; value: string }[] = [],
        options: ReplaceOptions
    ) {
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
                .replace('translate', 'translate' + translationSuffix)
                .replace('i18n', translationKey);

            await editor.edit((editBuilder) => {
                if (options.fromSelection) {
                    editBuilder.replace(editor.selection, translatePipeExpression);
                } else {
                    const text = options.originalText as string;
                    const positionFrom = editor.document.positionAt(editor.document.getText().indexOf(text));
                    const positionTo = new Position(positionFrom.line, positionFrom.character + text.length);
                    const range = new Range(positionFrom, positionTo);

                    console.log('replace in editor', positionFrom, positionTo, editor.document.getText());
                    editBuilder.replace(range, translatePipeExpression);
                }
            });
            await editor.document.save();
        }
    }
}
interface ReplaceOptions {
    fromSelection: boolean;
    originalText?: string;
}
