import React from 'react';
import { normalizeInterpreterTranscript } from '@/lib/interpreter-direction';
import type { InterpreterDirection } from '@/lib/interpreter-direction';

function interpreterControlIcon(
  kind: 'hand' | 'mic' | 'mute',
  translationLanguage: 'cantonese' | 'mandarin',
  direction: InterpreterDirection
) {
  if (direction === 'yue-to-ja') {
    return {
      hand: '/images/interpreter/hand-yue-to-ja.png?v=1',
      mic: '/images/interpreter/mic-yue-to-ja.png?v=1',
      mute: '/images/interpreter/mute-yue-to-ja.png?v=1',
    }[kind];
  }
  if (kind === 'hand') {
    return translationLanguage === 'cantonese'
      ? '/hand-button-1.svg?v=1'
      : '/hand-button-mandarin-1.svg?v=1';
  }
  if (kind === 'mic') {
    return translationLanguage === 'cantonese'
      ? '/volume-logo-1.svg?v=1'
      : '/volume-logo-mandarin-1.svg?v=1';
  }
  return translationLanguage === 'cantonese'
    ? '/mute-button-1.svg?v=1'
    : '/mute-button-mandarin-1.svg?v=1';
}

type HiddenModeLine = {
  text: string;
  timestamp: string;
  latency?: number;
};

type InterpreterTurn = {
  id: string;
  source: string;
  translation: string;
};

function pairInterpreterTurns(
  recognized: HiddenModeLine[],
  translated: HiddenModeLine[]
): InterpreterTurn[] {
  const count = Math.max(recognized.length, translated.length);
  const turns: InterpreterTurn[] = [];
  for (let i = 0; i < count; i += 1) {
    const source = recognized[i]?.text || '';
    const translation = translated[i]?.text || '';
    if (!source && !translation) continue;
    turns.push({
      id: `${recognized[i]?.timestamp || translated[i]?.timestamp || i}-${i}`,
      source,
      translation,
    });
  }
  return turns;
}

function BookmarkStar({
  bookmarked,
  onToggle,
}: {
  bookmarked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-label="ブックマーク"
      aria-pressed={bookmarked}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      onPointerDown={(event) => event.stopPropagation()}
      style={{
        flex: '0 0 auto',
        width: '1.6rem',
        height: '1.6rem',
        margin: 0,
        padding: 0,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        fontSize: '22px',
        lineHeight: 1,
        color: bookmarked ? '#f5c518' : '#c8c8c8',
      }}
    >
      {bookmarked ? '★' : '☆'}
    </button>
  );
}

type HiddenModeButton = 'hand' | 'mic' | 'mute' | null;

interface HiddenModeOverlayProps {
  isMobile: boolean;
  translationLanguage: 'cantonese' | 'mandarin';
  interpreterDirection: InterpreterDirection;
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
  interpreterUsageCount: number;
  interpreterUsageLimit: number;
  membershipType: string;
  bookmarkedPhrases: string[];
  onToggleInterpreterBookmark: (phrase: string, translation: string) => void;
}

const HiddenModeOverlay: React.FC<HiddenModeOverlayProps> = ({
  isMobile,
  translationLanguage,
  interpreterDirection,
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
  interpreterUsageCount,
  interpreterUsageLimit,
  membershipType,
  bookmarkedPhrases,
  onToggleInterpreterBookmark,
}) => {
  const translationAreaRef = React.useRef<HTMLDivElement | null>(null);
  const recognizedFrameRef = React.useRef<HTMLDivElement | null>(null);
  const micButtonRef = React.useRef<HTMLDivElement | null>(null);
  const titleRef = React.useRef<HTMLDivElement | null>(null);
  const pullStartYRef = React.useRef<number | null>(null);
  const pullYRef = React.useRef(0);
  const [pullY, setPullY] = React.useState(0);
  const [pulling, setPulling] = React.useState(false);
  const [stackExpanded, setStackExpanded] = React.useState(false);
  const micHelpRef = React.useRef<HTMLDivElement | null>(null);
  const handHelpRef = React.useRef<HTMLDivElement | null>(null);
  const muteHelpRef = React.useRef<HTMLDivElement | null>(null);

  const DESKTOP_BUTTON_DIAMETER = 120;
  const MOBILE_BUTTON_DIAMETER = 108;
  const buttonDiameter = isMobile ? MOBILE_BUTTON_DIAMETER : DESKTOP_BUTTON_DIAMETER;
  const buttonBottomOffsetRem = buttonDiameter / 16; // converts px -> rem (assuming 16px base)

  const baseMobileTopPx = 36 + 185 + 10; // 2.25rem + 185px + 0.625rem
  const baseMobileBottomPx =
    24 + Math.round(buttonDiameter * 0.75) * 2 + 18 + 48; // 1.5rem + (0.75 * diameter * 2) + 1.125rem + 3rem (使用回数表示分)

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
  }, [isMobile, showHelpPopups, showButtons, showTitle, translationLanguage, interpreterDirection]);

  const mobileTopOffset = isMobile ? mobileLayout.top ?? baseMobileTopPx : undefined;
  const mobileBottomOffset = isMobile ? mobileLayout.bottom ?? baseMobileBottomPx : undefined;
  const mobileContentHeight = isMobile ? mobileLayout.height : undefined;

  const turns = pairInterpreterTurns(recognizedTextLines, translatedTextLines);
  const historyTurns = turns.slice(1);
  const PULL_THRESHOLD = 72;

  const expandProgress = stackExpanded
    ? Math.max(0, Math.min(1, 1 + pullY / PULL_THRESHOLD))
    : Math.max(0, Math.min(1, pullY / PULL_THRESHOLD));

  const beginPull = (clientY: number) => {
    if (historyTurns.length === 0) return;
    pullStartYRef.current = clientY;
    setPulling(true);
  };

  const movePull = (clientY: number) => {
    if (pullStartYRef.current == null) return;
    const dy = clientY - pullStartYRef.current;
    const next = stackExpanded
      ? Math.max(-120, Math.min(0, dy))
      : Math.max(0, Math.min(120, dy));
    pullYRef.current = next;
    setPullY(next);
  };

  const finishPull = () => {
    if (historyTurns.length > 0) {
      if (!stackExpanded && pullYRef.current >= PULL_THRESHOLD) {
        setStackExpanded(true);
      } else if (stackExpanded && pullYRef.current <= -40) {
        setStackExpanded(false);
      }
    }
    pullYRef.current = 0;
    setPullY(0);
    pullStartYRef.current = null;
    setPulling(false);
  };

  const frameTuck = 16 * (1 - expandProgress);
  const olderPeek = 28 + expandProgress * 110;
  const olderGap = expandProgress * 10;
  const olderPile = (1 - expandProgress) * 16;

  const desktopButtonGroup = (
    <div
      style={{
        position: 'fixed',
        bottom: `calc(7.5rem + ${buttonDiameter}px)`,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: showButtons ? '4.5rem' : '0',
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
            src={interpreterControlIcon('hand', translationLanguage, interpreterDirection)}
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
          src={interpreterControlIcon('mic', translationLanguage, interpreterDirection)}
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
            src={interpreterControlIcon('mute', translationLanguage, interpreterDirection)}
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
  );

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
          borderRadius: '20px',
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
          key={`translation-content-${translationLanguage}-${interpreterDirection}`}
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
              {interpreterDirection === 'yue-to-ja'
                ? '日本語翻訳がここに表示されます...'
                : translationLanguage === 'cantonese'
                ? '広東語翻訳がここに表示されます...'
                : '中国語翻訳がここに表示されます...'}
            </div>
          )}
        </div>
      </div>

      <div
        ref={recognizedFrameRef}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          beginPull(event.clientY);
        }}
        onPointerMove={(event) => movePull(event.clientY)}
        onPointerUp={finishPull}
        onPointerCancel={finishPull}
        style={{
          position: 'fixed',
          top: isMobile
            ? `${mobileTopOffset ?? baseMobileTopPx}px`
            : '50%',
          left: '50%',
          transform: isMobile
            ? `translate(-50%, ${pullY * 0.35}px)`
            : `translate(-50%, calc(-50% + ${pullY * 0.35}px))`,
          width: isMobile ? 'calc(100vw - 2rem)' : '90%',
          maxWidth: isMobile ? 'calc(100vw - 2rem)' : '800px',
          zIndex: 1000,
          overflow: 'visible',
          boxSizing: 'border-box',
        }}
      >
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          padding: isMobile
            ? (historyTurns.length > 0 ? '0.85rem 1rem 0.45rem' : '1rem')
            : (historyTurns.length > 0 ? '1.5rem 1.75rem 0.7rem' : '1.75rem'),
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '20px',
          textAlign: 'center',
          fontSize: isMobile ? '1.35rem' : '2rem',
          lineHeight: '1.8',
          wordBreak: 'break-word',
          color: '#111827',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          overflowY: 'auto',
          overflowX: 'hidden',
          maxHeight: isMobile ? (historyTurns.length > 0 ? '150px' : '260px') : '400px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'stretch',
          boxSizing: 'border-box',
        }}
      >
        <div
          key={`japanese-content-${translationLanguage}-${interpreterDirection}`}
          style={{
            display: 'flex',
            flexDirection: 'column',
              gap: '0.6rem',
            width: '100%',
              paddingBottom: historyTurns.length > 0 ? '0.2rem' : '0.75rem',
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
                      marginBottom: historyTurns.length > 0 ? 0 : '0.5rem',
                      backgroundColor: 'rgba(59, 130, 246, 0.05)',
                      borderRadius: '8px',
                      borderLeft: '3px solid rgba(59, 130, 246, 0.3)',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.35rem' }}>
                      <BookmarkStar
                        bookmarked={bookmarkedPhrases.includes(
                          interpreterDirection === 'yue-to-ja'
                            ? latestLine.text.trim()
                            : (translatedTextLines[0]?.text || latestLine.text).trim()
                        )}
                        onToggle={() => onToggleInterpreterBookmark(latestLine.text.trim(), translatedTextLines[0]?.text || '')}
                      />
                      <div>{normalizeInterpreterTranscript(latestLine.text, interpreterDirection)}</div>
                    </div>
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
                  {normalizeInterpreterTranscript(interimText, interpreterDirection)}
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
                {normalizeInterpreterTranscript(recognizedText, interpreterDirection) ||
                  (interpreterDirection === 'yue-to-ja'
                    ? 'マイクボタンを「長押し」しながら広東語を話してください...'
                    : 'マイクボタンを「長押し」しながら日本語を話してください...')}
              </div>
              {interimText && (
                <span style={{ color: '#6b7280', fontStyle: 'italic', width: '100%', textAlign: 'left' }}>
                  {normalizeInterpreterTranscript(interimText, interpreterDirection)}
                </span>
              )}
            </>
          )}
        </div>
        {historyTurns.length > 0 && pullY > 8 && !stackExpanded && (
          <div style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '0.35rem' }}>
            {expandProgress >= 1 ? '離すと履歴が開く' : '下に引いて履歴を開く'}
          </div>
        )}
      </div>

      {historyTurns.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: `-${frameTuck}px`,
            maxHeight: isMobile ? '34vh' : '40vh',
            overflowY: stackExpanded ? 'auto' : 'hidden',
            overflowX: 'hidden',
            transition: pulling
              ? 'none'
              : 'margin-top 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            pointerEvents: 'auto',
          }}
        >
          {historyTurns.map((turn, index) => {
            const spoken = turn.source.trim();
            const translated = turn.translation.trim();
            const storedPhrase = interpreterDirection === 'yue-to-ja' ? spoken || translated : translated || spoken;
            const isLatestHistory = index === 0;
            return (
              <div
                key={turn.id}
                style={{
                  marginTop: isLatestHistory ? 0 : olderGap - (index > 1 ? olderPile : 0),
                  height: stackExpanded || isLatestHistory ? 'auto' : `${olderPeek}px`,
                  overflow: 'hidden',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: isLatestHistory || stackExpanded ? 'flex-start' : 'flex-end',
                  zIndex: historyTurns.length - index,
                  transition: pulling
                    ? 'none'
                    : 'height 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), margin-top 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    padding: isMobile ? '0.7rem 0.85rem' : '0.85rem 1rem',
                    backgroundColor: '#ffffff',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    borderRadius: '20px',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.35rem' }}>
                    <BookmarkStar
                      bookmarked={bookmarkedPhrases.includes(storedPhrase)}
                      onToggle={() => onToggleInterpreterBookmark(spoken, translated)}
                    />
                    <div style={{ minWidth: 0, textAlign: 'left' }}>
                      {spoken && (
                        <div style={{ color: '#111827', fontSize: isMobile ? '0.95rem' : '1.05rem', lineHeight: 1.5 }}>
                          {normalizeInterpreterTranscript(spoken, interpreterDirection)}
                        </div>
                      )}
                      {translated && (
                        <div style={{ color: '#6b7280', fontSize: isMobile ? '0.85rem' : '0.95rem', lineHeight: 1.45, marginTop: '0.15rem' }}>
                          {translated}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
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
          zIndex: 1012,
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
            // タイトルは下。ボタンを上げて重ねない（ca26eab）。タイトルを上げるな。
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
            {interpreterDirection === 'yue-to-ja'
              ? '日本語通訳'
              : translationLanguage === 'cantonese'
                ? 'カントン語通訳'
                : '中国語通訳'}
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
              marginBottom: '0.5rem',
            }}
          >
            ボタンを押すだけでスパッと通訳！
          </div>
          {/* 使用回数表示 */}
          <div
            style={{
              fontSize: isMobile ? '0.8rem' : '0.9rem',
              fontWeight: 600,
              color: membershipType === 'free' && interpreterUsageCount >= interpreterUsageLimit
                ? '#ef4444'
                : '#6b7280',
              textShadow: 'none',
              marginTop: '0.25rem',
              whiteSpace: 'nowrap',
            }}
          >
            {membershipType === 'free' ? (
              `ブロンズ会員：通訳可能回数：${interpreterUsageCount} / ${interpreterUsageLimit}回`
            ) : (
              <>
                シルバー会員/ゴールド会員通訳回数：<strong>無制限</strong>
              </>
            )}
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
          // タイトルより上。+3rem は重なり解消の確定値。下げるとタイトルと重なる。
          bottom: isMobile
            ? `calc(env(safe-area-inset-bottom) + ${buttonBottomOffsetRem + 3}rem)`
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
              src={interpreterControlIcon('hand', translationLanguage, interpreterDirection)}
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
            src={interpreterControlIcon('mic', translationLanguage, interpreterDirection)}
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
              src={interpreterControlIcon('mute', translationLanguage, interpreterDirection)}
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
        desktopButtonGroup
      )}
    </>
  );
};

export default HiddenModeOverlay;


