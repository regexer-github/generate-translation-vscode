import fs = require('fs');
import path = require('path');
import { window } from 'vscode';
import { JsonUtil } from './json.util';
export class File {
    public get name() {
        return this.path.replace(`${this.directory}/`, '');
    }
    constructor(public readonly path: string, private readonly directory: string) {}
}
export class FileUtil {
    private static _editor = window.activeTextEditor;
    static async updateFile(file: File, translateObject: any, sort: boolean) {
        try {
            const tabSize = FileUtil.getTabSize();
            if (sort) {
                translateObject = JsonUtil.sortObject(translateObject);
            }

            fs.writeFile(file.path, JSON.stringify(translateObject, null, tabSize), (err: any) => {
                if (err) {
                    throw err;
                }
            });
        } catch {
            throw new Error(`Error saving file ${file.name}.`);
        }
    }

    static getFiles = (basePath: string, ext: string, files: any, result: File[]): File[] => {
        try {
            files = files || fs.readdirSync(basePath);
            result = result || [];

            files.forEach((file: string) => {
                const newbase = path.join(basePath, file);

                if (fs.statSync(newbase).isDirectory()) {
                    result = FileUtil.getFiles(newbase, ext, fs.readdirSync(newbase), result);
                } else if (file.includes(ext)) {
                    result.push(new File(newbase, basePath));
                }
            });
            return result;
        } catch {
            throw new Error('No translation file was found. Check the path configured in the extension.');
        }
    };

    private static getTabSize() {
        let tabSize: string | number = 4;
        if (FileUtil._editor && FileUtil._editor.options.tabSize) {
            tabSize = FileUtil._editor.options.tabSize;
        }
        return tabSize;
    }
}
