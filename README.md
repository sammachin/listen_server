# Listen Server

Test of sending PCM audio in 3 different ways.
Switch the method by uncommenting the lines 35-37 in app.js

`sendFile` reads the source PCM file and writes it to the socket in one large message

`sendFileInChunks` reads the file in fixed chunks and sends each one as a new websocket message
you can adjust the size of the chunk by changing the final value passed to the setTimeout on line 36

`sendFileInRandomChunks` reads a random number of bytes from the file between 1 and 3000, then sends that as a websocket message.
You can adjust the size of these chunks by playing with the value of `randomSize` in line 51

There is also an 8kHz version of the source file which can be by changing the filepath on L7 and adjusting the sampleRate on L21