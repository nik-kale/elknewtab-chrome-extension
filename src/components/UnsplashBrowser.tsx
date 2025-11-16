import React, { useState, useEffect } from 'react';
import { searchImages, fetchRandomImages, UnsplashImage, downloadImageAsBase64, triggerDownload } from '../utils/unsplashAPI';
import LoadingSpinner from './LoadingSpinner';
import { toast } from '../utils/notifications';
import './UnsplashBrowser.css';

interface UnsplashBrowserProps {
  onSelectImage: (imageUrl: string) => void;
  onClose: () => void;
  apiKey?: string;
}

const UnsplashBrowser: React.FC<UnsplashBrowserProps> = ({
  onSelectImage,
  onClose,
  apiKey
}) => {
  const [images, setImages] = useState<UnsplashImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<UnsplashImage | null>(null);

  useEffect(() => {
    loadRandomImages();
  }, []);

  const loadRandomImages = async () => {
    setLoading(true);
    try {
      const results = await fetchRandomImages(12, 'nature,landscape', apiKey);
      setImages(results);
    } catch (error) {
      toast.error('Failed to load images from Unsplash');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      loadRandomImages();
      return;
    }

    setLoading(true);
    try {
      const results = await searchImages(searchQuery, 1, 12, apiKey);
      setImages(results);

      if (results.length === 0) {
        toast.info('No images found for your search');
      }
    } catch (error) {
      toast.error('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectImage = async (image: UnsplashImage) => {
    setSelectedImage(image);
    setLoading(true);

    try {
      // Download image as base64
      const base64 = await downloadImageAsBase64(image.url);

      // Trigger download tracking (Unsplash API requirement)
      await triggerDownload(image.downloadLocation, apiKey);

      // Pass to parent
      onSelectImage(base64);

      toast.success(`Background set! Photo by ${image.author}`);
      onClose();
    } catch (error) {
      toast.error('Failed to download image');
      setSelectedImage(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="unsplash-browser-overlay" onClick={onClose}>
      <div className="unsplash-browser" onClick={(e) => e.stopPropagation()}>
        <div className="unsplash-browser-header">
          <h2>Browse Unsplash Backgrounds</h2>
          <button className="unsplash-close" onClick={onClose}>×</button>
        </div>

        <form className="unsplash-search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search for backgrounds..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="unsplash-search-input"
          />
          <button type="submit" className="unsplash-search-button">
            Search
          </button>
        </form>

        <div className="unsplash-content">
          {loading ? (
            <LoadingSpinner size="large" message="Loading images..." />
          ) : (
            <div className="unsplash-grid">
              {images.map((image) => (
                <div
                  key={image.id}
                  className={`unsplash-image-card ${selectedImage?.id === image.id ? 'selected' : ''}`}
                  onClick={() => handleSelectImage(image)}
                >
                  <img src={image.thumbnail} alt={image.description || 'Unsplash image'} />
                  <div className="unsplash-image-overlay">
                    <p className="unsplash-author">
                      Photo by <a href={image.authorUrl} target="_blank" rel="noopener noreferrer">
                        {image.author}
                      </a>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="unsplash-footer">
          <p>
            Powered by <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">Unsplash</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnsplashBrowser;
