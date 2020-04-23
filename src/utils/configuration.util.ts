import { workspace } from 'vscode';

export interface GenerateTranslationConfiguration {
    selectedTextIsValue: boolean;
    path: string;
    includeLibraryName: boolean;
    includeFileNameName: boolean;
    replaceForExtensions: string[];
    templateSnippetToReplace: string;
    sort: boolean;
}

export class ConfigurationUtil {
    static getConfiguration(): GenerateTranslationConfiguration {
        const section = workspace.getConfiguration('generate-translation');
        return {
            selectedTextIsValue: section.get('text-is-value'),
            path: `${workspace.rootPath}${section.get('path')}`,
            includeLibraryName: section.get('include-library-name'),
            includeFileNameName: section.get('include-file-name'),
            replaceForExtensions: section.get('replaceForExtensions'),
            templateSnippetToReplace: section.get('templateSnippetToReplace'),
            sort: section.get('sort'),
        } as GenerateTranslationConfiguration;
    }
}
