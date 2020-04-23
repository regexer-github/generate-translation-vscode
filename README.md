# Generate Translation :alien:

A visual studio code extension for you to generate the translations without leaving the current file.

## Usage

### Text-is-value: false

![Usage](/assets/generate-translation.gif)

### Text-is-value: true
![Usage](/assets/generate-translation-text-is-value.gif)

## Finding hardcoded strings in your templates
 Here are some handy regular expressions you can use for this. As far as I know, vscode api currently does not support search, so you'll have to do this manually.

 - Match text inside HTML tags e.g. `<p>Some text</p>` -> `>\s*\w+[\w\s]*(?=<)`
   - unfortunately, no undelimited lookbehind allowed 🙁 so `(?<=>\s*)\w+[\w\s]*(?=<)` wont work 
 - Match text inside title attributes e.g. `<p title="title here">Text here</p>` -> `(?<=title=")\w[\w\s]*(?=")`

## Extension Settings

This extension contributes the following settings:

-   `generate-translation.path`: Path to find your i18n files.
-   `generate-translation.text-is-value`: The selection contains the actual value and not the key of the translation.
-   `generate-translation.include-file-name`: Only applies if `text-is-value: true`. Add the file name as a prefix with a dot '.' as a separator.
-   `generate-translation.include-library-name`: Only applies if `text-is-value: true`. Add the library name as a prefix with a dot '.' as a separator.
-   `generate-translation.sort`: Sort object after inserting translation.
-   `generate-translation.replaceOnTranslate`: Replace the selected text in HTML files after generating a translation string.
-   `generate-translation.templateHtmlToReplace`: Template HTML to replace the selected text after generating a translation string. \n The string i18n will be replaced by the chosen key.

```

```
