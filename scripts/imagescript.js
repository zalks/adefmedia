const compressionForm = document.getElementById('compression-form');
const audioFile = document.getElementById('audioFile');
const codingMethodRadio = document.getElementById('codingMethod');
const compressButton = document.getElementById('compress-button');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

compressionForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const audioData = audioFile.files[0];
    if (!audioData) {
        alert('Pilih file audio terlebih dahulu');
        return;
    }

    const selectedCodingMethod = codingMethodRadio.value;

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/compress-audio');
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.upload.addEventListener('progress', function(event) {
        const progress = Math.round((event.loaded / event.total) * 100);
        progressText.textContent = progress + '%';
    });
    xhr.onload = function() {
        if (xhr.status === 200) {
            alert('Kompresi berhasil');
        } else {
            alert('Gagal melakukan kompresi');
        }
    };
    xhr.send(`audioFile=${audioData}&codingMethod=${selectedCodingMethod}`);

    progressBar.style.display = 'block';
    compressButton.disabled = true;
});
