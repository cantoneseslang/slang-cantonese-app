import React from 'react';

type MembershipType = 'free' | 'subscription' | 'lifetime';
type CurrencyCode = 'jpy' | 'hkd';
type DisplayCurrency = 'JPY' | 'HKD';
type InterpreterVoiceOption = 'female' | 'male';

interface CategorySummary {
  id: string;
  name: string;
}

interface SettingsPortalProps {
  isMobile: boolean;
  showSettings: boolean;
  user: any;
  onCloseSettings: () => void;
  onLogout: () => void;
  membershipType: MembershipType;
  handleMembershipChange: (type: MembershipType) => void;
  getMembershipIcon: (type: MembershipType) => string;
  getMembershipLabel: (type: MembershipType) => string;
  isClickSoundEnabled: boolean;
  toggleClickSound: () => void;
  isLearningMode: boolean;
  toggleLearningMode: () => void;
  categories: CategorySummary[];
  defaultCategoryId: string;
  isSavingDefaultCategory: boolean;
  openCategoryPicker: () => void;
  interpreterCantoneseVoice: InterpreterVoiceOption;
  interpreterMandarinVoice: InterpreterVoiceOption;
  onInterpreterVoiceChange: (language: 'cantonese' | 'mandarin', voice: InterpreterVoiceOption) => void;
  isSavingCantoneseVoice: boolean;
  isSavingMandarinVoice: boolean;

  isEditingUsername: boolean;
  usernameError: string | null;
  newUsername: string;
  onEditUsernameStart: () => void;
  onUsernameChange: (value: string) => void;
  onUsernameCancel: () => void;
  onUsernameSave: () => void;

  showPasswordChange: boolean;
  onTogglePasswordForm: () => void;
  passwordError: string | null;
  passwordSuccess: boolean;
  newPassword: string;
  confirmPassword: string;
  onPasswordInputChange: (field: 'new' | 'confirm', value: string) => void;
  showNewPassword: boolean;
  toggleNewPasswordVisibility: () => void;
  showConfirmPassword: boolean;
  toggleConfirmPasswordVisibility: () => void;
  onPasswordSubmit: () => void;
  onPasswordCancel: () => void;

  loadingDebugInfo: boolean;
  debugInfo: any;

  showPricingModal: boolean;
  selectedPlan: MembershipType | null;
  onClosePricingModal: () => void;
  isDowngrade: boolean;
  handleStripeCheckout: (plan: MembershipType) => void;
  pricingModalScrollRef: React.RefObject<HTMLDivElement | null>;
  showPricingModalTopArrow: boolean;
  showPricingModalBottomArrow: boolean;
  setShowPricingModalTopArrow: React.Dispatch<React.SetStateAction<boolean>>;
  setShowPricingModalBottomArrow: React.Dispatch<React.SetStateAction<boolean>>;
  selectedCurrency: CurrencyCode;
  onCurrencyChange: (currency: DisplayCurrency) => void;
}

const PLAN_PRICE_MAP: Record<Exclude<MembershipType, 'free'>, Record<CurrencyCode, string>> = {
  subscription: {
    jpy: '¥980',
    hkd: 'HKD$50',
  },
  lifetime: {
    jpy: '¥9,800',
    hkd: 'HKD$498',
  },
};

const SettingsPortal: React.FC<SettingsPortalProps> = ({
  isMobile,
  showSettings,
  user,
  onCloseSettings,
  onLogout,
  membershipType,
  handleMembershipChange,
  getMembershipIcon,
  getMembershipLabel,
  isClickSoundEnabled,
  toggleClickSound,
  isLearningMode,
  toggleLearningMode,
  categories,
  defaultCategoryId,
  isSavingDefaultCategory,
  openCategoryPicker,
  interpreterCantoneseVoice,
  interpreterMandarinVoice,
  onInterpreterVoiceChange,
  isSavingCantoneseVoice,
  isSavingMandarinVoice,
  isEditingUsername,
  usernameError,
  newUsername,
  onEditUsernameStart,
  onUsernameChange,
  onUsernameCancel,
  onUsernameSave,
  showPasswordChange,
  onTogglePasswordForm,
  passwordError,
  passwordSuccess,
  newPassword,
  confirmPassword,
  onPasswordInputChange,
  showNewPassword,
  toggleNewPasswordVisibility,
  showConfirmPassword,
  toggleConfirmPasswordVisibility,
  onPasswordSubmit,
  onPasswordCancel,
  loadingDebugInfo,
  debugInfo,
  showPricingModal,
  selectedPlan,
  onClosePricingModal,
  isDowngrade,
  handleStripeCheckout,
  pricingModalScrollRef,
  showPricingModalTopArrow,
  showPricingModalBottomArrow,
  setShowPricingModalTopArrow,
  setShowPricingModalBottomArrow,
  selectedCurrency,
  onCurrencyChange,
}) => {
  const renderMembershipButton = (type: MembershipType) => (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleMembershipChange(type);
      }}
      onTouchStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleMembershipChange(type);
      }}
      style={{
        flex: 1,
        padding: isMobile ? '1.25rem 0.75rem' : '1.25rem 0.75rem',
        borderRadius: '16px',
        border: 'none',
        background: membershipType === type
          ? type === 'free'
            ? 'linear-gradient(145deg, #d4a574 0%, #cd7f32 50%, #a85f1f 100%)'
            : type === 'subscription'
            ? 'linear-gradient(145deg, #e8e8e8 0%, #c0c0c0 50%, #a8a8a8 100%)'
            : 'linear-gradient(145deg, #ffe066 0%, #ffd700 50%, #ffb700 100%)'
          : 'linear-gradient(145deg, #f3f4f6 0%, #e5e7eb 100%)',
        cursor: membershipType === type ? 'default' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem',
        transition: 'all 0.3s',
        boxShadow: membershipType === type
          ? type === 'free'
            ? '0 8px 20px rgba(205,127,50,0.4), inset 0 1px 0 rgba(255,255,255,0.3)'
            : type === 'subscription'
            ? '0 8px 20px rgba(192,192,192,0.4), inset 0 1px 0 rgba(255,255,255,0.4)'
            : '0 8px 20px rgba(255,215,0,0.5), inset 0 1px 0 rgba(255,255,255,0.4)'
          : '0 2px 8px rgba(0,0,0,0.1)',
        transform: membershipType === type ? 'scale(1.05)' : 'scale(1)',
        position: type === 'lifetime' ? 'relative' : 'static',
        overflow: type === 'lifetime' ? 'hidden' : 'visible',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
      onMouseEnter={(e) => {
        if (membershipType !== type) {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
        }
      }}
      onMouseLeave={(e) => {
        if (membershipType !== type) {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        }
      }}
    >
      <span style={{ fontSize: '2rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
        {getMembershipIcon(type)}
      </span>
      <span style={{
        fontSize: '0.875rem',
        fontWeight: '700',
        color: membershipType === type ? (type === 'free' ? '#ffffff' : '#1f2937') : '#6b7280',
        textShadow: membershipType === type
          ? type === 'free'
            ? '0 1px 2px rgba(0,0,0,0.3)'
            : '0 1px 2px rgba(255,255,255,0.5)'
          : 'none'
      }}>
        {getMembershipLabel(type)}
      </span>
      {type !== 'free' && membershipType !== type && (
        <span style={{
          fontSize: '0.8rem',
          color: '#6b7280',
          fontWeight: '700'
        }}>
          {type === 'subscription' ? '¥980/月' : '¥9,800'}
        </span>
      )}
    </button>
  );

  const renderCurrencyToggle = () => {
    if (!selectedPlan || selectedPlan === 'free') return null;

    const buttons: DisplayCurrency[] = ['JPY', 'HKD'];

    return (
      <div style={{
        display: 'inline-flex',
        gap: '0.5rem',
        marginBottom: '1rem',
        padding: '0.25rem',
        background: 'rgba(255,255,255,0.5)',
        borderRadius: '9999px',
      }}>
        {buttons.map((currency) => {
          const isActive = selectedCurrency === currency.toLowerCase();
          return (
            <button
              key={currency}
              onClick={() => onCurrencyChange(currency)}
              style={{
                minWidth: '80px',
                padding: '0.5rem 0.75rem',
                borderRadius: '9999px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.875rem',
                background: isActive ? '#3b82f6' : 'transparent',
                color: isActive ? '#ffffff' : '#374151',
                boxShadow: isActive ? '0 6px 16px rgba(59,130,246,0.4)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {currency}
            </button>
          );
        })}
      </div>
    );
  };

  const renderVoiceOptions = (
    label: string,
    language: 'cantonese' | 'mandarin',
    currentVoice: InterpreterVoiceOption,
    isSaving: boolean
  ) => {
    const options: { value: InterpreterVoiceOption; label: string; icon: string }[] = [
      { value: 'female', label: '女声', icon: '👩‍🗣️' },
      { value: 'male', label: '男声', icon: '👨‍🗣️' },
    ];

    return (
      <div style={{ marginTop: '0.75rem' }}>
        <div style={{ fontWeight: 600, color: '#374151', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          {label}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {options.map((option) => {
            const isActive = currentVoice === option.value;
            const isDisabled = isSaving || isActive;
            return (
              <button
                key={option.value}
                type="button"
                disabled={isDisabled}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!isActive) {
                    onInterpreterVoiceChange(language, option.value);
                  }
                }}
                style={{
                  flex: '1 1 120px',
                  padding: '0.65rem 0.75rem',
                  borderRadius: '10px',
                  border: `1px solid ${isActive ? '#3b82f6' : '#e5e7eb'}`,
                  background: isActive ? 'linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%)' : '#ffffff',
                  color: isActive ? '#1e3a8a' : '#374151',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: isDisabled ? 'default' : 'pointer',
                  opacity: isDisabled && !isActive ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s',
                  boxShadow: isActive ? '0 8px 18px rgba(59,130,246,0.25)' : '0 2px 6px rgba(15,23,42,0.08)',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                <span>{option.icon}</span>
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const isPremiumMember = membershipType === 'subscription' || membershipType === 'lifetime';

  const planPrices = selectedPlan && selectedPlan !== 'free'
    ? PLAN_PRICE_MAP[selectedPlan]
    : null;

  const primaryPrice = selectedPlan && selectedPlan !== 'free' && planPrices
    ? planPrices[selectedCurrency]
    : selectedPlan === 'free'
    ? '無料'
    : '';

  const secondaryCurrency: CurrencyCode = selectedCurrency === 'jpy' ? 'hkd' : 'jpy';
  const secondaryPrice = selectedPlan && selectedPlan !== 'free' && planPrices
    ? planPrices[secondaryCurrency]
    : '';

  return (
    <>
      {showSettings && user && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onCloseSettings();
            }
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              onCloseSettings();
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: isMobile ? 0 : '400px',
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.3)',
              transition: 'opacity 0.3s ease',
              cursor: 'pointer'
            }}
          />
          <div
            data-settings-panel
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: isMobile ? '100%' : '400px',
              maxWidth: '90vw',
              height: '100%',
              backgroundColor: 'white',
              boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
              overflowY: 'auto',
              transform: 'translateX(0)',
              transition: 'transform 0.3s ease'
            }}
          >
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                margin: 0
              }}>⚙️ 設定</h2>
              <button
                onClick={onCloseSettings}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  marginBottom: '1rem',
                  color: '#374151'
                }}>アカウント情報</h3>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#6b7280',
                    marginBottom: '0.5rem'
                  }}>デフォルトで表示するカテゴリー</label>
                  
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      flex: 1,
                      padding: '0.75rem',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      fontSize: '1rem',
                      color: '#1f2937'
                    }}>
                      {categories.find(c => c.id === defaultCategoryId)?.name || '発音表記について'}
                    </div>
                    {(membershipType === 'subscription' || membershipType === 'lifetime') ? (
                      <button
                        onClick={openCategoryPicker}
                        disabled={isSavingDefaultCategory}
                        style={{
                          padding: '0.75rem 1rem',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: isSavingDefaultCategory ? 'not-allowed' : 'pointer',
                          opacity: isSavingDefaultCategory ? 0.6 : 1,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {isSavingDefaultCategory ? '保存中...' : '変更'}
                      </button>
                    ) : (
                      <div style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: '#f3f4f6',
                        color: '#9ca3af',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        whiteSpace: 'nowrap'
                      }}>
                        ブロンズは変更不可
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#6b7280',
                    marginBottom: '0.5rem'
                  }}>ユーザーネーム</label>
                  
                  {!isEditingUsername ? (
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        flex: 1,
                        padding: '0.75rem',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        fontSize: '1rem',
                        color: '#1f2937'
                      }}>
                        {user?.user_metadata?.username || 'ユーザーネーム未設定'}
                      </div>
                      <button
                        onClick={onEditUsernameStart}
                        style={{
                          padding: '0.75rem 1rem',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        変更
                      </button>
                    </div>
                  ) : (
                    <div>
                      {usernameError && (
                        <div style={{
                          padding: '0.75rem',
                          backgroundColor: '#fee2e2',
                          border: '1px solid #fecaca',
                          borderRadius: '8px',
                          color: '#dc2626',
                          fontSize: '0.875rem',
                          marginBottom: '0.75rem'
                        }}>
                          {usernameError}
                        </div>
                      )}
                      
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => onUsernameChange(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          marginBottom: '0.75rem',
                          boxSizing: 'border-box'
                        }}
                        placeholder="新しいユーザーネーム"
                      />
                      
                      <div style={{
                        display: 'flex',
                        gap: '0.5rem'
                      }}>
                        <button
                          type="button"
                          onClick={onUsernameSave}
                          style={{
                            flex: 1,
                            padding: '0.75rem',
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          保存
                        </button>
                        <button
                          type="button"
                          onClick={onUsernameCancel}
                          style={{
                            flex: 1,
                            padding: '0.75rem',
                            backgroundColor: '#6b7280',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#6b7280',
                    marginBottom: '0.5rem'
                  }}>登録メール</label>
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '1rem',
                    color: '#1f2937'
                  }}>
                    {user?.email}
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#6b7280',
                    marginBottom: '0.5rem'
                  }}>パスワード</label>
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      flex: 1,
                      padding: '0.75rem',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      fontSize: '1rem',
                      color: '#1f2937'
                    }}>
                      ••••••••
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onTogglePasswordForm();
                      }}
                      style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      変更
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#6b7280',
                    marginBottom: '0.5rem'
                  }}>ご登録期日</label>
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '1rem',
                    color: '#1f2937'
                  }}>
                    {user?.created_at ? (() => {
                      const date = new Date(user.created_at);
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      return `${year}年${month}月${day}日`;
                    })() : '登録日不明'}
                  </div>
                </div>

                {showPasswordChange && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    backgroundColor: '#f0f9ff',
                    borderRadius: '8px',
                    border: '1px solid #bfdbfe'
                  }}>
                    <h4 style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      marginBottom: '1rem',
                      color: '#1e40af'
                    }}>パスワード変更</h4>

                    {passwordError && (
                      <div style={{
                        padding: '0.75rem',
                        backgroundColor: '#fee2e2',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        color: '#dc2626',
                        fontSize: '0.875rem',
                        marginBottom: '1rem'
                      }}>
                        {passwordError}
                      </div>
                    )}

                    {passwordSuccess && (
                      <div style={{
                        padding: '0.75rem',
                        backgroundColor: '#dcfce7',
                        border: '1px solid #bbf7d0',
                        borderRadius: '8px',
                        color: '#16a34a',
                        fontSize: '0.875rem',
                        marginBottom: '1rem'
                      }}>
                        パスワードが正常に変更されました
                      </div>
                    )}

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>新しいパスワード</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => onPasswordInputChange('new', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            paddingRight: '3rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            boxSizing: 'border-box'
                          }}
                          placeholder="6文字以上、英数字記号"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            toggleNewPasswordVisibility();
                          }}
                          style={{
                            position: 'absolute',
                            right: '0.75rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '1.25rem',
                            color: '#6b7280',
                            padding: '0.25rem'
                          }}
                        >
                          {showNewPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>新しいパスワード（確認）</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => onPasswordInputChange('confirm', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            paddingRight: '3rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            boxSizing: 'border-box'
                          }}
                          placeholder="もう一度入力"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            toggleConfirmPasswordVisibility();
                          }}
                          style={{
                            position: 'absolute',
                            right: '0.75rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '1.25rem',
                            color: '#6b7280',
                            padding: '0.25rem'
                          }}
                        >
                          {showConfirmPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      gap: '0.5rem'
                    }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onPasswordSubmit();
                        }}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        変更する
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onPasswordCancel();
                        }}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          backgroundColor: '#6b7280',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#6b7280',
                    marginBottom: '0.75rem'
                  }}>会員種別</label>
                  
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginBottom: '1rem'
                  }}>
                    {(['free', 'subscription', 'lifetime'] as MembershipType[]).map(renderMembershipButton)}
                  </div>

                  <div style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h3 style={{
                      fontSize: '1rem',
                      fontWeight: '700',
                      marginBottom: '1rem',
                      color: '#1f2937',
                      textAlign: 'center'
                    }}>📊 プラン比較</h3>
                    
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '0.875rem'
                      }}>
                        <thead>
                          <tr>
                            <th style={{
                              padding: '0.75rem',
                              textAlign: 'left',
                              borderBottom: '2px solid #d1d5db',
                              fontWeight: '600',
                              color: '#374151',
                              backgroundColor: '#ffffff'
                            }}>機能・特典</th>
                            <th style={{
                              padding: '0.75rem',
                              textAlign: 'center',
                              borderBottom: '2px solid #d1d5db',
                              fontWeight: '600',
                              color: '#374151',
                              backgroundColor: '#ffffff'
                            }}>🥉 ブロンズ</th>
                            <th style={{
                              padding: '0.75rem',
                              textAlign: 'center',
                              borderBottom: '2px solid #d1d5db',
                              fontWeight: '600',
                              color: '#374151',
                              backgroundColor: '#ffffff'
                            }}>🥈 シルバー</th>
                            <th style={{
                              padding: '0.75rem',
                              textAlign: 'center',
                              borderBottom: '2px solid #d1d5db',
                              fontWeight: '600',
                              color: '#374151',
                              backgroundColor: '#ffffff'
                            }}>🏆 ゴールド</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ backgroundColor: '#ffffff' }}>
                            <td style={{
                              padding: '0.75rem',
                              borderBottom: '1px solid #e5e7eb',
                              fontWeight: '500',
                              color: '#1f2937'
                            }}>価格</td>
                            <td style={{
                              padding: '0.75rem',
                              textAlign: 'center',
                              borderBottom: '1px solid #e5e7eb',
                              color: '#a85f1f',
                              fontWeight: '600'
                            }}>無料</td>
                            <td style={{
                              padding: '0.75rem',
                              textAlign: 'center',
                              borderBottom: '1px solid #e5e7eb',
                              color: '#6b7280',
                              fontWeight: '600'
                            }}>¥980/月</td>
                            <td style={{
                              padding: '0.75rem',
                              textAlign: 'center',
                              borderBottom: '1px solid #e5e7eb',
                              color: '#d97706',
                              fontWeight: '600'
                            }}>¥9,800</td>
                          </tr>
                          <tr style={{ backgroundColor: '#f9fafb' }}>
                            <td style={{
                              padding: '0.75rem',
                              borderBottom: '1px solid #e5e7eb',
                              fontWeight: '500',
                              color: '#1f2937'
                            }}>カテゴリーアクセス</td>
                            <td style={{
                              padding: '0.75rem',
                              textAlign: 'center',
                              borderBottom: '1px solid #e5e7eb',
                              color: '#6b7280'
                            }}>基本</td>
                            <td style={{
                              padding: '0.75rem',
                              textAlign: 'center',
                              borderBottom: '1px solid #e5e7eb',
                              color: '#10b981',
                              fontWeight: '600'
                            }}>✓ 全カテゴリー</td>
                            <td style={{
                              padding: '0.75rem',
                              textAlign: 'center',
                              borderBottom: '1px solid #e5e7eb',
                              color: '#10b981',
                              fontWeight: '600'
                            }}>✓ 全カテゴリー</td>
                          </tr>
                          <tr style={{ backgroundColor: '#ffffff' }}>
                            <td style={{
                              padding: '0.75rem',
                              borderBottom: '1px solid #e5e7eb',
                              fontWeight: '500',
                              color: '#1f2937'
                            }}>お気に入り数</td>
                            <td style={{
                              padding: '0.75rem',
                              textAlign: 'center',
                              borderBottom: '1px solid #e5e7eb',
                              color: '#6b7280'
                            }}>6個まで</td>
                            <td style={{
                              padding: '0.75rem',
                              textAlign: 'center',
                              borderBottom: '1px solid #e5e7eb',
                              color: '#10b981',
                              fontWeight: '600'
                            }}>✓ 無制限</td>
                            <td style={{
                              padding: '0.75rem',
                              textAlign: 'center',
                              borderBottom: '1px solid #e5e7eb',
                              color: '#10b981',
                              fontWeight: '600'
                            }}>✓ 無制限</td>
                          </tr>
                          <tr style={{ backgroundColor: '#f9fafb' }}>
                            <td style={{
                              padding: '0.75rem',
                              borderBottom: '1px solid #e5e7eb',
                              fontWeight: '500',
                              color: '#1f2937'
                            }}>音声速度調整</td>
                            <td style={{
                              padding: '0.75rem',
                              textAlign: 'center',
                              borderBottom: '1px solid #e5e7eb',
                              color: '#ef4444'
                            }}>✗</td>
                            <td style={{
                              padding: '0.75rem',
                              textAlign: 'center',
                              borderBottom: '1px solid #e5e7eb',
                              color: '#10b981',
                              fontWeight: '600'
                            }}>✓</td>
                            <td style={{
                              padding: '0.75rem',
                              textAlign: 'center',
                              borderBottom: '1px solid #e5e7eb',
                              color: '#10b981',
                              fontWeight: '600'
                            }}>✓</td>
                          </tr>
                          <tr style={{ backgroundColor: '#ffffff' }}>
                            <td style={{
                              padding: '0.75rem',
                              borderBottom: '1px solid #e5e7eb',
                              fontWeight: '500',
                              color: '#1f2937'
                            }}>広告</td>
                            <td style={{
                              padding: '0.75rem',
                              textAlign: 'center',
                              borderBottom: '1px solid #e5e7eb',
                              color: '#ef4444'
                            }}>✗ あり</td>
                            <td style={{
                              padding: '0.75rem',
                              textAlign: 'center',
                              borderBottom: '1px solid #e5e7eb',
                              color: '#10b981',
                              fontWeight: '600'
                            }}>✓ なし</td>
                            <td style={{
                              padding: '0.75rem',
                              textAlign: 'center',
                              borderBottom: '1px solid #e5e7eb',
                              color: '#10b981',
                              fontWeight: '600'
                            }}>✓ なし</td>
                          </tr>
                          <tr style={{ backgroundColor: '#f9fafb' }}>
                            <td style={{
                              padding: '0.75rem',
                              borderBottom: '1px solid #e5e7eb',
                              fontWeight: '500',
                              color: '#1f2937'
                            }}>オフライン使用</td>
                            <td style={{
                              padding: '0.75rem',
                              textAlign: 'center',
                              borderBottom: '1px solid #e5e7eb',
                              color: '#ef4444'
                            }}>✗</td>
                            <td style={{
                              padding: '0.75rem',
                              textAlign: 'center',
                              borderBottom: '1px solid #e5e7eb',
                              color: '#10b981',
                              fontWeight: '600'
                            }}>✓</td>
                            <td style={{
                              padding: '0.75rem',
                              textAlign: 'center',
                              borderBottom: '1px solid #e5e7eb',
                              color: '#10b981',
                              fontWeight: '600'
                            }}>✓</td>
                          </tr>
                          <tr style={{ backgroundColor: '#ffffff' }}>
                            <td style={{
                              padding: '0.75rem',
                              fontWeight: '500',
                              color: '#1f2937'
                            }}>支払い方法</td>
                            <td style={{
                              padding: '0.75rem',
                              textAlign: 'center',
                              color: '#6b7280'
                            }}>-</td>
                            <td style={{
                              padding: '0.75rem',
                              textAlign: 'center',
                              color: '#6b7280'
                            }}>月額自動更新</td>
                            <td style={{
                              padding: '0.75rem',
                              textAlign: 'center',
                              color: '#6b7280'
                            }}>買い切り</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div style={{
                  marginTop: '2rem',
                  padding: '1rem',
                  backgroundColor: '#f0f9ff',
                  borderRadius: '8px',
                  border: '1px solid #bfdbfe'
                }}>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    marginBottom: '0.75rem',
                    color: '#1e40af'
                  }}>🔍 Supabaseデータ確認結果</h3>
                  
                  {loadingDebugInfo ? (
                    <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                      確認中...
                    </div>
                  ) : debugInfo ? (
                    <div style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong>Email:</strong> {debugInfo.email}
                      </div>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong>Username:</strong> {debugInfo.username ? `✅ ${debugInfo.username}` : '❌ 未設定'}
                      </div>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong>Membership:</strong> {debugInfo.membership_type ? `✅ ${debugInfo.membership_type}` : '❌ 未設定'}
                      </div>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong>Password:</strong> {debugInfo.has_password ? '✅ 設定済み' : '❌ 未設定'}
                      </div>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong>Last Sign In:</strong> {debugInfo.last_sign_in_at ? new Date(debugInfo.last_sign_in_at).toLocaleString('ja-JP') : '❌ 未設定'}
                      </div>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong>Updated At:</strong> {debugInfo.updated_at ? new Date(debugInfo.updated_at).toLocaleString('ja-JP') : '❌ 未設定'}
                      </div>
                      <div style={{ marginTop: '0.75rem', padding: '0.5rem', backgroundColor: '#fff', borderRadius: '4px', fontSize: '0.75rem', fontFamily: 'monospace', overflow: 'auto' }}>
                        <strong>Full Metadata:</strong>
                        <pre style={{ margin: '0.5rem 0 0 0', whiteSpace: 'pre-wrap' }}>
                          {JSON.stringify(debugInfo.full_metadata, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: '#dc2626', fontSize: '0.875rem' }}>
                      ❌ データ取得に失敗しました
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>一般</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <div style={{ color: '#374151' }}>あなたの言語</div>
                    <div style={{ marginLeft: 'auto', color: '#111827', fontWeight: 600 }}>日本語</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleClickSound();
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleClickSound();
                    }}
                    style={{ 
                      height: 36, 
                      borderRadius: 8, 
                      border: '1px solid #e5e7eb', 
                      background: isClickSoundEnabled ? '#f0fdf4' : '#f9fafb', 
                      cursor: 'pointer', 
                      fontWeight: 600,
                      fontSize: 13,
                      color: '#374151',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                      marginTop: '0.5rem'
                    }}
                  >
                    {isClickSoundEnabled ? '🔊 クリック音オン' : '🔇 クリック音オフ'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleLearningMode();
                    }}
                    style={{ 
                      height: 36, 
                      borderRadius: 8, 
                      border: '1px solid #e5e7eb', 
                      background: isLearningMode ? '#eff6ff' : '#f9fafb', 
                      cursor: 'pointer', 
                      fontWeight: 600,
                      fontSize: 13,
                      color: '#374151',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      marginTop: '0.5rem'
                    }}
                  >
                    {isLearningMode ? '📚 学習モード' : '🎵 ノーマルモード'}
                  </button>

                  {isPremiumMember ? (
                    <div style={{
                      marginTop: '0.75rem',
                      padding: '0.9rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid #e5e7eb',
                      background: '#f9fafb',
                      transition: 'border 0.2s ease'
                    }}>
                      <div style={{
                        fontWeight: 600,
                        color: '#1f2937',
                        fontSize: '0.95rem'
                      }}>
                        通訳モードの音声
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        marginTop: '0.35rem'
                      }}>
                        広東語・中国語の男女ボイスを選択できます。（即時保存）
                      </div>
                      {renderVoiceOptions('広東語', 'cantonese', interpreterCantoneseVoice, isSavingCantoneseVoice)}
                      {renderVoiceOptions('中国語（普通話）', 'mandarin', interpreterMandarinVoice, isSavingMandarinVoice)}
                      {(isSavingCantoneseVoice || isSavingMandarinVoice) && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#2563eb' }}>
                          保存中...
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{
                      marginTop: '0.75rem',
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      border: '1px dashed #e5e7eb',
                      background: '#f9fafb',
                      color: '#6b7280',
                      fontSize: '0.85rem',
                      lineHeight: 1.5
                    }}>
                      🔒 シルバー / ゴールド会員になると、通訳モードの音声（広東語・中国語）を男女で切り替えられます。
                    </div>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onLogout();
                  }}
                  style={{ 
                    marginTop: '1.5rem',
                    height: 36, 
                    borderRadius: 8, 
                    border: '1px solid #e5e7eb', 
                    background: '#fff', 
                    cursor: 'pointer', 
                    fontWeight: 700,
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    width: '100%',
                    fontSize: '14px'
                  }}
                >
                  ログアウト
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPricingModal && selectedPlan && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClosePricingModal();
            }
          }}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
            }
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
            padding: '1rem',
            overflow: 'hidden',
            touchAction: 'manipulation'
          }}>
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: isMobile ? '90vh' : '85vh',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            height: isMobile ? 'auto' : '85vh'
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: selectedPlan === 'free'
                ? 'linear-gradient(145deg, #d4a574 0%, #cd7f32 50%, #a85f1f 100%)'
                : selectedPlan === 'subscription' 
                ? 'linear-gradient(145deg, #e8e8e8 0%, #c0c0c0 50%, #a8a8a8 100%)' 
                : 'linear-gradient(145deg, #ffe066 0%, #ffd700 50%, #ffb700 100%)',
              flexShrink: 0
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                textShadow: '0 1px 2px rgba(255,255,255,0.5)'
              }}>
                <span style={{ fontSize: '2rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
                  {selectedPlan === 'free' ? '🥉' : selectedPlan === 'subscription' ? '🥈' : '🏆'}
                </span>
                <span>
                  {selectedPlan === 'free' ? 'ブロンズ会員' : selectedPlan === 'subscription' ? 'シルバー会員' : 'ゴールド会員'}
                </span>
              </h2>
              <button
                onClick={onClosePricingModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ 
              position: 'relative',
              flex: 1,
              minHeight: 0,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {showPricingModalTopArrow && (
                <div style={{
                  position: 'absolute',
                  top: '0.5rem',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 10,
                  fontSize: '1.5rem',
                  opacity: 0.7,
                  pointerEvents: 'none',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  color: '#6b7280'
                }}>
                  ↑
                </div>
              )}
              
              {showPricingModalBottomArrow && (
                <div style={{
                  position: 'absolute',
                  bottom: '0.5rem',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 10,
                  fontSize: '1.5rem',
                  opacity: 0.7,
                  pointerEvents: 'none',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  color: '#6b7280'
                }}>
                  ↓
                </div>
              )}
              
              <div 
                ref={pricingModalScrollRef}
                onScroll={() => {
                  if (pricingModalScrollRef.current) {
                    const { scrollTop, scrollHeight, clientHeight } = pricingModalScrollRef.current;
                    const canScroll = scrollHeight > clientHeight;
                    const isAtTop = scrollTop <= 10;
                    const isAtBottom = scrollTop >= scrollHeight - clientHeight - 10;
                    
                    if (canScroll) {
                      setShowPricingModalTopArrow(!isAtTop);
                      setShowPricingModalBottomArrow(!isAtBottom);
                    } else {
                      setShowPricingModalTopArrow(false);
                      setShowPricingModalBottomArrow(false);
                    }
                  }
                }}
                style={{ 
                  padding: '1.5rem',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  flex: 1,
                  minHeight: 0,
                  WebkitOverflowScrolling: 'touch',
                  paddingTop: showPricingModalTopArrow ? '2rem' : '1.5rem',
                  paddingBottom: showPricingModalBottomArrow ? '2rem' : '1.5rem',
                  transition: 'padding 0.3s ease',
                  maxHeight: '100%',
                  height: '100%'
                }}
              >
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  {renderCurrencyToggle()}
                  <div style={{
                    fontSize: '3rem',
                    fontWeight: 'bold',
                    color: selectedPlan === 'free' 
                      ? '#a85f1f'
                      : selectedPlan === 'subscription' 
                      ? '#6b7280' 
                      : '#d97706',
                    textShadow: selectedPlan === 'free'
                      ? '0 2px 4px rgba(0,0,0,0.1)'
                      : selectedPlan === 'subscription' 
                      ? '0 2px 4px rgba(0,0,0,0.1)' 
                      : '0 2px 4px rgba(255,215,0,0.3)'
                  }}>
                    {primaryPrice}
                  </div>
                  {secondaryPrice && selectedPlan !== 'free' && (
                    <div style={{
                      fontSize: '1.25rem',
                      color: '#6b7280',
                      marginTop: '0.5rem',
                      fontWeight: 600
                    }}>
                      {secondaryPrice}
                    </div>
                  )}
                  <div style={{
                    fontSize: '1rem',
                    color: '#6b7280',
                    marginTop: '0.5rem'
                  }}>
                    {selectedPlan === 'free' 
                      ? '（お気に入り6個まで）' 
                      : selectedPlan === 'subscription' 
                      ? '月額（自動更新）' 
                      : '買い切り（永久使用）'}
                  </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    marginBottom: '1rem',
                    color: '#374151'
                  }}>特典</h3>
                  <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0
                  }}>
                    {(selectedPlan === 'free' 
                      ? ['基本カテゴリーの単語へアクセス', 'お気に入り6個まで', '発音チェックゲーム']
                      : ['お気に入り無制限', 'モード切り替え (ノーマルモード・学習)', 'note 教科書自動更新', 'テキストOCR', '発音チェック', '発音チェックゲーム', '全カテゴリーの単語へアクセス', '音声速度調整', '広告なし']
                    ).map((benefit, idx) => (
                      <li key={benefit} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        marginBottom: '0.5rem',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px'
                      }}>
                        <span style={{ color: '#10b981', fontSize: '1.25rem' }}>✓</span>
                        <span style={{ color: '#1f2937' }}>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            
            <div style={{
              padding: '1.5rem',
              borderTop: '1px solid #e5e7eb',
              flexShrink: 0
            }}>
              <button
                onClick={() => handleStripeCheckout(selectedPlan)}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: selectedPlan === 'free'
                    ? 'linear-gradient(145deg, #d4a574 0%, #cd7f32 50%, #a85f1f 100%)'
                    : selectedPlan === 'subscription' 
                    ? 'linear-gradient(145deg, #e8e8e8 0%, #c0c0c0 50%, #a8a8a8 100%)' 
                    : 'linear-gradient(145deg, #ffe066 0%, #ffd700 50%, #ffb700 100%)',
                  color: '#1f2937',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: selectedPlan === 'free'
                    ? '0 4px 12px rgba(205,127,50,0.4), inset 0 1px 0 rgba(255,255,255,0.3)'
                    : selectedPlan === 'subscription' 
                    ? '0 4px 12px rgba(192,192,192,0.4), inset 0 1px 0 rgba(255,255,255,0.4)' 
                    : '0 4px 12px rgba(255,215,0,0.5), inset 0 1px 0 rgba(255,255,255,0.4)',
                  textShadow: '0 1px 2px rgba(255,255,255,0.5)'
                }}
              >
                {isDowngrade ? '今すぐダウングレード' : '今すぐアップグレード'}
              </button>

              <div style={{
                marginTop: '1rem',
                textAlign: 'center',
                fontSize: '0.75rem',
                color: '#9ca3af'
              }}>
                {selectedPlan === 'free'
                  ? 'お気に入りは6個までに制限されます'
                  : selectedPlan === 'subscription' 
                  ? 'いつでもキャンセル可能です' 
                  : '一度のお支払いで永久に使用できます'}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SettingsPortal;

