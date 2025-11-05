'use client';

import { useState } from 'react';

const privacyContent = {
  ja: {
    title: 'プライバシーポリシー',
    intro: 'LIFESUPPORT(HK)LIMITED（以下「当社」といいます。）は、当社がお預かりする様々な個人情報に関して、個人情報の保護に関する法律（以下「個人情報保護法」といいます。）を遵守すると共に、以下のプライバシーポリシー（以下「本ポリシー」といいます。）に従って適切なプライバシー情報の保護に努めます。',
    sections: [
      {
        title: '第1条（プライバシー情報の定義）',
        items: [
          { text: 'プライバシー情報とは、個人情報、履歴情報および特性情報を指します。' },
          { text: 'プライバシー情報のうち「個人情報」とは、個人情報保護法にいう「個人情報」を指すものであり、生存する個人に関する情報であって、当該情報に含まれる氏名、連絡先その他の記述等により特定の個人を識別できる情報を指します。' },
          { text: 'プライバシー情報のうち「履歴情報および特性情報」とは、上記に定める「個人情報」以外のもので、ご利用いただいたサービスやご覧になったページ、広告の履歴、検索キーワード、ご利用日時、ご利用の方法、ご利用環境、IPアドレス、Cookie、端末の個体識別情報など、当社サービスの利用者がサービスを利用する際の履歴に関する情報や、利用者の有する特性に関する情報を指します。' },
          { text: 'プライバシー情報のうち「個人関連情報」とは、個人情報に該当しない Cookie、閲覧履歴、広告識別子その他の情報であって、他の情報と照合しない限り特定の個人を識別できない情報をいいます。' },
          { text: '本ポリシーにおいて「仮名加工情報」および「匿名加工情報」を新たに取り扱う場合には、本ポリシーの安全管理措置及び第三者提供等の規定を準用します。' }
        ]
      },
      {
        title: '第2条（プライバシー情報の収集）',
        items: [
          { text: '当社サービスでは、第3条に定める目的のため、利用者が利用登録をする際または当社サービスの利用中にメールアドレスや住所などのプライバシー情報をお尋ねすることがあります。' },
          { text: 'また、利用者と提携先との間でなされた取引記録や決済に関する情報を当社の提携先から収集することがあります。' },
          { text: '当社は、プライバシー情報を利用目的の達成に必要な期間のみ保持し、当該期間終了後は速やかに消去又は匿名化します。保持期間の基準は以下のとおりです。' },
          { list: [
            'ユーザーアカウント情報：退会から最大で1年間',
            '決済記録：法定保存期間（7年間）',
            'ログデータ：収集日から12か月'
          ]}
        ]
      },
      {
        title: '第3条（プライバシー情報を収集・利用する目的）',
        items: [
          { text: '当社がプライバシー情報を収集・利用する目的は、以下のとおりです。' },
          { list: [
            '当社または当社サービスに関するお問い合わせに対応するため',
            '当社サービスを提供するため',
            '当社サービスの利用料金等の請求を行うため',
            '当社サービスの不正利用の防止、または不正利用が生じた際の対応のため',
            '当社サービスに関するお知らせや連絡をするため',
            '当社サービスのサービス向上のための調査、分析をするため',
            '当社サービスの利用者に自身の登録情報の閲覧や修正を行っていただくため',
            'お知らせやサービスの案内を送付するため',
            '当社の採用に関する応募、選考のため',
            'その他、上記利用目的に付随する目的のため'
          ]}
        ]
      },
      {
        title: '第4条（プライバシー情報の安全管理措置）',
        items: [
          { text: '当社は、個人情報保護法および関連ガイドラインに基づき、以下の区分別の安全管理措置を講じます。' },
          { label: '組織的安全管理措置', text: '個人情報保護管理者を選任し、取扱状況を定期点検します。従業者に対し取扱規程を策定し、役割と責任を明確化します。' },
          { label: '人的安全管理措置', text: '全従業者に対し機密保持契約を締結し、年1回以上の教育を実施します。' },
          { label: '技術的安全管理措置', text: 'アクセス制御（最小権限付与）、通信及び保存時暗号化、侵入検知システムを導入します。' },
          { label: '外的環境の把握', text: '個人データを保管する国の法制度を定期的に調査し、適切な保護水準を確認します。' }
        ]
      },
      {
        title: '第4条の2（漏えい等の報告・通知）',
        items: [
          { text: '当社は、個人情報の漏えい、滅失、き損その他の事態（以下「漏えい等」といいます。）が発生した場合、速やかに事実関係を確認し、漏えい等により生じうる外部流出又は再発リスクの程度を評価のうえ、個人情報保護委員会への報告及び本人への通知を原則として72時間以内に行います。通知が遅れる場合にはその理由を説明し、追加情報を確定次第速やかに報告します。' }
        ]
      },
      {
        title: '第5条（プライバシー情報の第三者提供）',
        items: [
          { text: '当社は、次に掲げる場合を除いて、予め利用者の同意を得ることなく、第三者にプライバシー情報を提供することはありません。ただし、個人情報保護法その他の法令で認められる場合を除きます。' },
          { list: [
            '人の生命、身体または財産の保護のために必要がある場合で、本人の同意を得ることが困難なとき',
            '公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難であるとき',
            '国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合であって、本人の同意を得ることにより当該事務の遂行に支障を及ぼすおそれがあるとき',
            '予め次の事項を告知あるいは公表をしている場合',
            '利用目的に第三者への提供を含むこと',
            '第三者に提供されるデータの項目',
            '第三者への提供の手段または方法',
            '本人の求めに応じてプライバシー情報の第三者への提供を停止すること'
          ]},
          { text: '前項の定めにかかわらず、次に掲げる場合は第三者提供には該当しないものとします。' },
          { list: [
            '当社が利用目的の達成に必要な範囲内においてプライバシー情報の取扱いの全部または一部を委託する場合',
            '合併その他の事由による事業の承継に伴ってプライバシー情報が提供される場合'
          ]},
          { 
            jsx: (
              <>
                当社サービスでは、有料サービスの利用料金等の請求および決済を第三者決済プロバイダ（
                <a href="https://stripe.com/jp/legal/consumer" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                  Stripe
                </a>
                ）に委託しています。当該処理に伴うプライバシー情報の取り扱い等については、各決済プロバイダが定める
                <a href="https://stripe.com/jp/legal/consumer" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                  顧客利用規約
                </a>
                およびプライバシーポリシーが適用されます。
              </>
            )
          }
        ]
      },
      {
        title: '第5条の2（アクセス解析サービスの利用）',
        items: [
          { 
            jsx: (
              <>
                当社サービスでは、アクセス状況を解析するために、各種アクセス解析サービス（
                <a href="https://www.cloudflare.com/ja-jp/privacypolicy/" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                  Cloudflare
                </a>
                ）を利用することがあります。これらのサービスでは、アクセス回数や滞在時間、利用環境等のデータを収集・分析するために、Cookieなどデバイスに記録されている識別子や、Webビーコン、IPアドレスなどを利用することがあります。データは匿名で収集されており、個人を特定するものではありません。
                <br />
                <br />
                Cloudflareに関する詳細は
                <a href="https://www.cloudflare.com/ja-jp/website-terms/" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                  Cloudflareの利用規約
                </a>
                および
                <a href="https://www.cloudflare.com/ja-jp/privacypolicy/" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                  Cloudflareのプライバシーポリシー
                </a>
                をご覧ください。
              </>
            )
          }
        ]
      },
      {
        title: '第6条（保有個人データの開示等の請求手続）',
        items: [
          { text: '利用者は、個人情報保護法に基づき、当社が保有する自己の保有個人データに関して、以下の請求を行うことができます。' },
          { list: [
            '開示（第三者提供記録を含む）',
            '訂正、追加又は削除',
            '利用停止又は第三者提供停止'
          ]},
          { text: '個人情報の開示に際しては、1件につき手数料1,000円（税抜）を徴収します。手数料納付方法等の詳細は請求受付時にご案内します。当社は、請求を受領後、2週間以内に書面又は電子メールにより回答します。請求に応じない場合はその理由を説明します。' }
        ]
      },
      {
        title: '第7条（プライバシーポリシーの変更）',
        items: [
          { text: '当社は、本ポリシーの内容を利用者に通知することなく変更できます。ただし、重大な影響を与えると判断した場合には、事前に通知または告知します。変更後のポリシーは本ページへの掲載時に効力を発します。' }
        ]
      },
      {
        title: '第8条（お問い合わせ窓口）',
        items: [
          { text: '本ポリシーに関するお問い合わせ、プライバシー情報の訂正・削除請求等は、以下の窓口までお願いいたします。' },
          { list: [
            'お問い合わせフォーム',
            'Eメール: info@lifesupporthk.com'
          ]}
        ]
      }
    ],
    lastUpdated: '最終改定日: 2025年1月14日',
    switchLanguage: '英語版'
  },
  en: {
    title: 'Privacy Policy',
    intro: 'LIFESUPPORT(HK)LIMITED (the "Company" or "we") is committed to protecting personal information in accordance with applicable privacy laws and the following Privacy Policy (the "Policy").',
    sections: [
      {
        title: 'Article 1: Definition of Privacy Information',
        items: [
          { text: 'Privacy information refers to personal information, history information, and characteristic information.' },
          { text: '"Personal information" means information about a living individual that can identify a specific person by name, contact information, or other descriptions contained in such information, as defined in applicable privacy laws.' },
          { text: '"History information and characteristic information" refers to information other than "personal information" as defined above, including services used, pages viewed, advertising history, search keywords, usage times, usage methods, usage environment, IP addresses, cookies, device identifiers, and other information related to users\' service usage history and characteristics.' },
          { text: '"Personal-related information" refers to information such as cookies, browsing history, advertising identifiers, and other information that does not constitute personal information and cannot identify a specific individual unless cross-referenced with other information.' },
          { text: 'If we newly handle "pseudonymized information" or "anonymized information" under this Policy, the provisions regarding security management measures and third-party provision shall apply mutatis mutandis.' }
        ]
      },
      {
        title: 'Article 2: Collection of Privacy Information',
        items: [
          { text: 'Our Service may ask for privacy information such as email addresses or addresses when users register or use our Service for the purposes set forth in Article 3.' },
          { text: 'We may also collect transaction records and payment information from our partners regarding transactions between users and partners.' },
          { text: 'We retain privacy information only for the period necessary to achieve the purposes of use and promptly delete or anonymize it after such period ends. Retention periods are as follows:' },
          { list: [
            'User account information: Up to 1 year after account termination',
            'Payment records: Statutory retention period (7 years)',
            'Log data: 12 months from collection date'
          ]}
        ]
      },
      {
        title: 'Article 3: Purpose of Collection and Use of Privacy Information',
        items: [
          { text: 'We collect and use privacy information for the following purposes:' },
          { list: [
            'To respond to inquiries regarding us or our Service',
            'To provide our Service',
            'To bill for usage fees of our Service',
            'To prevent unauthorized use of our Service or respond to unauthorized use',
            'To provide notices and communications regarding our Service',
            'To conduct surveys and analysis for service improvement',
            'To allow users to view and modify their registered information',
            'To send notices and service information',
            'For recruitment applications and selection',
            'For other purposes incidental to the above purposes of use'
          ]}
        ]
      },
      {
        title: 'Article 4: Security Management Measures for Privacy Information',
        items: [
          { text: 'We implement the following security management measures in accordance with applicable privacy laws and related guidelines:' },
          { label: 'Organizational Security Measures', text: 'We appoint a privacy protection manager and conduct regular inspections of handling status. We establish handling regulations for employees and clarify roles and responsibilities.' },
          { label: 'Human Security Measures', text: 'We enter into confidentiality agreements with all employees and conduct education at least once a year.' },
          { label: 'Technical Security Measures', text: 'We implement access control (minimum privilege), encryption during transmission and storage, and intrusion detection systems.' },
          { label: 'Understanding External Environment', text: 'We regularly investigate the legal systems of countries where personal data is stored and confirm appropriate protection levels.' }
        ]
      },
      {
        title: 'Article 4-2: Reporting and Notification of Leaks',
        items: [
          { text: 'If a leak, loss, damage, or other incident (collectively, "leak") of personal information occurs, we will promptly confirm the facts, evaluate the extent of potential external disclosure or recurrence risk, and report to the relevant authority and notify the individual within 72 hours in principle. If notification is delayed, we will explain the reason and promptly report when additional information is confirmed.' }
        ]
      },
      {
        title: 'Article 5: Third-Party Provision of Privacy Information',
        items: [
          { text: 'We will not provide privacy information to third parties without prior consent from users, except in the following cases. However, this does not apply when permitted by applicable privacy laws or other laws.' },
          { list: [
            'When necessary to protect human life, body, or property and it is difficult to obtain the individual\'s consent',
            'When particularly necessary for public health improvement or sound child development and it is difficult to obtain the individual\'s consent',
            'When cooperation is necessary for national or local government agencies or their contractors to perform duties prescribed by law and obtaining consent may hinder such performance',
            'When the following matters have been announced or published in advance:',
            'That the purpose of use includes provision to third parties',
            'Items of data provided to third parties',
            'Means or method of provision to third parties',
            'That provision to third parties will be stopped upon request'
          ]},
          { text: 'Notwithstanding the above, the following cases do not constitute third-party provision:' },
          { list: [
            'When we entrust all or part of the handling of privacy information to the extent necessary to achieve the purpose of use',
            'When privacy information is provided due to business succession through merger or other reasons'
          ]},
          { 
            jsx: (
              <>
                Our Service entrusts billing and payment processing for paid services to third-party payment providers (
                <a href="https://stripe.com/jp/legal/consumer" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                  Stripe
                </a>
                ). The handling of privacy information in connection with such processing is subject to the 
                <a href="https://stripe.com/jp/legal/consumer" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                  terms of service
                </a>
                {' '}and privacy policies established by each payment provider.
              </>
            )
          }
        ]
      },
      {
        title: 'Article 5-2: Use of Access Analysis Services',
        items: [
          { 
            jsx: (
              <>
                Our Service may use various access analysis services (
                <a href="https://www.cloudflare.com/ja-jp/privacypolicy/" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                  Cloudflare
                </a>
                ) to analyze access status. These services may use identifiers recorded on devices such as cookies, web beacons, IP addresses, etc., to collect and analyze data such as access counts, stay times, and usage environment. Data is collected anonymously and does not identify individuals.
                <br />
                <br />
                For details regarding Cloudflare, please refer to the 
                <a href="https://www.cloudflare.com/ja-jp/website-terms/" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                  Cloudflare Terms of Service
                </a>
                {' '}and{' '}
                <a href="https://www.cloudflare.com/ja-jp/privacypolicy/" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                  Cloudflare Privacy Policy
                </a>
                .
              </>
            )
          }
        ]
      },
      {
        title: 'Article 6: Procedures for Requests for Disclosure of Retained Personal Data',
        items: [
          { text: 'Users may make the following requests regarding their retained personal data held by us in accordance with applicable privacy laws:' },
          { list: [
            'Disclosure (including third-party provision records)',
            'Correction, addition, or deletion',
            'Suspension of use or third-party provision'
          ]},
          { text: 'A fee of 1,000 yen (excluding tax) per request will be charged for disclosure of personal information. Details of payment methods will be provided when the request is received. We will respond in writing or by email within 2 weeks after receiving the request. If we do not comply with the request, we will explain the reason.' }
        ]
      },
      {
        title: 'Article 7: Changes to Privacy Policy',
        items: [
          { text: 'We may change the contents of this Policy without notifying users. However, if we determine that changes will have a significant impact, we will notify or announce in advance. The revised policy takes effect when posted on this page.' }
        ]
      },
      {
        title: 'Article 8: Contact',
        items: [
          { text: 'For inquiries regarding this Policy or requests for correction or deletion of privacy information, please contact us at:' },
          { list: [
            'Contact form',
            'Email: info@lifesupporthk.com'
          ]}
        ]
      }
    ],
    lastUpdated: 'Last Updated: January 14, 2025',
    switchLanguage: '日本語版'
  }
};

export default function PrivacyPage() {
  const [language, setLanguage] = useState<'ja' | 'en'>('ja');
  const content = privacyContent[language];

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', lineHeight: '1.8' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
        {content.title}
      </h1>
      
      <div style={{ marginTop: '1rem' }}>
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

        <p style={{ marginTop: '1rem', textAlign: 'center' }}>
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
            {content.switchLanguage}
          </button>
        </p>
      </div>
    </div>
  );
}
