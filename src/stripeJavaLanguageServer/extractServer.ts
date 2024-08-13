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
const latestText = 'latest.txt';

const tarPath = `./${tarFile}`;
const source = `${href}/${tarFile}`;

// extractedTo has to match 'javaServerPath' in src/stripeJavaLanguageClient/javaServerStarter.ts
const extractTo = './dist/stripeJavaLanguageServer';

try {
  if (fs.existsSync(tarPath)) {
    // Java jdt server already downloaded:
    // verify that it is the latest version released
    // if yes, untar existing server tar
    // if not, remove existing server tar and re-download
    //
    console.log('JDT Server tar already downloaded.');

    const downloadedVersion = getDownloadedDateStamp(tarPath);
    console.log(`Local JDT server date stamp: ${downloadedVersion}`);

    request
      .get(`${href}/${latestText}`)
      .on('error', function (error: any) {
        console.log(error);
      })
      .pipe(fs.createWriteStream(latestText))
      .on('finish', function () {
        fs.readFile(latestText, 'utf-8', (err: any, data: any) => {
          if (err) {return err;}
          // data format: jdt-language-server-1.6.0-202110200520.tar.gz
          const latestVersion = data.split('-').slice(-1)[0].split('.')[0].slice(0, 8);
          if (downloadedVersion < latestVersion) {
            console.log('Local JDT server version is not latest. Remove local copy and download latest.');
            fs.unlinkSync(tarFile);
            downloadAndUntarLatestServerFile();
          } else {
            // the tarred plugins do not have a reliable way to verify versions or ensure not tampered
            // we will always untar the server tar to overwrite existing plugins
            untarServerFile();
          }
          fs.unlinkSync(latestText);
        });
      });
  } else {
    // Java jdt server does not exist: download latest and untar
    downloadAndUntarLatestServerFile();
  }
} catch (err) {
  console.error(err);
}

function downloadAndUntarLatestServerFile() {
  request
    .get(source)
    .on('error', function (error: any) {
      console.log(error);
    })
    .pipe(fs.createWriteStream(tarFile))
    .on('finish', function () {
      console.log('Download finished.');
      untarServerFile();
    });
}

function untarServerFile() {
  console.log('Untar started...');

  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(tarFile)
      .pipe(zlib.createGunzip())
      .pipe(tar.extract(extractTo))
      .on('finish', () => {
        console.log('Extraction finished.');
        fs.unlink(tarFile, (error: any) => {
          if (error) {
            console.error('Error deleting tar file:', error);
            reject(error);
          } else {
            console.log('Tar file deleted successfully');
            resolve();
          }
        });
      })
      .on('error', (error: any) => {
        console.error('Error during extraction:', error);
        reject(error);
      });
  });
}

function getDownloadedDateStamp(file: string) {
  const stat = fs.statSync(file);
  const epochMs = stat.mtimeMs;

  const date = new Date(epochMs);
  const yearStr = `${date.getFullYear()}`;
  const month = date.getMonth() + 1; // month is from 0 to 11
  const monthStr = month >= 10 ? `${month}` : `0${month}`;
  const day = date.getDate();
  const dayStr = day >= 10 ? `${day}` : `0${day}`;

  return `${yearStr}${monthStr}${dayStr}`;
}
