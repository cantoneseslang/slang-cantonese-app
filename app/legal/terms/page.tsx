'use client';

import { useState } from 'react';
import PrivacyContent from './privacy-content';
import TokushoContent from './tokusho-content';

const termsContent = {
  ja: {
    title: '利用規約',
    intro: '本利用規約（以下「本規約」といいます。）は、LIFESUPPORT(HK)LIMITED（以下「当社」といいます。）が広東語音れんおよび関連するアプリケーション上で提供するサービスの利用条件を定めるものです。本サービスのユーザー（以下「お客様」といいます。）は、本規約に同意したうえで、本サービスをご利用いただきます。',
    sections: [
      {
        title: '第1条 アカウントおよび利用資格',
        items: [
          { label: '1.1 アカウント作成:', text: '当社が認めた外部IDプロバイダーを通じてアカウントを作成することで、特定の機能をご利用いただけます。パスワードによるログイン方式を導入する場合がありますが、認証情報の管理はお客様ご自身の責任で行ってください。' },
          { label: '1.2 過去のアカウント停止:', text: '過去に本規約違反等によりアカウントが停止または解約されたことがあるお客様またはその所属する組織については、当社は登録を拒否または既存アカウントの解約を行う権利を留保します。' },
          { label: '1.3 情報の正確性:', text: 'お客様は、アカウント情報を正確かつ最新の状態に維持することに同意するものとします。' }
        ]
      },
      {
        title: '第2条 サービスの内容',
        items: [
          { text: '本サービスは、広東語の発音、意味、用例などの学習支援機能を提供します。' },
          { label: '無料プラン:', text: '無料プランでは利用回数に制限があります。' },
          { label: '有料サブスクリプションプラン:', text: '有料プランでは利用回数の上限が緩和され、高度な機能をご利用いただけます。' },
          { label: 'ライフタイムプラン:', text: '一度お支払いいただくことで、継続的な利用が可能です。' },
          { text: '当社は、プランの機能、特典、利用制限を随時変更することがあります。' }
        ]
      },
      {
        title: '第3条 サービス利用許諾',
        items: [
          { text: '当社は、本規約に従って本サービスへのアクセスおよび利用を行う非独占的、取消可能、譲渡不可、限定的な利用許諾をお客様に付与します。お客様は以下の行為を行ってはなりません。' },
          { list: [
            '本サービスのソフトウェア、ソースコードまたは機械学習モデル（以下あわせて「サービスソース等」）の複製、改変、リバースエンジニアリング、または当該サービスソース等を基礎とする派生物の作成',
            '本サービスの再販または商業利用（明示的に許可された場合を除く）',
            '競合製品の開発または違法な目的での利用'
          ]}
        ]
      },
      {
        title: '第4条 サブスクリプション、料金および支払い',
        items: [
          { label: '4.1 料金および請求サイクル:', text: 'サブスクリプション料金は、選択した期間（月間または年間など）ごとに前払いで請求されます。' },
          { label: '4.2 自動更新:', text: '現行期間終了前にキャンセルしない限り、同一期間で同額の料金にて自動更新されます。' },
          { 
            label: '4.3 決済処理:', 
            jsx: (
              <>
                決済は第三者プロバイダ（
                <a href="https://stripe.com/jp/legal/consumer" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                  Stripe
                </a>
                ）を通じて行われ、当社はクレジットカード情報等の全情報を保存しません。
              </>
            )
          },
          { label: '4.4 解約および返金:', text: 'アカウント設定からいつでも解約が可能です。解約により次回更新を停止しますが、既払い期間のサービス利用は有効期限まで継続します。既払い料金は原則として返金されません。ただし、法令により返金が義務付けられる場合はこの限りではありません。' }
        ]
      },
      {
        title: '第5条 ユーザーコンテンツおよび知的財産権',
        items: [
          { label: '5.1 お客様のコンテンツ:', text: 'お客様が検索や学習のために入力するテキスト、クエリ等（以下「ユーザーコンテンツ」）の権利はお客様に留保されます。明示的に共有機能を利用しない限り、検索結果や学習履歴はお客様のデバイス上にのみ保存され、サーバー上には保持されません。' },
          { label: '5.2 処理のための許諾:', text: '当社は、サービスを提供する目的でのみユーザーコンテンツを使用します。著作権その他の権利はお客様に帰属し、当社は二次利用を行いません。' },
          { label: '5.3 当社の知的財産:', text: '本サービスに関するソフトウェア、アルゴリズムおよびコンテンツは当社またはライセンサーが保有します。本条に定める利用許諾を除き、いかなる権利も付与されません。' }
        ]
      },
      {
        title: '第6条 利用規約違反行為の禁止',
        items: [
          { text: 'お客様は以下の行為を行ってはなりません。' },
          { list: [
            '法令または公序良俗に反する目的での利用',
            'わいせつ、ポルノ、過度の暴力、ヘイト、差別的コンテンツの検索依頼',
            'マルウェア、スパムその他の不正な情報の送信',
            '利用制限回避のための複数無料アカウント作成や不正アクセス',
            '本サービスまたはセキュリティ機能の妨害・破壊'
          ]},
          { text: '当社は、違反が認められた場合、コンテンツやアカウントの停止・削除を行うことがあります。' }
        ]
      },
      {
        title: '第7条 プライバシー',
        items: [
          { text: '本サービスのご利用にあたっては、当社のプライバシーポリシーが適用されます。個人情報の収集、利用、保護方法については当該ポリシーをご参照ください。' }
        ]
      },
      {
        title: '第8条 解約およびサービス停止',
        items: [
          { label: '8.1 当社による停止・解約:', text: 'お客様が本規約に違反した場合、当社は返金なしで利用停止またはアカウント解約を行うことができます。' },
          { label: '8.2 お客様による解約:', text: '設定パネルからいつでもアカウント解約が可能です。解約によって前払い料金の返金は発生しません。' },
          { label: '8.3 効力:', text: '解約後は本サービス利用許諾が終了し、当社はプライバシーポリシーおよび関連法令に従い、アカウント情報を削除できるものとします。' }
        ]
      },
      {
        title: '第9条 免責事項',
        items: [
          { text: '本サービスは「現状有姿」「現状有効」で提供されます。法令で許容される最大限の範囲で、当社は明示的、黙示的、法定のいかなる保証も否認します。これには、商品性、特定目的適合性、非侵害性、翻訳精度、継続的運用保証などが含まれます。' },
          { label: '不可抗力', text: '当事者は、天災地変、火災、洪水、地震、嵐、テロ、暴動、戦争、流行病、政府の行動、公私の通信網障害など、合理的な制御を超える事由による義務不履行や遅延について責任を負わないものとします。影響を受けた当事者は速やかに相手方に通知し、可能な限り履行を再開するよう努めます。' }
        ]
      },
      {
        title: '第10条 責任の制限',
        items: [
          { text: '当社の本サービスまたは本規約に起因または関連して生じた一切の責任は、当該事象発生前12か月間にお客様が当社に支払った総額を上限とします。間接的、付随的、結果的、特別または懲罰的損害、利益喪失、データ損失、信用失墜については責任を負いません。' }
        ]
      },
      {
        title: '第11条 免責および補償',
        items: [
          { text: 'お客様は、本規約違反、ユーザーコンテンツ、または本サービスの不適切な利用から生じるいかなる請求、損失、損害（弁護士費用を含む）についても、当社およびその関連会社を免責し、防御し、補償するものとします。' }
        ]
      },
      {
        title: '第12条 規約変更',
        items: [
          { text: '当社は本規約を随時変更できるものとし、ウェブサイト上に改定版を掲載し、「最終更新日」を更新します。お客様に不利益となる変更については、少なくとも30日前にメールにて通知するか、ウェブサイトまたはアプリケーション上で明示的な同意を取得します。改定後に本サービスを継続利用した場合、改定内容に同意したものとみなします。' }
        ]
      },
      {
        title: '第13条 通知および連絡先',
        items: [
          { text: '本規約や本サービスに関するご質問は、info@lifesupporthk.com 宛にメールでお問い合わせください。正式な法的通知は電子メールで行い、送信の翌営業日に受領されたものとします。' }
        ]
      },
      {
        title: '第14条 準拠法',
        items: [
          { text: '本規約および本サービスに関連する紛争は、香港法に準拠し、その解釈および適用にあたっては香港法を専属的に適用します。' }
        ]
      },
      {
        title: '第15条 その他',
        items: [
          { text: '本規約のいずれかの条項が無効または執行不能と判断された場合でも、残りの条項は引き続き有効とします。また、権利の不行使は権利放棄を意味しません。本規約は、お客様と当社との間の本サービスに関する完全な合意を構成し、これに先立つ一切の合意に優先します。' },
          { text: '本規約は日本語版と英語版で作成されています。香港に居住するユーザーについては、英語版の規定が日本語版に優先します。香港国外に居住するユーザーについては、日本語版の規定が英語版に優先します。いずれの場合も、優先しない言語の版は便宜的な参考訳として提供されるものとし、両言語間に齟齬が生じた場合は上記の優先言語版に従うものとします。' }
        ]
      }
    ],
    lastUpdated: '最終改定日: 2025年10月31日',
    switchLanguage: '英語版'
  },
  en: {
    title: 'Terms of Service',
    intro: 'These Terms of Service (the "Terms") govern your use of the services provided by LIFESUPPORT(HK)LIMITED (the "Company" or "we") on Cantonese pronunciation practice and related applications. By using our services (the "Service"), you (the "User" or "you") agree to be bound by these Terms.',
    sections: [
      {
        title: 'Article 1: Account and Eligibility',
        items: [
          { label: '1.1 Account Creation:', text: 'You may create an account through an external ID provider authorized by us to access certain features. We may introduce password-based login, and you are responsible for managing your authentication credentials.' },
          { label: '1.2 Previous Account Suspension:', text: 'We reserve the right to refuse registration or terminate existing accounts for users or organizations whose accounts have been previously suspended or terminated due to violations of these Terms.' },
          { label: '1.3 Information Accuracy:', text: 'You agree to maintain accurate and up-to-date account information.' }
        ]
      },
      {
        title: 'Article 2: Service Content',
        items: [
          { text: 'The Service provides learning support features including Cantonese pronunciation, meanings, and example usage.' },
          { label: 'Free Plan:', text: 'The free plan has usage limitations.' },
          { label: 'Paid Subscription Plan:', text: 'Paid plans have relaxed usage limits and provide access to advanced features.' },
          { label: 'Lifetime Plan:', text: 'A one-time payment enables continuous use of the Service.' },
          { text: 'We may modify plan features, benefits, and usage restrictions at any time.' }
        ]
      },
      {
        title: 'Article 3: Service License',
        items: [
          { text: 'We grant you a non-exclusive, revocable, non-transferable, limited license to access and use the Service in accordance with these Terms. You must not:' },
          { list: [
            'Copy, modify, reverse engineer, or create derivative works based on the Service\'s software, source code, or machine learning models (collectively, "Service Source Materials")',
            'Resell or commercially exploit the Service (except as expressly permitted)',
            'Develop competing products or use the Service for illegal purposes'
          ]}
        ]
      },
      {
        title: 'Article 4: Subscription, Fees, and Payment',
        items: [
          { label: '4.1 Fees and Billing Cycle:', text: 'Subscription fees are charged in advance for the selected period (monthly, annual, etc.).' },
          { label: '4.2 Auto-Renewal:', text: 'Unless cancelled before the current period ends, subscriptions automatically renew for the same period at the same fee.' },
          { 
            label: '4.3 Payment Processing:', 
            jsx: (
              <>
                Payments are processed through third-party providers (
                <a href="https://stripe.com/jp/legal/consumer" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                  Stripe
                </a>
                ), and we do not store any credit card information.
              </>
            )
          },
          { label: '4.4 Cancellation and Refunds:', text: 'You may cancel your subscription at any time through account settings. Cancellation stops future renewals, but service access continues until the end of the prepaid period. Prepaid fees are generally non-refundable, except where required by law.' }
        ]
      },
      {
        title: 'Article 5: User Content and Intellectual Property',
        items: [
          { label: '5.1 Your Content:', text: 'You retain rights to text, queries, and other content you input for search or learning purposes (collectively, "User Content"). Unless you explicitly use sharing features, search results and learning history are stored only on your device and not retained on our servers.' },
          { label: '5.2 License for Processing:', text: 'We use User Content solely to provide the Service. All copyrights and other rights remain yours, and we do not engage in secondary use.' },
          { label: '5.3 Our Intellectual Property:', text: 'All software, algorithms, and content related to the Service are owned by us or our licensors. No rights are granted except as specified in this Article.' }
        ]
      },
      {
        title: 'Article 6: Prohibited Conduct',
        items: [
          { text: 'You must not:' },
          { list: [
            'Use the Service for purposes that violate laws or public order and morals',
            'Request translation of obscene, pornographic, excessively violent, hateful, or discriminatory content',
            'Send malware, spam, or other malicious information',
            'Create multiple free accounts or engage in unauthorized access to circumvent usage limits',
            'Interfere with or disrupt the Service or security features'
          ]},
          { text: 'We may suspend or delete content or accounts if violations are detected.' }
        ]
      },
      {
        title: 'Article 7: Privacy',
        items: [
          { text: 'Our Privacy Policy applies to your use of the Service. Please refer to that policy for information on how we collect, use, and protect personal information.' }
        ]
      },
      {
        title: 'Article 8: Cancellation and Service Termination',
        items: [
          { label: '8.1 Termination by Us:', text: 'We may suspend or terminate your account without refund if you violate these Terms.' },
          { label: '8.2 Cancellation by You:', text: 'You may cancel your account at any time through the settings panel. Cancellation does not result in refunds of prepaid fees.' },
          { label: '8.3 Effect:', text: 'Upon cancellation, your license to use the Service terminates, and we may delete account information in accordance with our Privacy Policy and applicable laws.' }
        ]
      },
      {
        title: 'Article 9: Disclaimers',
        items: [
          { text: 'The Service is provided "as is" and "as available." To the maximum extent permitted by law, we disclaim all express, implied, and statutory warranties, including merchantability, fitness for a particular purpose, non-infringement, translation accuracy, and continuous operation guarantees.' },
          { label: 'Force Majeure', text: 'Neither party shall be liable for failure or delay in performance due to causes beyond reasonable control, including natural disasters, fire, flood, earthquake, storm, terrorism, riots, war, epidemics, government actions, or public or private network failures. The affected party shall promptly notify the other and make reasonable efforts to resume performance.' }
        ]
      },
      {
        title: 'Article 10: Limitation of Liability',
        items: [
          { text: 'Our total liability arising from or related to the Service or these Terms shall not exceed the total amount you paid to us in the 12 months preceding the event. We are not liable for indirect, incidental, consequential, special, or punitive damages, lost profits, data loss, or loss of reputation.' }
        ]
      },
      {
        title: 'Article 11: Indemnification',
        items: [
          { text: 'You agree to indemnify, defend, and hold harmless us and our affiliates from any claims, losses, or damages (including attorney fees) arising from your violation of these Terms, User Content, or improper use of the Service.' }
        ]
      },
      {
        title: 'Article 12: Changes to Terms',
        items: [
          { text: 'We may modify these Terms at any time by posting the revised version on our website and updating the "Last Updated" date. For changes that adversely affect you, we will provide at least 30 days\' notice via email or obtain explicit consent on the website or application. Continued use after changes constitutes acceptance of the modified Terms.' }
        ]
      },
      {
        title: 'Article 13: Notices and Contact',
        items: [
          { text: 'For questions regarding these Terms or the Service, please contact us at info@lifesupporthk.com. Formal legal notices shall be sent by email and deemed received on the next business day after sending.' }
        ]
      },
      {
        title: 'Article 14: Governing Law',
        items: [
          { text: 'These Terms and any disputes related to the Service shall be governed by and construed in accordance with Hong Kong law.' }
        ]
      },
      {
        title: 'Article 15: Miscellaneous',
        items: [
          { text: 'If any provision of these Terms is found invalid or unenforceable, the remaining provisions shall remain in effect. Our failure to exercise any right does not constitute a waiver. These Terms constitute the entire agreement between you and us regarding the Service and supersede all prior agreements.' },
          { text: 'These Terms are provided in both Japanese and English versions. For users residing in Hong Kong, the English version takes precedence over the Japanese version. For users residing outside Hong Kong, the Japanese version takes precedence over the English version. In either case, the non-preferred language version is provided for convenience only, and in case of discrepancies, the preferred language version shall prevail.' }
        ]
      }
    ],
    lastUpdated: 'Last Updated: October 31, 2025',
    switchLanguage: '日本語版'
  }
};

type TabType = 'terms' | 'privacy' | 'tokusho';

export default function TermsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('terms');
  const [language, setLanguage] = useState<'ja' | 'en'>('ja');

  const tabs = {
    ja: {
      terms: '利用規約',
      privacy: 'プライバシー',
      tokusho: '特商法表記'
    },
    en: {
      terms: 'Terms of Service',
      privacy: 'Privacy',
      tokusho: 'Specified Commercial Transactions Act'
    }
  };

  const renderContent = () => {
    if (activeTab === 'terms') {
      const content = termsContent[language];
      return (
        <>
          <p style={{ marginBottom: '2rem' }}>
            {content.intro}
          </p>
          {content.sections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '2rem', marginBottom: '1rem' }}>
                {section.title}
              </h2>
              {section.items.map((item, itemIndex) => (
                <div key={itemIndex}>
                  {'list' in item && item.list ? (
                    <ul style={{ listStyle: 'disc', paddingLeft: '2rem', marginBottom: '1rem' }}>
                      {item.list.map((listItem, listIndex) => (
                        <li key={listIndex} style={{ marginBottom: '0.5rem' }}>
                          {listItem}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ marginBottom: ('label' in item && item.label) ? '0.5rem' : '1rem' }}>
                      {'label' in item && item.label && <strong>{item.label} </strong>}
                      {'jsx' in item && item.jsx ? item.jsx : ('text' in item ? item.text : '')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ))}
          <p style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb', fontSize: '0.875rem', color: '#6b7280' }}>
            {content.lastUpdated}
          </p>
        </>
      );
    } else if (activeTab === 'privacy') {
      return <PrivacyContent language={language} />;
    } else if (activeTab === 'tokusho') {
      return <TokushoContent language={language} />;
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', lineHeight: '1.8' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem', textAlign: 'center' }}>
        {language === 'ja' ? '利用規約' : 'Terms of Service'}
      </h1>

      {/* タブナビゲーション */}
      <div style={{
        display: 'flex',
        backgroundColor: '#e5e7eb',
        borderRadius: '8px',
        padding: '4px',
        marginBottom: '2rem',
        gap: '4px'
      }}>
        <button
          onClick={() => setActiveTab('terms')}
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: activeTab === 'terms' ? '#ffffff' : 'transparent',
            color: activeTab === 'terms' ? '#1f2937' : '#6b7280',
            fontWeight: activeTab === 'terms' ? 'bold' : 'normal',
            cursor: 'pointer',
            fontSize: '0.875rem',
            transition: 'all 0.2s'
          }}
        >
          {tabs[language].terms}
        </button>
        <button
          onClick={() => setActiveTab('privacy')}
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: activeTab === 'privacy' ? '#ffffff' : 'transparent',
            color: activeTab === 'privacy' ? '#1f2937' : '#6b7280',
            fontWeight: activeTab === 'privacy' ? 'bold' : 'normal',
            cursor: 'pointer',
            fontSize: '0.875rem',
            transition: 'all 0.2s'
          }}
        >
          {tabs[language].privacy}
        </button>
        <button
          onClick={() => setActiveTab('tokusho')}
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: activeTab === 'tokusho' ? '#ffffff' : 'transparent',
            color: activeTab === 'tokusho' ? '#1f2937' : '#6b7280',
            fontWeight: activeTab === 'tokusho' ? 'bold' : 'normal',
            cursor: 'pointer',
            fontSize: '0.875rem',
            transition: 'all 0.2s'
          }}
        >
          {tabs[language].tokusho}
        </button>
      </div>

      <div style={{ marginTop: '1rem' }}>
        {renderContent()}

        <p style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button
            onClick={() => setLanguage(language === 'ja' ? 'en' : 'ja')}
            style={{
              background: 'none',
              border: 'none',
              color: '#3b82f6',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '0.875rem',
              padding: '0.5rem 1rem'
            }}
          >
            {language === 'ja' ? '英語版' : '日本語版'}
          </button>
        </p>
      </div>
    </div>
  );
}
