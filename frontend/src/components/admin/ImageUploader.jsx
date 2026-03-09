import { useState, useRef } from 'react';
import { FiCamera, FiUpload, FiX, FiImage, FiLoader } from 'react-icons/fi';
import uploadService from '../../services/uploadService';
import toast from 'react-hot-toast';
import './ImageUploader.css';

const ImageUploader = ({ value, onChange, onUrlChange }) => {
  const [uploading, setUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Handle file selection from computer
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    await uploadImage(file);
  };

  // Handle camera capture on mobile
  const handleCameraCapture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    await uploadImage(file);
  };

  // Upload image to server
  const uploadImage = async (file) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const response = await uploadService.uploadImage(file);
      if (response.success) {
        onChange(response.data.url);
        if (onUrlChange) onUrlChange(response.data.url);
        toast.success('Image uploaded successfully');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  // Start webcam for desktop camera
  const startWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      setStream(mediaStream);
      setShowCamera(true);
      
      // Wait for video element to be ready
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Could not access camera. Please check permissions.');
    }
  };

  // Capture photo from webcam
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      stopWebcam();
      await uploadImage(file);
    }, 'image/jpeg', 0.9);
  };

  // Stop webcam
  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  // Remove current image
  const removeImage = () => {
    onChange('');
    if (onUrlChange) onUrlChange('');
  };

  // Check if device is mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  return (
    <div className="image-uploader">
      {/* Preview Area */}
      {value ? (
        <div className="image-preview-container">
          <img src={value} alt="Product" className="preview-image" />
          <button type="button" className="remove-image-btn" onClick={removeImage}>
            <FiX />
          </button>
        </div>
      ) : (
        <div className="upload-placeholder">
          <FiImage className="placeholder-icon" />
          <p>No image selected</p>
        </div>
      )}

      {/* Upload Buttons */}
      <div className="upload-buttons">
        {/* File Upload */}
        <button
          type="button"
          className="upload-btn file-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <FiLoader className="spin" /> : <FiUpload />}
          <span>Upload File</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {/* Camera Button */}
        {isMobile ? (
          // Mobile: Use native camera input
          <>
            <button
              type="button"
              className="upload-btn camera-btn"
              onClick={() => cameraInputRef.current?.click()}
              disabled={uploading}
            >
              <FiCamera />
              <span>Take Photo</span>
            </button>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCameraCapture}
              style={{ display: 'none' }}
            />
          </>
        ) : (
          // Desktop: Use webcam
          <button
            type="button"
            className="upload-btn camera-btn"
            onClick={startWebcam}
            disabled={uploading}
          >
            <FiCamera />
            <span>Use Camera</span>
          </button>
        )}
      </div>

      {/* URL Input */}
      <div className="url-input-section">
        <span className="divider-text">or enter URL</span>
        <input
          type="url"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (onUrlChange) onUrlChange(e.target.value);
          }}
          className="form-input url-input"
          placeholder="https://example.com/image.jpg"
        />
      </div>

      {/* Webcam Modal */}
      {showCamera && (
        <div className="camera-modal-overlay">
          <div className="camera-modal">
            <div className="camera-header">
              <h3>Take Photo</h3>
              <button type="button" className="close-camera-btn" onClick={stopWebcam}>
                <FiX />
              </button>
            </div>
            <div className="camera-body">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="camera-video"
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
            <div className="camera-actions">
              <button type="button" className="btn btn-secondary" onClick={stopWebcam}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary capture-btn" onClick={capturePhoto}>
                <FiCamera /> Capture
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
