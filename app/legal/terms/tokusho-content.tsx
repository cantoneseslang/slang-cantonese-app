'use client';

const tokushoContent = {
  ja: {
    title: '特定商取引法に基づく表記',
    sections: [
      {
        title: '事業者',
        content: 'LIFESUPPORT(HK)LIMITED'
      },
      {
        title: '事業者の所在',
        content: 'Add:G/F No.163 Pan Chung,Tai Po,NT,HONGKONG\n地址-香港新界大埔泮涌163號地下'
      },
      {
        title: '運営責任者',
        content: '佐近宏樹'
      },
      {
        title: 'お問合せ先',
        content: 'メールアドレス：info@lifesupporthk.com\n※ お問い合わせの雛形をご利用ください。'
      },
      {
        title: '販売価格と手数料',
        content: '販売ページおよび購入手続きの画面において、消費税・手数料を含む価格で表示されています。\n本サービスの利用に必要となるインターネット通信料金はお客様のご負担となります。\nデジタルコンテンツ（役務）のため送料や返品送料は発生しません。'
      },
      {
        title: '提供時期',
        content: 'お支払いが確認でき次第、すぐに利用できるようになります。'
      },
      {
        title: 'お支払方法',
        content: 'クレジットカード、またはその他当社が定める方法（Apple Pay、Google Pay、Stripe Link）によりお支払いいただきます'
      },
      {
        title: 'お支払時期',
        content: '利用料金のお支払いは利用期間ごとの前払いとし、お支払時期は初回を有料サービス登録時、以降は1ヶ月または1年ごとの同日となります（翌月または翌年に同日がない場合は、その月の末日となります）。\nクレジットカード会社からお客様への請求時期は、お客様とクレジットカード会社との間の契約に基づきます。'
      },
      {
        title: '返品・キャンセル・解約について',
        content: 'デジタルサービスという性質上、お客様都合による返金・キャンセルはお受けしておりません。\n弊社の責による長期システム停止等、当社利用規約で定める場合に限り、未提供日数を日割り計算の上で返金いたします。\nマイページから次回更新日の24時間前までに解約いただけます。解約後も当該請求期間の終了日まではサービスをご利用いただけます。'
      },
      {
        title: '推奨するご利用環境',
        content: '以下の環境でのご利用を推奨します。\nお支払い前にあらかじめご利用環境での動作をご確認ください。',
        subsections: [
          {
            title: 'Web版（ブラウザ）',
            items: [
              'macOSの場合、ChromeまたはSafariの最新版',
              'Windowsの場合、EdgeまたはChromeの最新版',
              'iOSの場合、Safariの最新版',
              'Androidの場合、Chromeの最新版'
            ]
          },
          {
            title: 'デスクトップ版',
            items: [
              'macOSの場合、Apple Silicon搭載のmacOS 14以上',
              'Windowsの場合、Windows 11以上'
            ]
          }
        ]
      }
    ]
  },
  en: {
    title: 'Specified Commercial Transactions Act',
    sections: [
      {
        title: 'Business Operator',
        content: 'LIFESUPPORT(HK)LIMITED'
      },
      {
        title: 'Business Address',
        content: 'Add:G/F No.163 Pan Chung,Tai Po,NT,HONGKONG\n地址-香港新界大埔泮涌163號地下'
      },
      {
        title: 'Responsible Person',
        content: 'Sakon Hiroki'
      },
      {
        title: 'Contact Information',
        content: 'Email: info@lifesupporthk.com\n※ Please use the contact form.'
      },
      {
        title: 'Price and Fees',
        content: 'Prices displayed on the sales page and purchase screen include consumption tax and fees.\nInternet connection fees required to use this service are the responsibility of the customer.\nNo shipping or return shipping fees apply as this is digital content (service).'
      },
      {
        title: 'Delivery Time',
        content: 'Service will be available immediately after payment is confirmed.'
      },
      {
        title: 'Payment Methods',
        content: 'Payment can be made by credit card or other methods specified by us (Apple Pay, Google Pay, Stripe Link)'
      },
      {
        title: 'Payment Timing',
        content: 'Usage fees are prepaid for each usage period. Payment timing is at the time of initial paid service registration, and thereafter on the same day each month or year (if there is no same day in the following month or year, it will be on the last day of that month).\nThe billing timing from the credit card company to the customer is based on the contract between the customer and the credit card company.'
      },
      {
        title: 'Returns, Cancellation, and Termination',
        content: 'Due to the nature of digital services, we do not accept refunds or cancellations at the customer\'s convenience.\nRefunds will be made on a pro-rata basis for unprovided days only in cases stipulated in our Terms of Service, such as long-term system outages due to our responsibility.\nYou can cancel from your account page up to 24 hours before the next renewal date. After cancellation, you can continue to use the service until the end of the current billing period.'
      },
      {
        title: 'Recommended Operating Environment',
        content: 'We recommend using the service in the following environments.\nPlease check the operation in your usage environment before payment.',
        subsections: [
          {
            title: 'Web Version (Browser)',
            items: [
              'For macOS: Latest version of Chrome or Safari',
              'For Windows: Latest version of Edge or Chrome',
              'For iOS: Latest version of Safari',
              'For Android: Latest version of Chrome'
            ]
          },
          {
            title: 'Desktop Version',
            items: [
              'For macOS: macOS 14 or higher with Apple Silicon',
              'For Windows: Windows 11 or higher'
            ]
          }
        ]
      }
    ]
  }
};

export default function TokushoContent({ language }: { language: 'ja' | 'en' }) {
  const content = tokushoContent[language];

  return (
    <>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0', marginBottom: '1.5rem' }}>
        {content.title}
      </h2>

      {content.sections.map((section, index) => (
        <div key={index} style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#1f2937' }}>
            {section.title}
          </h3>
          {section.content && (
            <div style={{ 
              whiteSpace: 'pre-line', 
              lineHeight: '1.8',
              color: '#374151',
              marginBottom: section.subsections ? '1rem' : '0'
            }}>
              {section.content}
            </div>
          )}
          {section.subsections && section.subsections.map((subsection, subIndex) => (
            <div key={subIndex} style={{ marginTop: '1rem', marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#4b5563' }}>
                {subsection.title}
              </h4>
              <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', color: '#374151' }}>
                {subsection.items.map((item, itemIndex) => (
                  <li key={itemIndex} style={{ marginBottom: '0.5rem', lineHeight: '1.6' }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

