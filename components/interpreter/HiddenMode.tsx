import { RefObject } from 'react';

type Language = 'cantonese' | 'mandarin';

type TextLine = {
  text: string;
  timestamp: string;
  latency?: number;
};

interface HiddenModeProps {
  isMobile: boolean;
  translatedTextLines: TextLine[];
  translatedText: string;
  translationPlaceholder: string;
  recognizedText: string;
  recognizedTextLines: TextLine[];
  interimText: string;
  isRecording: boolean;
  onExit: () => void;
  onMicPress: () => void;
  onMicRelease: () => void;
  interpreterLanguage: Language;
  onLanguageChange: (language: Language) => void;
  showTitle: boolean;
  interpreterTitle: string;
  titleAudioRef: RefObject<HTMLAudioElement | null>;
  volumeLogoRef: RefObject<HTMLImageElement | null>;
}

export function HiddenMode({
  isMobile,
  translatedTextLines,
  translatedText,
  translationPlaceholder,
  recognizedTextLines,
  recognizedText,
  interimText,
  isRecording,
  onExit,
  onMicPress,
  onMicRelease,
  interpreterLanguage,
  onLanguageChange,
  showTitle,
  interpreterTitle,
  titleAudioRef,
  volumeLogoRef
}: HiddenModeProps) {
  return (
    <>
      {/* 翻訳エリア（上部、左に180度回転、浮き上がるアニメーション、新しいテキストが上に表示） */}
      <div
        style={{
          position: 'fixed',
          top: isMobile ? '2rem' : '4rem',
          left: '50%',
          transform: 'translateX(-50%) rotate(-180deg)',
          width: '90%',
          maxWidth: '800px',
          maxHeight: isMobile ? '250px' : '300px',
          padding: '1.5rem',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '12px',
          animation: 'fadeInUp 0.6s ease-out',
          opacity: 1,
          zIndex: 1000,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            width: '100%'
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
                    borderLeft: '3px solid rgba(59, 130, 246, 0.3)'
                  }}
                >
                  <div>{latestLine.text}</div>
                  <div
                    style={{
                      fontSize: isMobile ? '0.875rem' : '1rem',
                      color: '#6b7280',
                      marginTop: '0.5rem',
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '0.75rem',
                      transform: 'rotate(180deg)',
                      fontWeight: '500'
                    }}
                  >
                    <span>{latestLine.timestamp}</span>
                    {latestLine.latency !== undefined && (
                      <span>レイテンシー: {latestLine.latency}ms</span>
                    )}
                  </div>
                </div>
              );
            })()
          ) : translatedText ? (
            <div style={{ color: '#111827' }}>{translatedText}</div>
          ) : (
            <div style={{ color: '#111827' }}>{translationPlaceholder}</div>
          )}
        </div>
      </div>

      {/* 日本語音声認識エリア */}
      <div
        style={{
          position: 'fixed',
          top: isMobile ? 'calc(2rem + 250px + 0.5rem)' : '50%',
          bottom: isMobile ? 'calc(3rem + 120px + 96px + 2rem)' : 'auto',
          left: '50%',
          transform: isMobile ? 'translate(-50%, 0)' : 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '800px',
          maxHeight: isMobile ? 'none' : '400px',
          padding: '2rem',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '12px',
          textAlign: 'center',
          fontSize: isMobile ? '1.5rem' : '2rem',
          lineHeight: '1.8',
          wordBreak: 'break-word',
          animation: 'fadeInUp 0.8s ease-out',
          opacity: 1,
          zIndex: 1000,
          color: '#111827',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            width: '100%',
            paddingBottom: '1rem'
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
                      fontSize: isMobile ? '1.5rem' : '2rem',
                      lineHeight: '1.8',
                      wordBreak: 'break-word',
                      padding: '0.75rem 1rem',
                      marginBottom: '0.5rem',
                      backgroundColor: 'rgba(59, 130, 246, 0.05)',
                      borderRadius: '8px',
                      borderLeft: '3px solid rgba(59, 130, 246, 0.3)',
                      textAlign: 'left'
                    }}
                  >
                    <div>{latestLine.text}</div>
                    <div
                      style={{
                        fontSize: isMobile ? '0.75rem' : '0.875rem',
                        color: '#6b7280',
                        marginTop: '0.25rem'
                      }}
                    >
                      {latestLine.timestamp}
                    </div>
                  </div>
                );
              })()}
              {interimText && (
                <div
                  style={{
                    color: '#6b7280',
                    fontStyle: 'italic',
                    fontSize: isMobile ? '1.5rem' : '2rem',
                    padding: '0.75rem 1rem',
                    marginBottom: '0.5rem',
                    backgroundColor: 'rgba(107, 114, 128, 0.05)',
                    borderRadius: '8px',
                    borderLeft: '3px solid rgba(107, 114, 128, 0.2)',
                    textAlign: 'left'
                  }}
                >
                  {interimText}
                </div>
              )}
            </>
          ) : (
            <>
              {recognizedText || 'マイクボタンを押して日本語を話してください...'}
              {interimText && (
                <span style={{ color: '#6b7280', fontStyle: 'italic' }}>
                  {interimText}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* 終了ボタン */}
      <button
        onClick={onExit}
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
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}
      >
        ESCで終了
      </button>

      {/* 言語切り替え */}
      <div
        style={{
          position: 'fixed',
          bottom: isMobile ? 'calc(3rem + 120px + 120px)' : 'calc(5rem + 140px + 140px)',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: isMobile ? '0.5rem' : '0.75rem',
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          border: '1px solid rgba(17, 24, 39, 0.08)',
          borderRadius: '999px',
          padding: isMobile ? '0.35rem 0.5rem' : '0.4rem 0.75rem',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.08)',
          zIndex: 1002,
          pointerEvents: 'auto'
        }}
      >
        <button
          onClick={() => onLanguageChange('cantonese')}
          style={{
            padding: isMobile ? '0.45rem 1.15rem' : '0.5rem 1.25rem',
            borderRadius: '999px',
            border: interpreterLanguage === 'cantonese' ? 'none' : '1px solid rgba(17, 24, 39, 0.15)',
            background: interpreterLanguage === 'cantonese'
              ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
              : 'rgba(255, 255, 255, 0.95)',
            color: interpreterLanguage === 'cantonese' ? '#ffffff' : '#111827',
            fontWeight: 700,
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            cursor: 'pointer',
            boxShadow: interpreterLanguage === 'cantonese'
              ? '0 4px 10px rgba(37, 99, 235, 0.35)'
              : 'none',
            transition: 'all 0.2s ease',
            touchAction: 'manipulation',
            minWidth: isMobile ? '6.5rem' : '6.75rem'
          }}
        >
          カントン語
        </button>
        <button
          onClick={() => onLanguageChange('mandarin')}
          style={{
            padding: isMobile ? '0.45rem 1.15rem' : '0.5rem 1.25rem',
            borderRadius: '999px',
            border: interpreterLanguage === 'mandarin' ? 'none' : '1px solid rgba(17, 24, 39, 0.15)',
            background: interpreterLanguage === 'mandarin'
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : 'rgba(255, 255, 255, 0.95)',
            color: interpreterLanguage === 'mandarin' ? '#ffffff' : '#111827',
            fontWeight: 700,
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            cursor: 'pointer',
            boxShadow: interpreterLanguage === 'mandarin'
              ? '0 4px 10px rgba(5, 150, 105, 0.35)'
              : 'none',
            transition: 'all 0.2s ease',
            touchAction: 'manipulation',
            minWidth: isMobile ? '6.5rem' : '6.75rem'
          }}
        >
          中国語
        </button>
      </div>

      {/* タイトル表示 */}
      {showTitle && (
        <div
          style={{
            position: 'fixed',
            bottom: isMobile ? '3rem' : '5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            animation: 'tileFlip 0.6s ease-out',
            zIndex: 1003
          }}
        >
          <div
            style={{
              fontSize: isMobile ? '1.5rem' : '2rem',
              fontWeight: 800,
              color: '#111827',
              marginBottom: '0.5rem',
              textShadow: 'none'
            }}
          >
            {interpreterTitle}
          </div>
          <div
            style={{
              fontSize: isMobile ? '0.875rem' : '1rem',
              fontWeight: 700,
              color: '#6b7280',
              textShadow: 'none',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            ボタンを押すだけでスパッと通訳！
          </div>
        </div>
      )}

      {/* タイトル音声 */}
      <audio ref={titleAudioRef} src="/interpreter-start.mp3" preload="auto" style={{ display: 'none' }} />

      {/* マイクボタン */}
      <div
        style={{
          position: 'fixed',
          bottom: isMobile ? 'calc(3rem + 120px)' : 'calc(5rem + 140px)',
          left: '50%',
          transform: 'translateX(-50%)',
          width: isMobile ? '96px' : '120px',
          height: isMobile ? '96px' : '120px',
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
          zIndex: 1002,
          pointerEvents: 'auto',
          animation: 'fadeInUp 1s ease-out',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none'
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onMicPress();
        }}
        onMouseUp={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onMicRelease();
        }}
        onMouseLeave={(e) => {
          if (isRecording) {
            e.preventDefault();
            e.stopPropagation();
            onMicRelease();
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }}
        onDragStart={(e) => {
          e.preventDefault();
          return false;
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onMicPress();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onMicRelease();
        }}
        onTouchCancel={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onMicRelease();
        }}
      >
        <img
          ref={volumeLogoRef}
          src="/volume-logo.png?v=1"
          alt="microphone"
          draggable="false"
          style={{
            width: isMobile ? '96px' : '120px',
            height: isMobile ? '96px' : '120px',
            objectFit: 'contain',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none'
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          onDragStart={(e) => {
            e.preventDefault();
            return false;
          }}
        />
      </div>
    </>
  );
}

