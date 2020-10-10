const {exec, spawn} = require("child_process");

const correspondingWidth = (height) => {
    switch (height) {
        case "1080":
            return "1920";
        case "720":
            return "1280";
        case "480":
            return "852";
        case "360":
            return "640";
        default:
            return "-1"
    }
};
const correspondingBandwidths = (height) => {
    switch (height) {
        case "1080":
            return {bandwidth: "11136797", avgBandwidth: "8670201"};
        case "720":
            return {bandwidth: "6632834", avgBandwidth: "5127889"};
        case "480":
            return {bandwidth: "4820024", avgBandwidth: "3627026"};
        case "360":
            return {bandwidth: "892812", avgBandwidth: "698684"};
        default:
            return {bandwidth: "892812", avgBandwidth: "698684"};
    }
}

// #EXTM3U
// #EXT-X-VERSION:3
// #EXT-X-INDEPENDENT-SEGMENTS
// #EXT-X-STREAM-INF:BANDWIDTH=892812,AVERAGE-BANDWIDTH=698684,RESOLUTION=640x360
// batman_360p.m3u8
// #EXT-X-STREAM-INF:BANDWIDTH=4820024,AVERAGE-BANDWIDTH=3627026,RESOLUTION=852x480
// batman_480p.m3u8
// #EXT-X-STREAM-INF:BANDWIDTH=6632834,AVERAGE-BANDWIDTH=5127889,RESOLUTION=1280x720
// batman_720p.m3u8
// #EXT-X-STREAM-INF:BANDWIDTH=11136797,AVERAGE-BANDWIDTH=8670201,RESOLUTION=1920x1080
// batman_1080p.m3u8

const execCallback = (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }
    console.log(`stdout: ${stdout}`);
};

const createSpawn = (command) => { // spawn runs a process in shell and doesn't create a new shell while excec create a new shell which can be a security risk// also spawn is more suitable for running long process with huge output
    return spawn(command, {
        stdio: "inherit",
        shell: true // making spawn accept shell command
    });
}

const convertVideoToM3U8 = (videoSrc,videoName, resolution, callback) => {
    const width = correspondingWidth(resolution);

    // scaling video quality with -vf scale="width:height" command
    // limiting each segments length to 10sec with -hls_time 10 command
    //overriding default .m3u8 playlist size with -hls_list_size 0
   // exec(`ffmpeg -y -i ${videoSrc} -vf scale="${width}:${resolution}" -hls_time 10 -hls_list_size 0 ./videos/${videoName}_${resolution}p.m3u8`, execCallback);
    const child = createSpawn(`ffmpeg -y -i ${videoSrc} -vf scale="${width}:${resolution}" -hls_time 10 -hls_list_size 0 ./videos/${videoName}_${resolution}p.m3u8`);

    child.on("exit",   (code, signal) => {
        console.log('child process exited with ' +
            `code ${code} and signal ${signal}`);
    });
    child.on("close", callback);
    child.on("error", (code) => {
        console.log(`child process errored with code ${code}`)
    })
};

const createMasterPlaylist = (input, name) => {
    createSpawn(`cd ./videos && touch ${name}.m3u8 && cat > ${name}.m3u8 << EOL
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-INDEPENDENT-SEGMENTS
${input}
EOL
`)
}

const generateWantedQualities = (height) => {
    switch (height){
        case "1080":
            return [ "360", "480", "720", "1080" ];
        case "720":
            return [ "360", "480", "720" ]
        case "480":
            return [ "360", "480" ]
        case "360":
            return [ "360" ]
    }
}

module.exports = {
    convertVideoToM3U8,
    createMasterPlaylist,
    correspondingWidth,
    generateWantedQualities,
    correspondingBandwidths
}