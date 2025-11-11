import React from 'react';

type HiddenModeLine = {
  text: string;
  timestamp: string;
  latency?: number;
};

type HiddenModeButton = 'hand' | 'mic' | 'mute' | null;

interface HiddenModeOverlayProps {
  isMobile: boolean;
  translationLanguage: 'cantonese' | 'mandarin';
  translatedTextLines: HiddenModeLine[];
  translatedText: string | null;
  recognizedTextLines: HiddenModeLine[];
  recognizedText: string;
  interimText: string | null;
  showTitle: boolean;
  handleTitleClick: () => void;
  handleTranslationAreaClick: () => void;
  isTranslationAreaRotated: boolean;
  isTranslationAreaRotating: boolean;
  translationAreaRotationDirectionRef: React.MutableRefObject<'forward' | 'reverse'>;
  exitHiddenMode: () => void;
  titleAudioRef: React.MutableRefObject<HTMLAudioElement | null>;
  simultaneousModeAudioRef: React.MutableRefObject<HTMLAudioElement | null>;
  volumeLogoRef: React.MutableRefObject<HTMLImageElement | null>;
  isRecording: boolean;
  handleMicPress: () => void;
  handleMicRelease: () => void;
  hoveredButton: HiddenModeButton;
  setHoveredButton: React.Dispatch<React.SetStateAction<HiddenModeButton>>;
  showHelpPopups: boolean;
  isButtonRotating: boolean;
  handleHandButtonClick: () => void;
  handleMuteButtonClick: () => void;
  showButtons: boolean;
  buttonsAnimated: boolean;
  isMuted: boolean;
}

const HiddenModeOverlay: React.FC<HiddenModeOverlayProps> = ({
  isMobile,
  translationLanguage,
  translatedTextLines,
  translatedText,
  recognizedTextLines,
  recognizedText,
  interimText,
  showTitle,
  handleTitleClick,
  handleTranslationAreaClick,
  isTranslationAreaRotated,
  isTranslationAreaRotating,
  translationAreaRotationDirectionRef,
  exitHiddenMode,
  titleAudioRef,
  simultaneousModeAudioRef,
  volumeLogoRef,
  isRecording,
  handleMicPress,
  handleMicRelease,
  hoveredButton,
  setHoveredButton,
  showHelpPopups,
  isButtonRotating,
  handleHandButtonClick,
  handleMuteButtonClick,
  showButtons,
  buttonsAnimated,
  isMuted,
}) => {
  const translationAreaRef = React.useRef<HTMLDivElement | null>(null);
  const micButtonRef = React.useRef<HTMLDivElement | null>(null);
  const titleRef = React.useRef<HTMLDivElement | null>(null);
  const micHelpRef = React.useRef<HTMLDivElement | null>(null);
  const handHelpRef = React.useRef<HTMLDivElement | null>(null);
  const muteHelpRef = React.useRef<HTMLDivElement | null>(null);

  const DESKTOP_BUTTON_DIAMETER = 120;
  const MOBILE_BUTTON_DIAMETER = 108;
  const buttonDiameter = isMobile ? MOBILE_BUTTON_DIAMETER : DESKTOP_BUTTON_DIAMETER;
  const buttonBottomOffsetRem = buttonDiameter / 16; // converts px -> rem (assuming 16px base)

  const baseMobileTopPx = 36 + 185 + 10; // 2.25rem + 185px + 0.625rem
  const baseMobileBottomPx =
    24 + Math.round(buttonDiameter * 0.75) * 2 + 18; // 1.5rem + (0.75 * diameter * 2) + 1.125rem

  const [mobileLayout, setMobileLayout] = React.useState<{
    top: number;
    bottom: number;
    height: number;
  }>({
    top: baseMobileTopPx,
    bottom: baseMobileBottomPx,
    height: Math.max(200, 780 - baseMobileTopPx - baseMobileBottomPx),
  });

  React.useEffect(() => {
    if (!isMobile || typeof window === 'undefined') {
      return;
    }

    const computeOffsets = () => {
      const viewportHeight =
        window.visualViewport?.height ?? window.innerHeight ?? 0;

      const translationRect = translationAreaRef.current?.getBoundingClientRect();
      const translationBottom = translationRect ? translationRect.bottom : baseMobileTopPx;
      const minTopSpacing = translationBottom + 12;

      const candidateTops: number[] = [];

      if (micButtonRef.current) {
        candidateTops.push(micButtonRef.current.getBoundingClientRect().top);
      }
      if (titleRef.current) {
        candidateTops.push(titleRef.current.getBoundingClientRect().top);
      }
      if (showHelpPopups && micHelpRef.current) {
        candidateTops.push(micHelpRef.current.getBoundingClientRect().top);
      }
      if (showHelpPopups && handHelpRef.current) {
        candidateTops.push(handHelpRef.current.getBoundingClientRect().top);
      }
      if (showHelpPopups && muteHelpRef.current) {
        candidateTops.push(muteHelpRef.current.getBoundingClientRect().top);
      }

      const boundaryTop =
        candidateTops.length > 0
          ? Math.min(...candidateTops.filter((value) => Number.isFinite(value)))
          : viewportHeight - baseMobileBottomPx;

      const gap = 20;

      let topSpacing = Math.max(
        minTopSpacing,
        Math.min(baseMobileTopPx, viewportHeight - gap - buttonDiameter)
      );

      let bottomSpacing = Math.max(
        gap,
        viewportHeight - boundaryTop + gap
      );

      const minContentHeight = 140;
      let availableHeight = viewportHeight - topSpacing - bottomSpacing;

      if (availableHeight < minContentHeight) {
        const shortage = minContentHeight - availableHeight;

        const reducibleBottom = Math.max(0, bottomSpacing - gap);
        const bottomReduction = Math.min(reducibleBottom, shortage);
        bottomSpacing -= bottomReduction;
        availableHeight += bottomReduction;

        if (availableHeight < minContentHeight) {
          const reducibleTop = Math.max(0, topSpacing - minTopSpacing);
          const topReduction = Math.min(reducibleTop, minContentHeight - availableHeight);
          topSpacing -= topReduction;
          availableHeight += topReduction;
        }
      }

      topSpacing = Math.max(minTopSpacing, Math.min(topSpacing, viewportHeight - gap - 60));
      bottomSpacing = Math.max(gap, Math.min(bottomSpacing, viewportHeight - topSpacing - 60));

      const contentHeight = Math.max(
        0,
        viewportHeight - topSpacing - bottomSpacing
      );

      setMobileLayout({
        top: Math.round(topSpacing),
        bottom: Math.round(bottomSpacing),
        height: Math.round(contentHeight),
      });
    };

    const handleResize = () => {
      computeOffsets();
    };

    computeOffsets();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    const visualViewport = window.visualViewport;
    if (visualViewport) {
      visualViewport.addEventListener('resize', handleResize);
    }

    const observers: ResizeObserver[] = [];
    if (typeof ResizeObserver !== 'undefined') {
      if (translationAreaRef.current) {
        const observer = new ResizeObserver(handleResize);
        observer.observe(translationAreaRef.current);
        observers.push(observer);
      }
      if (micButtonRef.current) {
        const observer = new ResizeObserver(handleResize);
        observer.observe(micButtonRef.current);
        observers.push(observer);
      }
      if (titleRef.current) {
        const observer = new ResizeObserver(handleResize);
        observer.observe(titleRef.current);
        observers.push(observer);
      }
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (visualViewport) {
        visualViewport.removeEventListener('resize', handleResize);
      }
      observers.forEach((observer) => observer.disconnect());
    };
  }, [isMobile, showHelpPopups, showButtons, showTitle, translationLanguage]);

  const mobileTopOffset = isMobile ? mobileLayout.top ?? baseMobileTopPx : undefined;
  const mobileBottomOffset = isMobile ? mobileLayout.bottom ?? baseMobileBottomPx : undefined;
  const mobileContentHeight = isMobile ? mobileLayout.height : undefined;

  return (
    <>
      <div
        onClick={handleTranslationAreaClick}
        ref={translationAreaRef}
        style={{
          position: 'fixed',
          top: isMobile ? 'calc(env(safe-area-inset-top) + 2.25rem)' : '3.5rem',
          left: '50%',
          transform: isTranslationAreaRotated
            ? 'translateX(-50%) rotate(-180deg)'
            : 'translateX(-50%) rotate(0deg)',
          width: '90%',
          maxWidth: '800px',
          maxHeight: isMobile ? '185px' : '300px',
          padding: isMobile ? '1rem' : '1.5rem',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '12px',
          animation: isTranslationAreaRotating
            ? translationAreaRotationDirectionRef.current === 'forward'
              ? 'translationAreaRotate 0.6s ease-in-out'
              : 'translationAreaRotateReverse 0.6s ease-in-out'
            : 'none',
          opacity: 1,
          zIndex: 1000,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          cursor: 'pointer',
          transition: isTranslationAreaRotating ? 'none' : 'transform 0.3s ease-in-out',
        }}
      >
        <div
          key={`translation-content-${translationLanguage}`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            width: '100%',
            animation: !isTranslationAreaRotating ? 'interpreterZoomIn 0.45s ease-out' : 'none',
            transformOrigin: 'center',
          }}
        >
          {translatedTextLines.length > 0 ? (
            (() => {
              const latestLine = translatedTextLines[0];
              return (
                <div
                  key={`translated-0-${latestLine.text.substring(0, 10)}`}
                  style={{
                    color: '#111827',
                    fontSize: isMobile ? '1.25rem' : '1.5rem',
                    lineHeight: '1.8',
                    wordBreak: 'break-word',
                    textAlign: 'center',
                    padding: '0.75rem 1rem',
                    marginBottom: '0.5rem',
                    backgroundColor: 'rgba(59, 130, 246, 0.05)',
                    borderRadius: '8px',
                    borderLeft: '3px solid rgba(59, 130, 246, 0.3)',
                  }}
                >
                  <div>{latestLine.text}</div>
                </div>
              );
            })()
          ) : translatedText ? (
            <div style={{ color: '#111827' }}>{translatedText}</div>
          ) : (
            <div style={{ color: '#111827' }}>
              {translationLanguage === 'cantonese'
                ? '広東語翻訳がここに表示されます...'
                : '中国語翻訳がここに表示されます...'}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          position: 'fixed',
          top: isMobile
            ? `${mobileTopOffset ?? baseMobileTopPx}px`
            : '50%',
          left: '50%',
          transform: isMobile ? 'translate(-50%, 0)' : 'translate(-50%, -50%)',
          width: isMobile ? 'calc(100vw - 2rem)' : '90%',
          maxWidth: isMobile ? 'calc(100vw - 2rem)' : '800px',
          minHeight: isMobile ? undefined : 'auto',
          maxHeight: isMobile ? '260px' : '400px',
          height: isMobile ? 'auto' : (mobileContentHeight !== undefined ? `${mobileContentHeight}px` : 'auto'),
          padding: isMobile ? '1rem' : '1.75rem',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '12px',
          textAlign: 'center',
          fontSize: isMobile ? '1.35rem' : '2rem',
          lineHeight: '1.8',
          wordBreak: 'break-word',
          opacity: 1,
          zIndex: 1000,
          color: '#111827',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'stretch',
          boxSizing: 'border-box',
        }}
      >
        <div
          key={`japanese-content-${translationLanguage}`}
          style={{
            display: 'flex',
            flexDirection: 'column',
              gap: '0.6rem',
            width: '100%',
              paddingBottom: '0.75rem',
              justifyContent: 'flex-start',
            alignItems: 'center',
            minHeight: '100%',
            animation: 'interpreterZoomIn 0.5s ease-out',
            transformOrigin: 'center',
              fontSize: isMobile ? '1.15rem' : '1.6rem',
          }}
        >
          {recognizedTextLines.length > 0 ? (
            <>
              {(() => {
                const latestLine = recognizedTextLines[0];
                return (
                  <div
                    key={`line-0-${latestLine.text.substring(0, 10)}`}
                    style={{
                      color: '#111827',
                      fontSize: isMobile ? '1.35rem' : '2rem',
                      lineHeight: '1.8',
                      wordBreak: 'break-word',
                      padding: '0.75rem 1rem',
                      marginBottom: '0.5rem',
                      backgroundColor: 'rgba(59, 130, 246, 0.05)',
                      borderRadius: '8px',
                      borderLeft: '3px solid rgba(59, 130, 246, 0.3)',
                      textAlign: 'left',
                    }}
                  >
                    <div>{latestLine.text}</div>
                  </div>
                );
              })()}
              {interimText && (
                <div
                  style={{
                    color: '#6b7280',
                    fontStyle: 'italic',
                    fontSize: isMobile ? '1.35rem' : '2rem',
                    padding: '0.75rem 1rem',
                    marginBottom: '0.5rem',
                    backgroundColor: 'rgba(107, 114, 128, 0.05)',
                    borderRadius: '8px',
                    borderLeft: '3px solid rgba(107, 114, 128, 0.2)',
                    textAlign: 'left',
                  }}
                >
                  {interimText}
                </div>
              )}
            </>
          ) : (
            <>
              <div
                style={{
                  color: '#111827',
                  textAlign: 'left',
                  width: '100%',
                  lineHeight: '1.6',
                }}
              >
                {recognizedText || 'マイクボタンを「長押し」しながら日本語を話してください...'}
              </div>
              {interimText && (
                <span style={{ color: '#6b7280', fontStyle: 'italic', width: '100%', textAlign: 'left' }}>
                  {interimText}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      <button
        onClick={exitHiddenMode}
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          padding: '0.5rem 1rem',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '8px',
          color: '#111827',
          cursor: 'pointer',
          fontSize: '0.875rem',
          animation: 'fadeInUp 0.4s ease-out',
          opacity: 1,
          zIndex: 1001,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        }}
      >
        ESCで終了
      </button>

      {showTitle && (
        <div
          onClick={handleTitleClick}
          ref={titleRef}
          style={{
            position: 'fixed',
            bottom: isMobile ? 'calc(env(safe-area-inset-bottom) + 1.8rem)' : '3.75rem',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            animation: 'tileFlip 0.6s ease-out',
            zIndex: 1003,
            cursor: 'pointer',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none',
          }}
        >
          <div
            style={{
              fontSize: isMobile ? '1.5rem' : '2rem',
              fontWeight: 800,
              color: '#111827',
              marginBottom: '0.5rem',
              textShadow: 'none',
            }}
          >
            {translationLanguage === 'cantonese' ? 'カントン語通訳' : '中国語通訳'}
          </div>
          <div
            style={{
              fontSize: isMobile ? '0.875rem' : '1rem',
              fontWeight: 700,
              color: '#6b7280',
              textShadow: 'none',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            ボタンを押すだけでスパッと通訳！
          </div>
        </div>
      )}

      <audio ref={titleAudioRef} src="/interpreter-start.mp3" preload="auto" style={{ display: 'none' }} />
      <audio ref={simultaneousModeAudioRef} style={{ display: 'none' }} />

      {isMobile ? (
      <div
        ref={micButtonRef}
        style={{
          position: 'fixed',
          bottom: isMobile
            ? `calc(env(safe-area-inset-bottom) + ${buttonBottomOffsetRem}rem)`
            : '6rem',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isMobile ? '0.75rem' : '1rem',
          zIndex: 1002,
          pointerEvents: 'none',
          width: 'calc(100vw - 2rem)',
          maxWidth: isMobile ? '360px' : '460px',
        }}
      >
        {showButtons && (
          <div
            onClick={handleHandButtonClick}
            onMouseEnter={() => setHoveredButton('hand')}
            onMouseLeave={() => setHoveredButton(null)}
            style={{
              position: 'relative',
              width: `${buttonDiameter}px`,
              height: `${buttonDiameter}px`,
              borderRadius: '50%',
              backgroundColor: 'rgba(192, 216, 255, 0.3)',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'transform 0.3s ease, opacity 0.3s ease',
              transform: buttonsAnimated ? 'scale(1)' : 'scale(0.6)',
              opacity: buttonsAnimated ? 1 : 0,
              pointerEvents: buttonsAnimated ? 'auto' : 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none',
              overflow: 'visible',
              marginTop: isMobile ? '0rem' : '0',
            }}
            onContextMenu={(event) => {
              event.preventDefault();
              event.stopPropagation();
              return false;
            }}
            onDragStart={(event) => {
              event.preventDefault();
              return false;
            }}
          >
            <img
              src={
                translationLanguage === 'cantonese'
                  ? '/hand-button-1.svg?v=1'
                  : '/hand-button-mandarin-1.svg?v=1'
              }
              alt="hand button"
              draggable="false"
              style={{
                width: `${buttonDiameter}px`,
                height: `${buttonDiameter}px`,
                objectFit: 'contain',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
                transition: 'transform 0.3s ease',
                animation: isButtonRotating ? 'buttonRotate 0.6s ease-in-out' : 'none',
                transform: isButtonRotating ? 'rotateY(360deg)' : 'none',
                borderRadius: '50%',
              }}
            />
            {((isMobile && showHelpPopups) || (!isMobile && hoveredButton === 'hand')) && buttonsAnimated && (
              <div
                ref={handHelpRef}
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  marginBottom: '12px',
                  padding: '8px 12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  color: '#111827',
                  whiteSpace: 'nowrap',
                  zIndex: 1003,
                  pointerEvents: 'none',
                  animation:
                    'cloudPopUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), helpPopUpBounce 0.5s ease-in-out 0.3s infinite',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  fontWeight: 500,
                }}
              >
                翻訳機使わせて
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-8px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '8px solid transparent',
                    borderRight: '8px solid transparent',
                    borderTop: '8px solid rgba(255, 255, 255, 0.95)',
                  }}
                />
              </div>
            )}
          </div>
        )}

        <div
          onMouseEnter={() => setHoveredButton('mic')}
          onMouseLeave={(event) => {
            setHoveredButton(null);
            if (isRecording) {
              event.preventDefault();
              event.stopPropagation();
              console.log('ロゴからマウス離脱 - 音声認識停止');
              handleMicRelease();
            }
          }}
          style={{
            position: 'relative',
            width: `${buttonDiameter}px`,
            height: `${buttonDiameter}px`,
            borderRadius: '50%',
            backgroundColor: isRecording ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)',
            boxShadow: isRecording
              ? '0 0 20px rgba(239, 68, 68, 0.5)'
              : '0 4px 6px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            animation: 'fadeInUp 1s ease-out',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none',
            overflow: 'visible',
            pointerEvents: 'auto',
            marginTop: 0,
          }}
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            console.log('ロゴ長押し開始 - 音声認識開始');
            handleMicPress();
          }}
          onMouseUp={(event) => {
            event.preventDefault();
            event.stopPropagation();
            console.log('ロゴ離す - 音声認識停止');
            handleMicRelease();
          }}
          onContextMenu={(event) => {
            event.preventDefault();
            event.stopPropagation();
            return false;
          }}
          onDragStart={(event) => {
            event.preventDefault();
            return false;
          }}
          onTouchStart={(event) => {
            event.preventDefault();
            event.stopPropagation();
            console.log('ロゴ長押し開始（タッチ） - 音声認識開始');
            handleMicPress();
          }}
          onTouchEnd={(event) => {
            event.preventDefault();
            event.stopPropagation();
            console.log('ロゴ離す（タッチ） - 音声認識停止');
            handleMicRelease();
          }}
          onTouchCancel={(event) => {
            event.preventDefault();
            event.stopPropagation();
            console.log('ロゴタッチキャンセル - 音声認識停止');
            handleMicRelease();
          }}
        >
          <img
            ref={volumeLogoRef}
            src={
              translationLanguage === 'cantonese'
                ? '/volume-logo-1.svg?v=1'
                : '/volume-logo-mandarin-1.svg?v=1'
            }
            alt="microphone"
            draggable="false"
            style={{
              width: `${buttonDiameter}px`,
              height: `${buttonDiameter}px`,
              objectFit: 'contain',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none',
              animation: isButtonRotating ? 'buttonRotate 0.6s ease-in-out' : 'none',
              transform: isButtonRotating ? 'rotateY(360deg)' : 'none',
              borderRadius: '50%',
            }}
            onContextMenu={(event) => {
              event.preventDefault();
              event.stopPropagation();
              return false;
            }}
            onDragStart={(event) => {
              event.preventDefault();
              return false;
            }}
          />
          {((isMobile && showHelpPopups) || (!isMobile && hoveredButton === 'mic')) && (
            <div
              ref={micHelpRef}
              style={{
                position: 'absolute',
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginBottom: '12px',
                padding: '8px 12px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                color: '#111827',
                whiteSpace: 'nowrap',
                zIndex: 1003,
                pointerEvents: 'none',
                animation:
                  'cloudPopUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), helpPopUpBounce 0.5s ease-in-out 0.3s infinite',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                fontWeight: 500,
              }}
            >
              長押しで通訳
              <div
                style={{
                  position: 'absolute',
                  bottom: '-8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderTop: '8px solid rgba(255, 255, 255, 0.95)',
                }}
              />
            </div>
          )}
        </div>

        {showButtons && (
          <div
            onClick={handleMuteButtonClick}
            onMouseEnter={() => setHoveredButton('mute')}
            onMouseLeave={() => setHoveredButton(null)}
            style={{
              position: 'relative',
            width: `${buttonDiameter}px`,
            height: `${buttonDiameter}px`,
              borderRadius: '50%',
              backgroundColor: isMuted ? 'rgba(239, 68, 68, 0.3)' : 'rgba(192, 216, 255, 0.3)',
              boxShadow: isMuted ? '0 0 20px rgba(239, 68, 68, 0.5)' : '0 4px 6px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'transform 0.3s ease, opacity 0.3s ease',
              transform: buttonsAnimated ? 'scale(1)' : 'scale(0.6)',
              opacity: buttonsAnimated ? 1 : 0,
              pointerEvents: buttonsAnimated ? 'auto' : 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none',
              overflow: 'visible',
              marginTop: isMobile ? '0rem' : '0',
            }}
            onContextMenu={(event) => {
              event.preventDefault();
              event.stopPropagation();
              return false;
            }}
            onDragStart={(event) => {
              event.preventDefault();
              return false;
            }}
          >
            <img
              src={
                translationLanguage === 'cantonese'
                  ? '/mute-button-1.svg?v=1'
                  : '/mute-button-mandarin-1.svg?v=1'
              }
              alt="mute button"
              draggable="false"
              style={{
            width: `${buttonDiameter}px`,
            height: `${buttonDiameter}px`,
                objectFit: 'contain',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
                transition: 'transform 0.3s ease',
                animation: isButtonRotating ? 'buttonRotate 0.6s ease-in-out' : 'none',
                transform: isButtonRotating ? 'rotateY(360deg)' : 'none',
                borderRadius: '50%',
              }}
            />
            {((isMobile && showHelpPopups) || (!isMobile && hoveredButton === 'mute')) && buttonsAnimated && (
              <div
                ref={muteHelpRef}
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  marginBottom: '12px',
                  padding: '8px 12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  color: '#111827',
                  whiteSpace: 'nowrap',
                  zIndex: 1003,
                  pointerEvents: 'none',
                  animation:
                    'cloudPopUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), helpPopUpBounce 0.5s ease-in-out 0.3s infinite',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  fontWeight: 500,
                }}
              >
                音声ミュート
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-8px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '8px solid transparent',
                    borderRight: '8px solid transparent',
                    borderTop: '8px solid rgba(255, 255, 255, 0.95)',
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
      ) : (
        <div
          style={{
            position: 'fixed',
            bottom: `calc(5rem + ${buttonDiameter}px)`,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: showButtons ? 'calc(60px + 0.75rem)' : '0',
            zIndex: 1002,
            pointerEvents: 'none',
          }}
        >
          {showButtons && (
            <div
              onClick={handleHandButtonClick}
              onMouseEnter={() => setHoveredButton('hand')}
              onMouseLeave={() => setHoveredButton(null)}
              style={{
                width: buttonsAnimated ? `${buttonDiameter}px` : '0px',
                height: buttonsAnimated ? `${buttonDiameter}px` : '0px',
                borderRadius: '50%',
                backgroundColor: 'rgba(192, 216, 255, 0.3)',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                pointerEvents: 'auto',
                opacity: buttonsAnimated ? 1 : 0,
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
                overflow: 'visible',
              }}
              onContextMenu={(event) => {
                event.preventDefault();
                event.stopPropagation();
                return false;
              }}
              onDragStart={(event) => {
                event.preventDefault();
                return false;
              }}
            >
              <img
                src={
                  translationLanguage === 'cantonese'
                    ? '/hand-button-1.svg?v=1'
                    : '/hand-button-mandarin-1.svg?v=1'
                }
                alt="hand button"
                draggable="false"
                style={{
                  width: buttonsAnimated ? `${buttonDiameter}px` : '0px',
                  height: buttonsAnimated ? `${buttonDiameter}px` : '0px',
                  objectFit: 'contain',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  WebkitTouchCallout: 'none',
                  transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  animation: isButtonRotating ? 'buttonRotate 0.6s ease-in-out' : 'none',
                  transform: isButtonRotating ? 'rotateY(360deg)' : 'none',
                  borderRadius: buttonsAnimated ? '50%' : '0%',
                }}
              />
              {hoveredButton === 'hand' && buttonsAnimated && (
                <div
                  ref={handHelpRef}
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginBottom: '12px',
                    padding: '8px 12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '16px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    fontSize: '0.875rem',
                    color: '#111827',
                    whiteSpace: 'nowrap',
                    zIndex: 1003,
                    pointerEvents: 'none',
                    animation:
                      'cloudPopUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), helpPopUpBounce 0.5s ease-in-out 0.3s infinite',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    fontWeight: 500,
                  }}
                >
                  翻訳機使わせて
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-8px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 0,
                      height: 0,
                      borderLeft: '8px solid transparent',
                      borderRight: '8px solid transparent',
                      borderTop: '8px solid rgba(255, 255, 255, 0.95)',
                    }}
                  />
                </div>
              )}
            </div>
          )}

          <div
            onMouseEnter={() => setHoveredButton('mic')}
            onMouseLeave={(event) => {
              setHoveredButton(null);
              if (isRecording) {
                event.preventDefault();
                event.stopPropagation();
                console.log('ロゴからマウス離脱 - 音声認識停止');
                handleMicRelease();
              }
            }}
            ref={micButtonRef}
            style={{
              width: `${buttonDiameter}px`,
              height: `${buttonDiameter}px`,
              borderRadius: '50%',
              backgroundColor: isRecording ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)',
              boxShadow: isRecording
                ? '0 0 20px rgba(239, 68, 68, 0.5)'
                : '0 4px 6px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.5s ease-out',
              pointerEvents: 'auto',
              animation: 'fadeInUp 1s ease-out',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none',
              overflow: 'visible',
            }}
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              console.log('ロゴ長押し開始 - 音声認識開始');
              handleMicPress();
            }}
            onMouseUp={(event) => {
              event.preventDefault();
              event.stopPropagation();
              console.log('ロゴ離す - 音声認識停止');
              handleMicRelease();
            }}
            onContextMenu={(event) => {
              event.preventDefault();
              event.stopPropagation();
              return false;
            }}
            onDragStart={(event) => {
              event.preventDefault();
              return false;
            }}
          >
            <img
              ref={volumeLogoRef}
              src={
                translationLanguage === 'cantonese'
                  ? '/volume-logo-1.svg?v=1'
                  : '/volume-logo-mandarin-1.svg?v=1'
              }
              alt="microphone"
              draggable="false"
              style={{
              width: `${buttonDiameter}px`,
              height: `${buttonDiameter}px`,
                objectFit: 'contain',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
                animation: isButtonRotating ? 'buttonRotate 0.6s ease-in-out' : 'none',
                transform: isButtonRotating ? 'rotateY(360deg)' : 'none',
                borderRadius: '50%',
              }}
              onContextMenu={(event) => {
                event.preventDefault();
                event.stopPropagation();
                return false;
              }}
              onDragStart={(event) => {
                event.preventDefault();
                return false;
              }}
            />
            {hoveredButton === 'mic' && (
              <div
                ref={micHelpRef}
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  marginBottom: '12px',
                  padding: '8px 12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  fontSize: '0.875rem',
                  color: '#111827',
                  whiteSpace: 'nowrap',
                  zIndex: 1003,
                  pointerEvents: 'none',
                  animation:
                    'cloudPopUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), helpPopUpBounce 0.5s ease-in-out 0.3s infinite',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  fontWeight: 500,
                }}
              >
                長押しで通訳
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-8px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '8px solid transparent',
                    borderRight: '8px solid transparent',
                    borderTop: '8px solid rgba(255, 255, 255, 0.95)',
                  }}
                />
              </div>
            )}
          </div>

          {showButtons && (
            <div
              onClick={handleMuteButtonClick}
              onMouseEnter={() => setHoveredButton('mute')}
              onMouseLeave={() => setHoveredButton(null)}
              style={{
                width: buttonsAnimated ? `${buttonDiameter}px` : '0px',
                height: buttonsAnimated ? `${buttonDiameter}px` : '0px',
                borderRadius: '50%',
                backgroundColor: isMuted ? 'rgba(239, 68, 68, 0.3)' : 'rgba(192, 216, 255, 0.3)',
                boxShadow: isMuted ? '0 0 20px rgba(239, 68, 68, 0.5)' : '0 4px 6px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                pointerEvents: 'auto',
                opacity: buttonsAnimated ? 1 : 0,
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
                overflow: 'visible',
              }}
              onContextMenu={(event) => {
                event.preventDefault();
                event.stopPropagation();
                return false;
              }}
              onDragStart={(event) => {
                event.preventDefault();
                return false;
              }}
            >
              <img
                src={
                  translationLanguage === 'cantonese'
                    ? '/mute-button-1.svg?v=1'
                    : '/mute-button-mandarin-1.svg?v=1'
                }
                alt="mute button"
                draggable="false"
                style={{
                  width: buttonsAnimated ? `${buttonDiameter}px` : '0px',
                  height: buttonsAnimated ? `${buttonDiameter}px` : '0px',
                  objectFit: 'contain',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  WebkitTouchCallout: 'none',
                  transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  animation: isButtonRotating ? 'buttonRotate 0.6s ease-in-out' : 'none',
                  transform: isButtonRotating ? 'rotateY(360deg)' : 'none',
                  borderRadius: buttonsAnimated ? '50%' : '0%',
                }}
              />
              {hoveredButton === 'mute' && buttonsAnimated && (
                <div
                  ref={muteHelpRef}
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginBottom: '12px',
                    padding: '8px 12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '16px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    fontSize: '0.875rem',
                    color: '#111827',
                    whiteSpace: 'nowrap',
                    zIndex: 1003,
                    pointerEvents: 'none',
                    animation:
                      'cloudPopUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), helpPopUpBounce 0.5s ease-in-out 0.3s infinite',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    fontWeight: 500,
                  }}
                >
                  音声ミュート
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-8px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 0,
                      height: 0,
                      borderLeft: '8px solid transparent',
                      borderRight: '8px solid transparent',
                      borderTop: '8px solid rgba(255, 255, 255, 0.95)',
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )
    </>
  );
};

export default HiddenModeOverlay;


