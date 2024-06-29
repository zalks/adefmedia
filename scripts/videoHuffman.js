// Class HuffmanNode untuk representasi simpul dalam pohon Huffman
class HuffmanNode {
  constructor(symbol, frequency, left = null, right = null) {
    this.symbol = symbol;
    this.frequency = frequency;
    this.left = left;
    this.right = right;
  }
}

// Fungsi untuk menghitung frekuensi masing-masing byte dalam video
function calculateFrequency(data) {
  const frequency = {};
  for (let i = 0; i < data.length; i++) {
    const byte = data[i];
    frequency[byte] = (frequency[byte] || 0) + 1;
  }
  return frequency;
}

// Fungsi untuk membangun pohon Huffman dari tabel frekuensi
function buildHuffmanTree(frequency) {
  const nodes = Object.entries(frequency).map(([symbol, frequency]) => new HuffmanNode(symbol, frequency));
  
  while (nodes.length > 1) {
    nodes.sort((a, b) => a.frequency - b.frequency);
    const left = nodes.shift();
    const right = nodes.shift();
    const newNode = new HuffmanNode(null, left.frequency + right.frequency, left, right);
    nodes.push(newNode);
  }
  
  return nodes[0];
}

// Fungsi rekursif untuk membangun tabel kode Huffman dari pohon Huffman
function buildHuffmanCodes(node, prefix = '', codeTable = {}) {
  if (node.left === null && node.right === null) {
    codeTable[node.symbol] = prefix;
    return codeTable;
  }
  if (node.left) buildHuffmanCodes(node.left, prefix + '0', codeTable);
  if (node.right) buildHuffmanCodes(node.right, prefix + '1', codeTable);
  return codeTable;
}

// Fungsi untuk mengkodekan data video menggunakan tabel kode Huffman
function huffmanEncode(data, huffmanCodes) {
  return data.map(byte => huffmanCodes[byte]).join('');
}

// Fungsi untuk mendekode hasil kompresi Huffman
function huffmanDecode(encodedData, huffmanTree) {
  let decodedData = [];
  let node = huffmanTree;
  for (const bit of encodedData) {
    node = bit === '0' ? node.left : node.right;
    if (node.left === null && node.right === null) {
      decodedData.push(parseInt(node.symbol));
      node = huffmanTree;
    }
  }
  return new Uint8Array(decodedData);
}

// Fungsi untuk menghitung total frekuensi untuk Arithmetic Coding
function getTotalFrequency(frequencyTable) {
  return Object.values(frequencyTable).reduce((a, b) => a + b, 0);
}

// Class ArithmeticCoding untuk implementasi Arithmetic Coding
class ArithmeticCoding {
  constructor(frequencyTable) {
    this.probabilityTable = this.getProbabilityTable(frequencyTable);
  }

  getProbabilityTable(frequencyTable) {
    const totalFrequency = getTotalFrequency(frequencyTable);

    const probabilityTable = {};
    let cumulativeProbability = 0;
    for (const key in frequencyTable) {
      const probability = frequencyTable[key] / totalFrequency;
      probabilityTable[key] = {
        low: cumulativeProbability,
        high: cumulativeProbability + probability,
      };
      cumulativeProbability += probability;
    }

    return probabilityTable;
  }

  encode(videoData, probabilityTable) {
    const encoder = [];
    let low = 0.0;
    let high = 1.0;

    for (let i = 0; i < videoData.length; i++) {
      const symbol = videoData[i];
      const { low: rangeLow, high: rangeHigh } = probabilityTable[symbol];
      const range = high - low;

      high = low + range * rangeHigh;
      low = low + range * rangeLow;

      encoder.push([low, high]);
    }

    return encoder;
  }

  decode(encodedData, probabilityTable, videoDataLength) {
    const decodedData = [];
    let low = 0.0;
    let high = 1.0;

    for (let i = 0; i < videoDataLength; i++) {
      const encodedValue = encodedData[i];
      let symbol = null;

      for (const key in probabilityTable) {
        const { low: rangeLow, high: rangeHigh } = probabilityTable[key];
        if (encodedValue >= rangeLow && encodedValue < rangeHigh) {
          symbol = key;
          break;
        }
      }

      if (symbol !== null) {
        decodedData.push(symbol);
        const { low: rangeLow, high: rangeHigh } = probabilityTable[symbol];
        const range = high - low;
        low = low + range * rangeLow;
        high = low + range * rangeHigh;
      }
    }

    return decodedData;
  }
}

// Mengambil elemen-elemen dari DOM
const fileInput = document.getElementById('inputvideo');
const compressButton = document.getElementById('compressButton');
const downloadButton = document.getElementById('downloadLink');
const algorithmSelect = document.getElementById('compressMethod');
const video = document.getElementById('video');
const videoInfoDiv = document.querySelector('.video-info');
const progressSection = document.getElementById('progress-section');
const progressBar = document.getElementById('progress');

let videoData;
let compressedVideo;

// Event listener untuk input file
fileInput.addEventListener('change', (e) => {
  const file = fileInput.files[0];
  const reader = new FileReader();
  reader.onload = async (e) => {
    videoData = new Uint8Array(e.target.result);
    video.src = URL.createObjectURL(new Blob([videoData], { type: 'video/mp4' }));
    compressButton.disabled = false;

    // Menampilkan informasi video
    const videoDuration = await getVideoDuration(file);
    const videoSize = formatBytes(file.size);
    videoInfoDiv.innerHTML = `
      <p><strong>Nama Video:</strong> ${file.name}</p>
      <p><strong>Durasi:</strong> ${videoDuration}</p>
      <p><strong>Ukuran:</strong> ${videoSize}</p>
    `;
    videoInfoDiv.style.display = 'block';
  };
  reader.readAsArrayBuffer(file);
});

// Fungsi untuk mendapatkan durasi video
function getVideoDuration(file) {
  const video = document.createElement('video');
  video.src = URL.createObjectURL(file);
  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(formatTime(video.duration));
    };
  });
}

// Fungsi untuk memformat durasi dalam format jam:menit:detik
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours}:${minutes}:${secs}`;
}


// Fungsi untuk memformat ukuran file dalam byte, KB, MB, dll.
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Event listener untuk tombol kompresi
compressButton.addEventListener('click', async () => {
  const algorithm = algorithmSelect.value;
  if (algorithm === 'huffman') {
    const frequency = calculateFrequency(videoData);
    const huffmanTree = buildHuffmanTree(frequency);
    const huffmanCodes = buildHuffmanCodes(huffmanTree);
    const encodedData = huffmanEncode(Array.from(videoData), huffmanCodes);
    compressedVideo = huffmanDecode(encodedData, huffmanTree);

    // Menampilkan progress section
    progressSection.style.display = 'block';
    progressBar.style.width = '0%';

    // Menunggu sedikit sebelum menampilkan progres
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Mengupdate progres dan menampilkan link download setelah kompresi selesai
    progressBar.style.width = '100%';
    setTimeout(() => {
      showDownloadLink();
      progressSection.style.display = 'none'; // Sembunyikan progress section setelah selesai
    }, 500);
  } else if (algorithm === 'arithmetic') {
    const frequencyTable = calculateFrequency(videoData);
    const ac = new ArithmeticCoding(frequencyTable);
    const encodedData = ac.encode(videoData, ac.probabilityTable);
    compressedVideo = ac.decode(encodedData, ac.probabilityTable, videoData.length);

    // Menampilkan progress section
    progressSection.style.display = 'block';
    progressBar.style.width = '0%';

    // Menunggu sedikit sebelum menampilkan progres
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Mengupdate progres dan menampilkan link download setelah kompresi selesai
    progressBar.style.width = '100%';
    setTimeout(() => {
      showDownloadLink();
      progressSection.style.display = 'none'; // Sembunyikan progress section setelah selesai
    }, 500);
  }

  // Pilihan algoritma lain dapat ditambahkan di sini

});

// Event listener untuk tombol download
downloadButton.addEventListener('click', () => {
  const blob = new Blob([compressedVideo], { type: 'video/mp4' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'compressed_video.mp4';
  a.click();
});

// Fungsi untuk menampilkan tombol download setelah kompresi selesai
function showDownloadLink() {
  document.getElementById('download-section').style.display = 'block';
}

