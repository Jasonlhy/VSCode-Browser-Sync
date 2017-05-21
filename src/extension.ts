'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as child_process from 'child_process';
import * as browserSync from 'browser-sync'

import BrowserSyncContentProvider from './BrowserSyncContentProvider';
const SCHEME_NAME: string = 'JasonBrowserSync';
let runningBS = [];

function getBrowserSyncUri(uri: vscode.Uri, mode: string, port: number) {
    if (uri.scheme === SCHEME_NAME) {
        return uri;
    }

    return uri.with({
        scheme: SCHEME_NAME,
        path: uri.fsPath,
        query: port.toString(),
        fragment: mode
    });
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "vscode-browser-sync" is now active!');

    const contentProvider = new BrowserSyncContentProvider();
    vscode.workspace.registerTextDocumentContentProvider(SCHEME_NAME, contentProvider);

    context.subscriptions.push(vscode.commands.registerTextEditorCommand('extension.browserSyncServerAtPanel', () => startServer(true)));
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('extension.browserSyncServerInBrowser', () => startServer(false)));

    context.subscriptions.push(vscode.commands.registerTextEditorCommand('extension.browserSyncProxyAtPanel', () => startProxy(true)));
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('extension.browserSyncProxyInBrowser', () => startProxy(false)));

    context.subscriptions.push(vscode.commands.registerTextEditorCommand('extension.exitAll', exitAll));
}

function openSidePanel(mode: string, port: number) {
    const editor = vscode.window.activeTextEditor;
    const doc = editor.document;
    let uri = getBrowserSyncUri(doc.uri, mode, port);

    vscode.commands
        .executeCommand('vscode.previewHtml', uri, vscode.ViewColumn.Two)
        .then(s => console.log('done'), vscode.window.showErrorMessage);
}

async function startServer(openAtPanel: Boolean) {
    let doc = vscode.window.activeTextEditor.document;
    let parentFolder = path.dirname(doc.uri.fsPath);
    let files = await getWatchFiles(doc);

    // It must use absolute path
    // Canont use relatie path to the cwd such as ["./*.html"]
    // It autodetect the free port for you
    let bs = browserSync.create();
    let config = {
        files: files,
        server: {
            baseDir: parentFolder,
            directory: true
        }
    };
    if (openAtPanel) {
        config['open'] = false;
    }

    bs.init(config,
        function () {
            // I find this method under the debugger not inside the documentation
            let port: number = bs.getOption("port");
            let msg = "Estbalished server with port: " + port
            vscode.window.showInformationMessage(msg);
            console.log(msg);

            if (openAtPanel) {
                openSidePanel("server", port);
            }
            runningBS.push(bs);
        }
    );
}

// return the watching files in absolute path
async function getWatchFiles(doc: vscode.TextDocument): Promise<[string]> {
    let cwd = null, files = null;
    if (vscode.workspace.rootPath) {
        let detectList = await vscode.window.showInputBox({
            placeHolder: "e.g. app/*.html|app/*.css",
            prompt: "Enter relative path of files to root folder separated by | to watch multiple locations",
        });

        if (detectList) {
            cwd = vscode.workspace.rootPath;
            files = detectList.split("|");
        } else {
            cwd = path.dirname(doc.uri.fsPath);
            let thisType = "*" + path.extname(doc.uri.fsPath);
            files = [thisType];
        }
    } else {
        cwd = path.dirname(doc.uri.fsPath);
        let thisType = "*" + path.extname(doc.uri.fsPath);
        files = [thisType];
    }

    return files.map(p => path.join(cwd, p));
}

async function getBaseURL(): Promise<string> {
    let inputURL = await vscode.window.showInputBox({
        placeHolder: "e.g. http://localhost:3000/Home",
        prompt: "Please enter the URL you want to sync with the change of files",
    });
    console.log('inputURL: ' + inputURL);

    // only port number
    if (inputURL && inputURL.match(/^\d+$/)) {
        inputURL = "http://localhost:" + inputURL;
    }

    return inputURL;
}

async function startProxy(openAtPanel: Boolean) {
    let doc = vscode.window.activeTextEditor.document;
    let inputURL = await getBaseURL();
    let files = await getWatchFiles(doc);

    // It must use absolute path
    // Canont use relatie path to the cwd such as ["./*.html"]
    // It autodetect the free port for you
    let bs = browserSync.create();
    let config = {
        proxy: inputURL,
        files: files,
    };
    if (openAtPanel) {
        config['open'] = false;
    }

    bs.init(config,
        function () {
            // I find this method under the debugger not inside the documentation
            let port: number = bs.getOption("port");
            let msg = "Estbalished proxy with port: " + port;
            console.log(msg);
            vscode.window.showInformationMessage(msg);

            if (openAtPanel) {
                openSidePanel("proxy", port);
            }
            runningBS.push(bs);
        }
    );
}

function exitAll() : Promise<{}[]> {
    let promises = runningBS.map((bs) => new Promise((resolve, reject) => {
        setTimeout(() => {
            let port: number = bs.getOption("port");
            bs.exit();

            let msg = "Browser Sync server/proxy with port: " + port + " is closed";
            console.log(msg);
            resolve(msg);
        }, 3000)
    }));

    return Promise.all(promises);
}

// this method is called when your extension is deactivated
// Extension must return a Promise from deactivate() 
// if the cleanup process is asynchronous.
// An extension may return undefined from deactivate()
// if the cleanup runs synchronously.
export function deactivate() : Promise<{}[]>{
    return exitAll();
}