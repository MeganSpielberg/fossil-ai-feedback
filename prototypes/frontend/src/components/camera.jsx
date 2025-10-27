import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';

const CameraPage = () => {
  const webcamRef = useRef(null);
  const [imageSrc, setImageSrc] = useState(null);

  const capture = () => {
    const image = webcamRef.current.getScreenshot();
    setImageSrc(image);
  };

  return (
    <div>
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width={350}
        height={250}
      />
      <button onClick={capture}>Take Picture</button>
      {imageSrc && (
        <div>
          <h3>Captured Image:</h3>
          <img src={imageSrc} alt="Captured" />
        </div>
      )}
    </div>
  );
};

export default CameraPage;