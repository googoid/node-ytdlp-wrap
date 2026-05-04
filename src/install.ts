import { spawn } from 'child_process';
import { https } from 'follow-redirects';
import fs from 'fs';
import os from 'os';
import path from 'path';

const platform = os.platform();
console.log(`OS Platform: ${platform}`);

let downloadURL: string;
if (platform === 'win32') {
	downloadURL = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';
}
else if (platform === 'darwin') {
	downloadURL = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos';
}
else {
	downloadURL = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
}
console.log(`Downloading yt-dlp from: ${downloadURL}`);

const tempPath = path.join(__dirname, platform === 'win32' ? 'yt-dlp-temp.exe' : 'yt-dlp-temp');
console.log(`Saving yt-dlp to: ${tempPath}`);

const writer = fs.createWriteStream(tempPath);
https.get(downloadURL, (response) => {
	response.pipe(writer);
	writer.on('close', () => {
		console.log('Finished downloading yt-dlp');

		console.log('Making yt-dlp executable...');
		fs.chmodSync(tempPath, 0o755);

		console.log('Getting version of yt-dlp');
		const getVer = spawn(tempPath, [
			'--version'
		]);

		getVer.stdout.on('data', (data) => {
			const version = data.toString().replace('\r', '').replace('\n', '');
			console.log(`YT-DLP version: ${version}`);

			const binaryName = platform === 'win32' ? `yt-dlp-${version}.exe` : `yt-dlp-${version}`;
			const ytdlpPath = path.join(__dirname, binaryName);
			console.log(`Saving YT-DLP to: ${ytdlpPath}`);

			const copy = fs.createWriteStream(ytdlpPath);
			fs.createReadStream(tempPath).pipe(copy);

			copy.on('close', () => {
				console.log('Writing metedata');
				fs.writeFileSync(path.join(__dirname, 'meta.json'), JSON.stringify({
					path: ytdlpPath,
					version: version
				}), 'utf-8');
				fs.chmodSync(ytdlpPath, 0o755);
				console.log('YT-DLP Installed!');
				fs.unlink(tempPath, (error) => {
					if (error) {
						console.log('Error while removing temp files');
						console.log(error);
					}
				});
			});
		});
	});
});