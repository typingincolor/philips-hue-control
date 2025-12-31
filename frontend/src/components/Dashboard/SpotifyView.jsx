import { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { UI_TEXT } from '../../constants/uiText';
import { useDragScroll } from '../../hooks/useDragScroll';
import { Spinner, MusicIcon, PlayIcon, PauseIcon, SkipBackIcon, SkipForwardIcon, ShuffleIcon, SpeakerIcon, SmartphoneIcon, ChevronLeft, ChevronRight } from './Icons';

/**
 * SpotifyView - Main Spotify tab view with playlist selection, transport controls, and speaker list
 */
export const SpotifyView = ({
  // Connection state
  isConnected = false,
  isConfigured = true,
  isLoading = false,
  error = null,
  user = null,

  // Spotify data
  devices = [],
  playlists = [],
  playback = null,

  // Selection state
  selectedPlaylist = null,
  selectedDevices = new Set(),

  // Selection actions
  onSelectPlaylist,
  onToggleDevice,

  // Playback actions
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onSetVolume,
  onToggleShuffle,

  // Connection actions
  onConnect,
  onClearError,
}) => {
  const isPlaying = playback?.isPlaying || false;
  const shuffleState = playback?.shuffleState || false;
  const track = playback?.track || null;
  const hasSelectedDevices = selectedDevices.size > 0;

  // Playlist carousel scroll state
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Speakers carousel scroll state
  const [canScrollSpeakersLeft, setCanScrollSpeakersLeft] = useState(false);
  const [canScrollSpeakersRight, setCanScrollSpeakersRight] = useState(false);

  // Tooltip state for instant hover feedback
  const [tooltip, setTooltip] = useState(null);

  // Carousel drag scroll refs
  const carouselRef = useDragScroll();
  const speakersRef = useDragScroll();

  // Update scroll button states
  const updateScrollButtons = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;

    // Can scroll left if not at the beginning
    setCanScrollLeft(scrollLeft > 5);
    // Can scroll right if not at the end
    setCanScrollRight(maxScroll > 0 && scrollLeft < maxScroll - 5);
  }, [carouselRef]);

  // Listen for scroll events
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    // Run immediately
    updateScrollButtons();

    // Also run after a short delay to catch any layout shifts
    const timeoutId = setTimeout(updateScrollButtons, 50);

    el.addEventListener('scroll', updateScrollButtons);
    // Also update on resize
    const resizeObserver = new ResizeObserver(updateScrollButtons);
    resizeObserver.observe(el);
    return () => {
      clearTimeout(timeoutId);
      el.removeEventListener('scroll', updateScrollButtons);
      resizeObserver.disconnect();
    };
  }, [carouselRef, updateScrollButtons, playlists]);

  // Scroll handlers for playlist carousel
  const scrollLeft = () => {
    const el = carouselRef.current;
    if (el) el.scrollBy({ left: -200, behavior: 'smooth' });
  };

  const scrollRight = () => {
    const el = carouselRef.current;
    if (el) el.scrollBy({ left: 200, behavior: 'smooth' });
  };

  // Update speakers scroll button states
  const updateSpeakersScroll = useCallback(() => {
    const el = speakersRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;

    setCanScrollSpeakersLeft(scrollLeft > 5);
    setCanScrollSpeakersRight(maxScroll > 0 && scrollLeft < maxScroll - 5);
  }, []);

  // Listen for speakers scroll events
  useEffect(() => {
    const el = speakersRef.current;
    if (!el) return;

    updateSpeakersScroll();
    const timeoutId = setTimeout(updateSpeakersScroll, 50);

    el.addEventListener('scroll', updateSpeakersScroll);
    const resizeObserver = new ResizeObserver(updateSpeakersScroll);
    resizeObserver.observe(el);
    return () => {
      clearTimeout(timeoutId);
      el.removeEventListener('scroll', updateSpeakersScroll);
      resizeObserver.disconnect();
    };
  }, [updateSpeakersScroll, devices]);

  // Scroll handlers for speakers carousel (scroll by column width)
  const scrollSpeakersLeft = () => {
    const el = speakersRef.current;
    if (!el) return;
    // Get the first card to measure actual column width
    const card = el.querySelector('.spotify-speaker-card');
    const gap = 8; // Default gap
    const columnWidth = card ? card.offsetWidth + gap : 208;
    el.scrollBy({ left: -columnWidth, behavior: 'smooth' });
  };

  const scrollSpeakersRight = () => {
    const el = speakersRef.current;
    if (!el) return;
    // Get the first card to measure actual column width
    const card = el.querySelector('.spotify-speaker-card');
    const gap = 8; // Default gap
    const columnWidth = card ? card.offsetWidth + gap : 208;
    el.scrollBy({ left: columnWidth, behavior: 'smooth' });
  };

  // Get device icon based on type
  const getDeviceIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'smartphone':
        return <SmartphoneIcon size={20} />;
      default:
        return <SpeakerIcon size={20} />;
    }
  };

  // Show login when not connected
  if (!isConnected) {
    return (
      <div className="spotify-view">
        <div className="spotify-login">
          <MusicIcon size={48} className="spotify-logo" />
          <h2 className="spotify-login-title">{UI_TEXT.SPOTIFY.LOGIN_TITLE}</h2>
          <p className="spotify-login-description">{UI_TEXT.SPOTIFY.LOGIN_DESCRIPTION}</p>

          {error && (
            <div className="spotify-error" role="alert" aria-live="polite">
              {error}
            </div>
          )}

          {!isConfigured ? (
            <p className="spotify-not-configured">{UI_TEXT.SPOTIFY.NOT_CONFIGURED}</p>
          ) : (
            <button
              className="spotify-connect-btn"
              onClick={onConnect}
              aria-label={UI_TEXT.SPOTIFY.CONNECT}
            >
              {UI_TEXT.SPOTIFY.CONNECT}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading && !playback && devices.length === 0) {
    return (
      <div className="spotify-view">
        <div className="spotify-loading">
          <Spinner size={24} />
          <span>{UI_TEXT.SPOTIFY.LOADING}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="spotify-view">
      {/* Error banner */}
      {error && (
        <div className="spotify-error-banner" role="alert" aria-live="polite">
          <span>{error}</span>
          <button onClick={onClearError} aria-label="Dismiss error">
            &times;
          </button>
        </div>
      )}

      {/* Top section: Playlist + Now Playing side by side */}
      <div className="spotify-top-section">
        {/* Left: Playlist carousel + controls */}
        <div className="spotify-left-panel">
          <div className="spotify-carousel-container">
            <button
              className={`spotify-carousel-btn spotify-carousel-btn-left ${!canScrollLeft ? 'disabled' : ''}`}
              onClick={scrollLeft}
              disabled={!canScrollLeft}
              aria-label="Scroll left"
            >
              <ChevronLeft size={24} />
            </button>

            <div className="spotify-playlist-carousel" ref={carouselRef}>
              {playlists.length === 0 ? (
                <p className="spotify-no-playlists">{UI_TEXT.SPOTIFY.NO_PLAYLISTS}</p>
              ) : (
                playlists.map((playlist) => {
                  const isSelected = selectedPlaylist?.id === playlist.id;
                  return (
                    <button
                      key={playlist.id}
                      className={`spotify-playlist-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => onSelectPlaylist(isSelected ? null : playlist)}
                      aria-pressed={isSelected}
                      aria-label={`${playlist.name}, ${playlist.trackCount} tracks`}
                      onPointerEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltip({ text: playlist.name, x: rect.left + rect.width / 2, y: rect.top - 4 });
                      }}
                      onPointerLeave={() => setTooltip(null)}
                    >
                      <div className="spotify-playlist-image">
                        {playlist.imageUrl ? (
                          <img src={playlist.imageUrl} alt="" />
                        ) : (
                          <MusicIcon size={32} />
                        )}
                      </div>
                      <span className="spotify-playlist-name">{playlist.name}</span>
                    </button>
                  );
                })
              )}
            </div>

            <button
              className={`spotify-carousel-btn spotify-carousel-btn-right ${!canScrollRight ? 'disabled' : ''}`}
              onClick={scrollRight}
              disabled={!canScrollRight}
              aria-label="Scroll right"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Transport controls */}
          <div className="spotify-transport">
            <button
              className="spotify-transport-btn"
              onClick={onPrevious}
              aria-label={UI_TEXT.SPOTIFY.PREVIOUS}
              disabled={!isPlaying}
            >
              <SkipBackIcon size={24} />
            </button>

            <button
              className="spotify-transport-btn spotify-play-btn"
              onClick={isPlaying ? onPause : onPlay}
              aria-label={isPlaying ? UI_TEXT.SPOTIFY.PAUSE : UI_TEXT.SPOTIFY.PLAY}
              disabled={!hasSelectedDevices && !isPlaying}
            >
              {isPlaying ? <PauseIcon size={32} /> : <PlayIcon size={32} />}
            </button>

            <button
              className="spotify-transport-btn"
              onClick={onNext}
              aria-label={UI_TEXT.SPOTIFY.NEXT}
              disabled={!isPlaying}
            >
              <SkipForwardIcon size={24} />
            </button>

            <button
              className={`spotify-transport-btn spotify-shuffle-btn ${shuffleState ? 'active' : ''}`}
              onClick={onToggleShuffle}
              aria-label={UI_TEXT.SPOTIFY.SHUFFLE}
              aria-pressed={shuffleState}
            >
              <ShuffleIcon size={24} />
            </button>
          </div>
        </div>

        {/* Right: Now playing */}
        <div className="spotify-right-panel">
          <h3 className="spotify-section-title">{UI_TEXT.SPOTIFY.NOW_PLAYING}</h3>
          <div className="spotify-now-playing">
            {track ? (
              <>
                {track.albumArt && (
                  <img
                    src={track.albumArt}
                    alt={`${track.album} album art`}
                    className="spotify-album-art"
                  />
                )}
                <div className="spotify-track-info">
                  <span className="spotify-track-name">{track.name}</span>
                  <span className="spotify-track-artist">{track.artist}</span>
                </div>
              </>
            ) : (
              <div className="spotify-no-track">
                <MusicIcon size={24} />
                <span>{UI_TEXT.SPOTIFY.NO_TRACK}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Speakers section */}
      <div className="spotify-speakers">
        <h3 className="spotify-speakers-title">{UI_TEXT.SPOTIFY.SPEAKERS}</h3>

        {devices.length === 0 ? (
          <p className="spotify-no-speakers">{UI_TEXT.SPOTIFY.NO_SPEAKERS}</p>
        ) : (
          <div className="spotify-speakers-carousel-container">
            <button
              className={`spotify-speakers-carousel-btn ${!canScrollSpeakersLeft ? 'disabled' : ''}`}
              onClick={scrollSpeakersLeft}
              disabled={!canScrollSpeakersLeft}
              aria-label="Scroll speakers left"
            >
              <ChevronLeft size={24} />
            </button>

            <div className="spotify-speaker-list" ref={speakersRef}>
              {devices.map((device) => {
                const isSelected = selectedDevices.has(device.id);
                return (
                  <button
                    key={device.id}
                    className={`spotify-speaker-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => onToggleDevice(device.id)}
                    aria-pressed={isSelected}
                    aria-label={`${device.name}, ${isSelected ? 'on' : 'off'}`}
                  >
                    <div className="spotify-speaker-info">
                      {getDeviceIcon(device.type)}
                      <span className="spotify-speaker-name">{device.name}</span>
                    </div>

                    <input
                      type="range"
                      className="spotify-volume-slider"
                      min="0"
                      max="100"
                      value={device.volume_percent || 0}
                      onChange={(e) => {
                        e.stopPropagation();
                        onSetVolume(parseInt(e.target.value, 10), device.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Volume for ${device.name}`}
                    />
                  </button>
                );
              })}
            </div>

            <button
              className={`spotify-speakers-carousel-btn ${!canScrollSpeakersRight ? 'disabled' : ''}`}
              onClick={scrollSpeakersRight}
              disabled={!canScrollSpeakersRight}
              aria-label="Scroll speakers right"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        )}
      </div>

      {/* User info */}
      {user && (
        <div className="spotify-user-info">
          <span>{UI_TEXT.SPOTIFY.LOGGED_IN_AS} {user.displayName}</span>
        </div>
      )}

      {/* Fixed tooltip - rendered at root level to escape overflow containers */}
      {tooltip && (
        <div
          className="spotify-playlist-tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
};

SpotifyView.propTypes = {
  // Connection state
  isConnected: PropTypes.bool,
  isConfigured: PropTypes.bool,
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  user: PropTypes.shape({
    id: PropTypes.string,
    displayName: PropTypes.string,
  }),

  // Spotify data
  devices: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      type: PropTypes.string,
      volume_percent: PropTypes.number,
      is_active: PropTypes.bool,
    })
  ),
  playlists: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      uri: PropTypes.string.isRequired,
      trackCount: PropTypes.number,
    })
  ),
  playback: PropTypes.shape({
    isPlaying: PropTypes.bool,
    shuffleState: PropTypes.bool,
    track: PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      artist: PropTypes.string,
      album: PropTypes.string,
      albumArt: PropTypes.string,
    }),
  }),

  // Selection state
  selectedPlaylist: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    uri: PropTypes.string.isRequired,
  }),
  selectedDevices: PropTypes.instanceOf(Set),

  // Selection actions
  onSelectPlaylist: PropTypes.func,
  onToggleDevice: PropTypes.func,

  // Playback actions
  onPlay: PropTypes.func,
  onPause: PropTypes.func,
  onNext: PropTypes.func,
  onPrevious: PropTypes.func,
  onSetVolume: PropTypes.func,
  onToggleShuffle: PropTypes.func,

  // Connection actions
  onConnect: PropTypes.func,
  onClearError: PropTypes.func,
};
