const { convertVideoToM3U8, createMasterPlaylist, correspondingWidth, generateWantedQualities, correspondingBandwidths } = require("./utils");

const https = require('https');
const fs = require('fs');

const dest = "./videos/batman_downloaded.mp4"
const downloadUrl = "https://media-convert-input-output.s3.amazonaws.com/input/batman.mp4"

const download = (url, dest, callback, { name, height }) => {
    const file = fs.createWriteStream(dest);
    https.get(url, function(response) {
        console.log("downloading")
        response.pipe(file);
        file.on('finish',  () => {
            file.close(callback({ name, height, dest }));
        }).on('error', (err) => { // Handle errors
            fs.unlink(dest, () => console.log("deleted after error")); // Delete the file async. (But we don't check the result)
            console.log(err)
        });
    });
    // request.setTimeout(12000, function () { // timeout 12 secs to abort the process if there's an issue ( eg. connection issue)
    //     request.abort();
    // });
}

const convertDownloadedFile = ({ name, height, dest }) => {
    console.log("before delete")
    let playlistInput = ``;
    const completed = []

    const wantedVideoQualities = generateWantedQualities(height);

    wantedVideoQualities.forEach(height => {
        const width = correspondingWidth(height);
        const { bandwidth, avgBandwidth } = correspondingBandwidths(height)

        convertVideoToM3U8(dest, name, height, () => {
            completed.push("completed");
            if (completed.length === wantedVideoQualities.length) { // to delete the downloaded file after everything's done
                fs.unlink(dest, () => console.log("deleted"))
            }
        });
        playlistInput = playlistInput + `
#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},AVERAGE-BANDWIDTH=${avgBandwidth},RESOLUTION=${width}x${height}
${name}_${height}p.m3u8
`
    });

    createMasterPlaylist(playlistInput, name);
}

//download(downloadUrl, dest, convertDownloadedFile, { name: "batman_downloaded", height: "1080" } )
convertDownloadedFile({ name: "batman", dest: "./videos/batman.mp4", height: "360"})

