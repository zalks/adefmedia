document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('inputvideo');
    const compressButton = document.getElementById('compressButton');
    const compressMethod = document.getElementById('compressMethod');
    const progressSection = document.getElementById('progress-section');
    const progressBar = document.getElementById('progress');
    const downloadSection = document.getElementById('download-section');
    const downloadButton = document.getElementById('downloadLink');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
  
    let compressedVideoBlob;

    if (algorithm === 'arithmetic') {
      compressVideoUsingArithmeticCoding(fileInput);
    }

    fileInput.addEventListener('change', () => {
      compressButton.disabled = !fileInput.files.length;
    });
  
    compressButton.addEventListener('click', async () => {
      const algorithm = compressMethod.value;
      if (algorithm === 'arithmetic') {
        progressSection.style.display = 'block';
        await compressVideoUsingArithmeticCoding(fileInput.files[0]);
        progressSection.style.display = 'none';
        downloadSection.style.display = 'block';
      }
    });
  
    downloadButton.addEventListener('click', () => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(compressedVideoBlob);
      link.download = 'compressed_video.webm';
      link.click();
    });
    
    async function compressVideoUsingArithmeticCoding(file) {
      const videoElement = document.createElement('video');
      videoElement.src = URL.createObjectURL(file);
  
      const stream = canvas.captureStream();
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      let chunks = [];
  
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
  
      mediaRecorder.onstop = () => {
        compressedVideoBlob = new Blob(chunks, { type: 'video/webm' });
        console.log('Compression complete');
      };
  
      mediaRecorder.start();
  
      await videoElement.play();
  
      videoElement.addEventListener('timeupdate', () => {
        if (videoElement.currentTime >= videoElement.duration) {
          mediaRecorder.stop();
          return;
        }
  
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  
        const totalFrames = Math.floor(videoElement.duration * 30); // assuming 30 fps
        const currentFrame = Math.floor(videoElement.currentTime * 30);
        progressBar.style.width = `${(currentFrame / totalFrames) * 100}%`;
      });
  
      videoElement.currentTime = 0;
    }
  });
  