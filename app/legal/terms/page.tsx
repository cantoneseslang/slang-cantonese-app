'use client';

import { useState } from 'react';

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
          { label: '4.3 決済処理:', text: '決済は第三者プロバイダを通じて行われ、当社はクレジットカード情報等の全情報を保存しません。' },
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
    lastUpdated: '最終改定日: 2025年1月14日',
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
          { label: '4.3 Payment Processing:', text: 'Payments are processed through third-party providers, and we do not store any credit card information.' },
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
    lastUpdated: 'Last Updated: January 14, 2025',
    switchLanguage: '日本語版'
  }
};

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
          { text: '当社サービスでは、有料サービスの利用料金等の請求および決済を第三者決済プロバイダ（Stripe）に委託しています。当該処理に伴うプライバシー情報の取り扱い等については、各決済プロバイダが定める顧客利用規約およびプライバシーポリシーが適用されます。' }
        ]
      },
      {
        title: '第5条の2（アクセス解析サービスの利用）',
        items: [
          { text: '当社サービスでは、アクセス状況を解析するために、各種アクセス解析サービス（Cloudflare）を利用することがあります。これらのサービスでは、アクセス回数や滞在時間、利用環境等のデータを収集・分析するために、Cookieなどデバイスに記録されている識別子や、Webビーコン、IPアドレスなどを利用することがあります。データは匿名で収集されており、個人を特定するものではありません。' }
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
    lastUpdated: '最終改定日: 2025年10月31日',
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
          { text: 'Our Service entrusts billing and payment processing for paid services to third-party payment providers (Stripe). The handling of privacy information in connection with such processing is subject to the terms of service and privacy policies established by each payment provider.' }
        ]
      },
      {
        title: 'Article 5-2: Use of Access Analysis Services',
        items: [
          { text: 'Our Service may use various access analysis services (Cloudflare) to analyze access status. These services may use identifiers recorded on devices such as cookies, web beacons, IP addresses, etc., to collect and analyze data such as access counts, stay times, and usage environment. Data is collected anonymously and does not identify individuals.' }
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
    lastUpdated: 'Last Updated: October 31, 2025',
    switchLanguage: '日本語版'
  }
};

const tokushoContent = {
  ja: {
    title: '特定商取引法に基づく表示',
    content: [
      { list: [
        '事業者名：LIFESUPPORT(HK)LIMITED',
        '所在地：Hong Kong',
        'お問い合わせ：info@lifesupporthk.com',
        '販売価格・支払方法：各プランの案内ページに記載',
        '役務の提供時期：決済完了後ただちに利用可能',
        '返品・キャンセル：デジタルサービスの性質上、原則不可'
      ]}
    ]
  },
  en: {
    title: 'Specified Commercial Transactions Act',
    content: [
      { list: [
        'Business name: LIFESUPPORT(HK)LIMITED',
        'Location: Hong Kong',
        'Contact: info@lifesupporthk.com',
        'Sales price and payment method: As stated on each plan\'s information page',
        'Service provision period: Available immediately after payment completion',
        'Returns and cancellations: Generally not possible due to the nature of digital services'
      ]}
    ]
  }
};

export default function TermsPage() {
  const [language, setLanguage] = useState<'ja' | 'en'>('ja');
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'tokusho'>('terms');

  const terms = termsContent[language];
  const privacy = privacyContent[language];
  const tokusho = tokushoContent[language];

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', lineHeight: '1.8' }}>
      {/* タブ切り替えボタン */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '2rem',
        borderBottom: '2px solid #e5e7eb',
        paddingBottom: '0.5rem'
      }}>
        <button
          onClick={() => setActiveTab('terms')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: activeTab === 'terms' ? 'white' : 'transparent',
            color: activeTab === 'terms' ? '#1f2937' : '#6b7280',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: activeTab === 'terms' ? '600' : '400',
            borderBottom: activeTab === 'terms' ? '2px solid #3b82f6' : 'none',
            marginBottom: activeTab === 'terms' ? '-2px' : '0'
          }}
        >
          利用規約
        </button>
        <button
          onClick={() => setActiveTab('privacy')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: activeTab === 'privacy' ? 'white' : 'transparent',
            color: activeTab === 'privacy' ? '#1f2937' : '#6b7280',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: activeTab === 'privacy' ? '600' : '400',
            borderBottom: activeTab === 'privacy' ? '2px solid #3b82f6' : 'none',
            marginBottom: activeTab === 'privacy' ? '-2px' : '0'
          }}
        >
          プライバシー
        </button>
        <button
          onClick={() => setActiveTab('tokusho')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: activeTab === 'tokusho' ? 'white' : 'transparent',
            color: activeTab === 'tokusho' ? '#1f2937' : '#6b7280',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: activeTab === 'tokusho' ? '600' : '400',
            borderBottom: activeTab === 'tokusho' ? '2px solid #3b82f6' : 'none',
            marginBottom: activeTab === 'tokusho' ? '-2px' : '0'
          }}
        >
          特商法表記
        </button>
      </div>

      {/* コンテンツ表示 */}
      <div style={{ marginTop: '1rem' }}>
        {activeTab === 'terms' && (
          <>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
              {terms.title}
            </h1>
            <p style={{ marginBottom: '2rem' }}>
              {terms.intro}
            </p>

            {terms.sections.map((section, sectionIndex) => (
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
                      <p style={{ marginBottom: 'label' in item && item.label ? '0.5rem' : '1rem' }}>
                        {'label' in item && item.label && <strong>{item.label} </strong>}
                        {'text' in item && item.text}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ))}

            <p style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb', fontSize: '0.875rem', color: '#6b7280' }}>
              {terms.lastUpdated}
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
                {terms.switchLanguage}
              </button>
            </p>
          </>
        )}

        {activeTab === 'privacy' && (
          <>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
              {privacy.title}
            </h1>
            <p style={{ marginBottom: '2rem' }}>
              {privacy.intro}
            </p>

            {privacy.sections.map((section, sectionIndex) => (
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
                      <p style={{ marginBottom: 'label' in item && item.label ? '0.5rem' : '1rem' }}>
                        {'label' in item && item.label && <strong>{item.label} </strong>}
                        {'text' in item && typeof item.text === 'string' ? item.text : ''}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ))}

            <p style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb', fontSize: '0.875rem', color: '#6b7280' }}>
              {privacy.lastUpdated}
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
                {privacy.switchLanguage}
              </button>
            </p>
          </>
        )}

        {activeTab === 'tokusho' && (
          <>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
              {tokusho.title}
            </h1>
            {tokusho.content.map((item, itemIndex) => (
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
                  <p style={{ marginBottom: '1rem' }}>
                    {'text' in item && typeof item.text === 'string' ? item.text : ''}
                  </p>
                )}
              </div>
            ))}
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
                {language === 'ja' ? 'English' : '日本語版'}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
