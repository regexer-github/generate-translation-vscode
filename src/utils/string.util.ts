import { window } from 'vscode';

export interface KeyValue {
    key: string;
    value: string;
}
export class StringUtil {
    static getTranslationParams(textSelection: string): KeyValue[] {
        // Match the expression inside the curly braces
        // e.g. {{ user.name }} matches user.name
        const regex = /(?<=\{\{).*?(?=\}\})/g;
        const params = textSelection.match(regex);
        if (!params) {
            return [];
        }

        return params.map((p) => {
            return {
                key: StringUtil.getCamelCaseString(p),
                value: p.trim(),
            } as KeyValue;
        });
    }
    static buildTranslationKeyFromText(textSelection: string): string {
        // Remove angular bracket expressions e.g. Transport {{ x }}
        textSelection = textSelection.replace(/\{\{(.*?)\}\}/gi, '$1');
        // Remove all non white space // alphabetical chars
        return StringUtil.getCamelCaseString(textSelection);
    }
    static getCamelCaseString(textSelection: string): string {
        textSelection = textSelection.replace(/[^\w\s]/gi, ' ').trim();
        const wordArray = textSelection.split(' ').map((word, index) => {
            // word = word.toLowerCase();

            if (index === 0) {
                word = word.charAt(0).toLowerCase() + word.substring(1);
            }

            if (index > 0) {
                word = word.charAt(0).toUpperCase() + word.substring(1);
            }
            return word;
        });
        return wordArray.join('');
    }

    static addPrefixToText(textSelection: string, includeFileName: boolean, includeLibraryName: boolean) {
        const activeEditorDirectory = window.activeTextEditor.document.fileName.split('\\');
        let filePrefix = '';
        if (includeFileName) {
            const fileName = activeEditorDirectory[activeEditorDirectory.length - 1];
            // Split the filename to remove the extension and file type e.g. .component.ts
            const componentName = fileName.split('.')[0];
            filePrefix = componentName + '.';
        }

        let libraryPrefix = '';
        if (includeLibraryName) {
            let libraryName = '';
            // Move up the directory structure until we find the src file
            for (let i = activeEditorDirectory.length - 1; i >= 0; i--) {
                if (activeEditorDirectory[i] === 'src') {
                    libraryName = activeEditorDirectory[i - 1];
                    break;
                }
            }
            libraryPrefix = libraryName + '.';
        }

        return libraryPrefix + filePrefix + textSelection;
    }

    static normalizeKey = (key: string) => key.replace(' ', '_');
}
