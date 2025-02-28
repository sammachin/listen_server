const fs = require('fs');
const express = require('express')
const app = express()
const expressWs = require('express-ws')(app);
app.use(express.json());

const filePath = "./crazyones.pcm"
const port = 8000

// Serve the JSON verbs to an answer webhook 
app.post('/call', (req, res) => {
    data = [{
            "verb": "say",
            "text": "Connecting to Socket"
        }, {
            "verb": "listen",
            "url": "/listen",
            "bidirectionalAudio" :{
                "enabled" : true,
                "streaming": true,
                "sampleRate": 16000
            }
        }]
  res.json(data)
})


app.post('/status', (req, res) => {
  //console.log(req.body)
  res.send('ok')
})

app.ws('/listen', function(conn, req) {
    console.log('Client connected');
    //setTimeout(sendFileInRandomChunks, 1000, filePath, conn);
    setTimeout(sendFileInChunks, 1000, filePath, conn, 111);
    //setTimeout(sendFile, 96000, filePath, conn);
    conn.on('close', function(){
        console.log('Client Disconnected')
    });
});
	
// Function to read and send file in random sized chunks
async function sendFileInRandomChunks(filePath, conn) { 
        let count = 0
        let byteCount = 0
        const readStream = fs.createReadStream(filePath);
        readStream.on('data', (chunk) => {
            count +=1
            // Get a random size between 1 and min(3000, chunk.length)
            const randomSize = Math.floor(Math.random() * Math.min(1500, chunk.length)) + 1;
            const partialChunk = chunk.slice(0, randomSize);
            byteCount += randomSize
            console.log(`Sending chunk ${count}, of size ${partialChunk.length} bytes`);
            conn.send(partialChunk);
            // If there's remaining data, send it in the next iteration
            if (randomSize < chunk.length) {
                const remaining = chunk.slice(randomSize);
                readStream.unshift(remaining);
            }
        });
        readStream.on('end', () => {
            console.log('File transmission complete.');
            console.log(`${byteCount} bytes sent`)
        });
}
// Function to read and send file in fixed 320 byte chunks
async function sendFileInChunks(filePath, conn, size) { 
    let count = 0
    let byteCount = 0
    const readStream = fs.createReadStream(filePath, { highWaterMark: size });
    readStream.on('data', (chunk) => {
        byteCount += chunk.length
        count +=1  
        console.log(`Sending chunk ${count}, of size ${chunk.length} bytes`);
        conn.send(chunk); 
    });
    readStream.on('end', () => {
        console.log('File transmission complete.');
        console.log(`${byteCount} bytes sent`)
    });
}

// Function to read and send file as one
async function sendFile(filePath, conn){
    var raw = fs.readFileSync(filePath)
    console.log(`Sending chunk 1, of size ${raw.length} bytes`);
    conn.send(raw);
}

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })
  