const CompressMethod = document.getElementById('compressMethod');
if(CompressMethod.value == 'huffman'){
    document.getElementById('compressButton').addEventListener('click', compressAudio);
}

// Function to handle file input and compression
async function compressAudio() {
    const fileInput = document.getElementById('inputaudio');
    const downloadLink = document.getElementById('downloadLink');

    if (!fileInput.files || fileInput.files.length === 0) {
        alert('Please select a WAV file.');
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async function(event) {
        const audioData = event.target.result;

        try {
            // Compress audio data using Huffman Coding
            const compressedWavData = await huffmanCompressWav(audioData);

            // Create a Blob from the compressed WAV data
            const compressedBlob = new Blob([compressedWavData], { type: 'audio/wav' });

            // Create download link
            downloadLink.href = URL.createObjectURL(compressedBlob);
            downloadLink.download = 'huffmancompressed_audio.wav';
            downloadLink.style.display = 'block';
        } catch (error) {
            console.error('Compression error:', error);
            alert('Error compressing audio.');
        }
    };

    // Read the file as an ArrayBuffer
    reader.readAsArrayBuffer(file);
}

// Node class for Huffman tree
class Node {
    constructor(freq, char, left = null, right = null) {
        this.freq = freq;
        this.char = char;
        this.left = left;
        this.right = right;
    }
}

// Function to calculate frequencies of each byte
function calculateFrequencies(data) {
    const freqMap = new Map();
    for (const byte of data) {
        freqMap.set(byte, (freqMap.get(byte) || 0) + 1);
    }
    return freqMap;
}

// Huffman Coding compression function for WAV
async function huffmanCompressWav(audioData) {
    const wavHeader = audioData.slice(0, 44); // First 44 bytes are the WAV header
    const wavBody = new Uint8Array(audioData.slice(44)); // Audio data

    const freqMap = calculateFrequencies(wavBody);
    const huffmanTree = buildHuffmanTree(freqMap);
    const huffmanCodes = generateHuffmanCodes(huffmanTree);

    // Encode the data using Huffman codes
    let encodedData = '';
    for (const byte of wavBody) {
        encodedData += huffmanCodes.get(byte);
    }

    // Convert the encoded data to Uint8Array
    const byteLength = Math.ceil(encodedData.length / 8);
    const compressedData = new Uint8Array(byteLength);
    for (let i = 0; i < encodedData.length; i += 8) {
        const byte = encodedData.substring(i, i + 8);
        compressedData[i / 8] = parseInt(byte, 2);
    }

    // Combine the WAV header with the compressed data
    const result = new Uint8Array(wavHeader.byteLength + compressedData.byteLength);
    result.set(new Uint8Array(wavHeader), 0);
    result.set(new Uint8Array(compressedData), wavHeader.byteLength);

    return result.buffer;
}

// Function to build Huffman tree from frequency map
function buildHuffmanTree(freqMap) {
    const pq = [...freqMap.entries()].map(([char, freq]) => new Node(freq, char));
    pq.sort((a, b) => a.freq - b.freq);

    while (pq.length > 1) {
        const left = pq.shift();
        const right = pq.shift();
        const newNode = new Node(left.freq + right.freq, null, left, right);
        pq.push(newNode);
        pq.sort((a, b) => a.freq - b.freq);
    }

    return pq[0];
}

// Function to generate Huffman codes from Huffman tree
function generateHuffmanCodes(tree) {
    const huffmanCodes = new Map();

    const traverse = (node, code) => {
        if (node.char !== null) {
            huffmanCodes.set(node.char, code);
        } else {
            traverse(node.left, code + '0');
            traverse(node.right, code + '1');
        }
    };

    traverse(tree, '');

    return huffmanCodes;
}

