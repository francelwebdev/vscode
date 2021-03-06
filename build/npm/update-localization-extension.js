/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

let i18n = require("../lib/i18n");

let fs = require("fs");
let path = require("path");
let vfs = require("vinyl-fs");
let rimraf = require('rimraf');

function update(idOrPath) {
	if (!idOrPath) {
		throw new Error('Argument must be the location of the localization extension.');
		return;
	}
	let locExtFolder = idOrPath;
	if (/^\w{2}(-\w+)?$/.test(idOrPath)) {
		locExtFolder = '../vscode-localization-' + idOrPath;
	}
	let locExtStat = fs.statSync(locExtFolder);
	if (!locExtStat || !locExtStat.isDirectory) {
		throw new Error('No directory found at ' + idOrPath);
	}
	let packageJSON = JSON.parse(fs.readFileSync(path.join(locExtFolder, 'package.json')).toString());
	let contributes = packageJSON['contributes'];
	if (!contributes) {
		throw new Error('The extension must define a "localizations" contribution in the "package.json"');
	}
	let localizations = contributes['localizations'];
	if (!localizations) {
		throw new Error('The extension must define a "localizations" contribution of type array in the "package.json"');
	}

	localizations.forEach(function (localization) {
		if (!localization.languageId || !localization.languageName || !localization.translations) {
			throw new Error('Each localization contribution must define "languageId", "languageName" and "translations" properties.');
		}
		let server = localization.server || 'www.transifex.com';
		let userName = localization.userName || 'api';
		let apiToken = process.env.TRANSIFEX_API_TOKEN;
		let languageId = localization.transifexId || localization.languageId;
		let translationDataFolder = path.join(locExtFolder, localization.translations);

		if (fs.existsSync(translationDataFolder) && fs.existsSync(path.join(translationDataFolder, 'main.i18n.json'))) {
			console.log('Clearing  \'' + translationDataFolder + '\'...');
			rimraf.sync(translationDataFolder);
		}

		console.log('Downloading translations for \'' + languageId + '\' to \'' + translationDataFolder + '\'...');
		i18n.pullI18nPackFiles(server, userName, apiToken, { id: languageId })
			.pipe(vfs.dest(translationDataFolder));
	});


}
if (path.basename(process.argv[1]) === 'update-localization-extension.js') {
	update(process.argv[2]);
}
