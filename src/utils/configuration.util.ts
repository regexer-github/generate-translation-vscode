import { workspace } from 'vscode';

export interface GenerateTranslationConfiguration {
    selectedTextIsValue: boolean;
    path: string;
    includeLibraryName: boolean;
    includeFileNameName: boolean;
    sort: boolean;
    defaultLanguage: string;
    leaveNonDefaultLanguagesBlank: boolean;
}

export class ConfigurationUtil {
    static getConfiguration(): GenerateTranslationConfiguration {
        const section = workspace.getConfiguration('ng-translator');
        return {
            selectedTextIsValue: section.get('textIsValue'),
            includeLibraryName: section.get('includeLibraryName'),
            includeFileNameName: section.get('includeFileName'),
            path: `${workspace.rootPath}${section.get('path')}`,
            sort: section.get('sort'),
            defaultLanguage: section.get('defaultLanguage'),
            leaveNonDefaultLanguagesBlank: section.get('leaveNonDefaultLanguagesBlank'),
        } as GenerateTranslationConfiguration;
    }
}
