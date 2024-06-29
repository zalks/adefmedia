const CompressMethod = document.getElementById('compressMethod');
if(CompressMethod.value == 'arithmetic'){
    document.getElementById('compressButton').addEventListener('click', compressAudio);
}
async function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
    });
}

async function compressAudio() {
    const fileInput = document.getElementById('inputaudio');
    if (fileInput.files.length === 0) {
        alert('Please select a WAV file');
        return;
    }

    const file = fileInput.files[0];
    const arrayBuffer = await readFile(file);
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const numberOfChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;
    const sampleRate = audioBuffer.sampleRate;
    const audioData = [];

    for (let channel = 0; channel < numberOfChannels; channel++) {
        audioData.push(audioBuffer.getChannelData(channel));
    }

    // Perform lossless compression (in this case, we'll just re-encode it without actual compression for demonstration)
    const compressedData = compressAudioData(audioData);

    // Convert the compressed data back to a WAV file
    const wavBuffer = createWavBlob(compressedData, sampleRate, numberOfChannels);

    const url = URL.createObjectURL(wavBuffer);

    const downloadLink = document.getElementById('downloadLink');
    downloadLink.href = url;
    downloadLink.download = 'arithmeticcompressed_audio.wav';
    downloadLink.style.display = 'block';
    downloadLink.textContent = 'Download Compressed Audio';
    // Placeholder for actual compression logic
    // For demonstration, we'll just return the same data
    return audioData.map(channelData => new Float32Array(channelData));
}

function createWavBlob(data, sampleRate, numberOfChannels) {
    const bitDepth = 16; // Bit depth is fixed at 16 bits for simplicity
    const blockAlign = numberOfChannels * (bitDepth / 8);
    const byteRate = sampleRate * blockAlign;
    const dataLength = data[0].length * (bitDepth / 8);
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    /* RIFF identifier */
    writeString(view, 0, 'RIFF');
    /* file length */
    view.setUint32(4, 36 + dataLength, true);
    /* RIFF type */
    writeString(view, 8, 'WAVE');
    /* format chunk identifier */
    writeString(view, 12, 'fmt ');
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw) */
    view.setUint16(20, 1, true);
    /* channel count */
    view.setUint16(22, numberOfChannels, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, byteRate, true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, blockAlign, true);
    /* bits per sample */
    view.setUint16(34, bitDepth, true);
    /* data chunk identifier */
    writeString(view, 36, 'data');
    /* data chunk length */
    view.setUint32(40, dataLength, true);

    // Write the audio data
    const dataView = new Int16Array(buffer, 44);
    for (let i = 0; i < data[0].length; i++) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
            dataView[i * numberOfChannels + channel] = data[channel][i] * 32767; // Convert float to PCM 16-bit
        }
    }

    return new Blob([view], { type: 'audio/wav' });
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}
