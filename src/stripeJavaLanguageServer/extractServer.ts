/* eslint-disable no-sync */

'use strict';

// Import
const request = require('superagent');
const fs = require('fs');
const tar = require('tar-fs');
const zlib = require('zlib');

// Eclipse JDT source
// https://www.eclipse.org/community/eclipse_newsletter/2017/may/article4.php
const href = 'http://download.eclipse.org/jdtls/snapshots/';
const tarFile = 'jdt-language-server-latest.tar.gz';

const tarPath = `./${tarFile}`;
const source = `${href}/${tarFile}`;

const extractTo = './out/src/stripeJavaLanguageServer';
const extractedPlugin = `${extractTo}/plugins`;

try {
  if (fs.existsSync(tarPath)) {
    console.log('JDT Server tar already downloaded.');

    if (fs.existsSync(extractedPlugin)) {
      console.log('JDT Server tar already extracted.');
    } else {
      untarFile();
    }
  } else {
    request
      .get(source)
      .on('error', function(error: any) {
        console.log(error);
      })
      .pipe(fs.createWriteStream(tarFile))
      .on('finish', function() {
          console.log('Download finished.');
          untarFile();
      });
  }
} catch(err) {
  console.error(err);
}

function untarFile() {
  console.log('Untar started...');

  fs.createReadStream(tarFile)
    .pipe(zlib.createGunzip())
    .pipe(tar.extract(extractTo));

  console.log('Untar finished.');
};
