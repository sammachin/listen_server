const fs = require('fs');
const express = require('express')
const app = express()
const expressWs = require('express-ws')(app);
app.use(express.json());

const filePath = "count-30.pcm"
const port = 8000
const splitSize = 5

// Serve the JSON verbs to an answer webhook 
app.post('/call', (req, res) => {
    data = [{
            "verb": "listen",
            "url": "/listen",
            "bidirectionalAudio" :{
                "enabled" : true,
                "streaming": true,
                "sampleRate": 8000
            }
        }]
  res.json(data)
})


app.post('/status', (req, res) => {
  console.log(req.body)
  res.send('ok')
})

app.ws('/listen', function(conn, req) {
    console.log('Client connected');
    let startTime = Date.now()
    markKill(filePath, conn);
    conn.on('close', function(){
        console.log('Client Disconnected')
    });
    conn.on('message', function message(data) {
        if (typeof(data)== 'string'){
            let ts = Date.now()
            let elapsed = ts-startTime
            console.log(elapsed, data)
        }
      });
});
	
// Function to read and send file in chunks
async function sendFileInChunks(filePath, conn) { 
        let count = 0
        const readStream = fs.createReadStream(filePath, { highWaterMark: 320 });
        readStream.on('data', (chunk) => {
            count +=1
            if (count < 1000){
                console.log(`Sending chunk ${count}, of size ${chunk.length} bytes`);
                var arrByte = Uint8Array.from(chunk)
                conn.send(arrByte); 
            } else {
                var arrByte = Uint8Array.from(chunk)
                var a = arrByte.slice(0,splitSize)
                console.log(`Sending chunk ${count}, of size ${a.length} bytes`);
                conn.send(a); 
                var b = arrByte.slice(splitSize)
                console.log(`Sending chunk ${count}, of size ${b.length} bytes`);
                conn.send(b); 

            }
        });
        readStream.on('end', () => {
            console.log('File transmission complete.');
        });
}

    
async function sendFile(filePath, conn){
    var raw = fs.readFileSync(filePath)
    var arrByte = Uint8Array.from(raw)
    conn.send(arrByte);
}
async function outOfOrderOdd(filePath, conn){
    var raw = fs.readFileSync(filePath)
    var arrByte = Uint8Array.from(raw)
    let chunkA = arrByte.slice(0, 338826) // first 338826 bytes
    let chunkB = arrByte.slice(338826, 338829) // next 3 bytes
    let chunkC = arrByte.slice(338829, 338830) // nest 1 byte
    let chunkD = arrByte.slice(338830, 677656) // next 338826 bytes
    let chunkE = arrByte.slice(677656) // last 338824 bytes
    conn.send(chunkA)
    conn.send(chunkB)
    conn.send(chunkD)
    conn.send(chunkC)
    conn.send(chunkE)
}

async function outOfOrderEven(filePath, conn){
    var raw = fs.readFileSync(filePath)
    var arrByte = Uint8Array.from(raw)
    let chunkA = arrByte.slice(0, 338826) // first 338826 bytes
    let chunkB = arrByte.slice(338826, 338828) // next 2 bytes
    let chunkC = arrByte.slice(338828, 338830) // nest 2 byte
    let chunkD = arrByte.slice(338830, 677656) // next 338826 bytes
    let chunkE = arrByte.slice(677656) // last 338824 bytes
    conn.send(chunkA)
    conn.send(chunkB)
    conn.send(chunkD)
    conn.send(chunkC)
    conn.send(chunkE)
}



async function markKill(filePath, conn){
    var raw = fs.readFileSync(filePath)
    var arrByte = Uint8Array.from(raw)
    let third = Math.floor(arrByte.length/3)
    let chunkA = arrByte.slice(0, third) // first third bytes (10s)
    let chunkB = arrByte.slice(third, third*2) // next third bytes (10s)
    let chunkC = arrByte.slice(third*2) // last third bytes (10s)
    setTimeout(mark, 1, 'chunkA-start', conn);
    setTimeout(send, 1, chunkA, conn);
    setTimeout(mark, 1, 'chunkA-end', conn);
    setTimeout(killAudio, 5000, conn);
    setTimeout(mark, 5000, 'chunkB-start', conn);
    setTimeout(send, 5000, chunkB, conn);
    setTimeout(mark, 5000, 'chunkB-end', conn);
    setTimeout(mark, 8000, 'chunkC-start', conn);
    setTimeout(send, 8000, chunkC, conn);
    setTimeout(mark, 8000, 'chunkC-end', conn);
}

function send(data, conn){
    conn.send(data)
}

function mark(data, conn){
    conn.send(JSON.stringify(
        {
        "type": "mark",
        "data": {
          "name": data
        }
        }
    ))
}

function killAudio(conn){
    conn.send(JSON.stringify(
      {
        "type": "killAudio",
      }
    ))
}

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })
  