'use client';

import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: '廣東語音れんって何？',
      answer: 'ボタンを押すだけで発音を確認できます。ただ発音するだけでなく、学習に役立つ情報を提供します。シーンに応じた複数表現の提案や検索も可能です。入力テキストの発音（粤ピン/カタカナ）を再生して確認できます。noteと連携し、教材となるボタンがどんどん追加されていきます。'
    },
    {
      question: 'どうやって使うの？',
      answer: '画面中央の広東語ボタンを押すと発音、音声が自動で表示されます。'
    },
    {
      question: '広東語の漢字の意味・発音を調べたい時は？',
      answer: '入力欄に広東語を入れて「広東語発音」を押してください。'
    },
    {
      question: '日本語から広東語の文章・意味・発音を調べたい時は？',
      answer: '入力欄に日本語を入れて「日訳+広東語発音」を押してください。'
    },
    {
      question: 'ジャンル分けはどうやって使うの？',
      answer: '横スクロールできるカテゴリーバーから選択してください。'
    },
    {
      question: '粤ピンとは？',
      answer: '香港語言学学会粤語拼音方案、略称粤拼 (えつぴん、Jyutping)。近年香港で最も使用されている香港語言学学会（LSHK）によって制定された数字とアルファベットを用いた声調表記法です。'
    },
    {
      question: 'スラング式カタカナとは？',
      answer: '広東語未学習者、初心者の日本語話者に容易に発音できる様に制作した独自変換ルールに則った表記法です。'
    }
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>よくある質問</h1>
      <div style={{ marginTop: '2rem' }}>
        {faqs.map((faq, index) => (
          <div
            key={index}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              marginBottom: '1rem',
              overflow: 'hidden'
            }}
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              style={{
                width: '100%',
                padding: '1rem',
                textAlign: 'left',
                backgroundColor: openIndex === index ? '#f3f4f6' : 'white',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>{faq.question}</span>
              <span style={{ fontSize: '1.5rem' }}>
                {openIndex === index ? '−' : '+'}
              </span>
            </button>
            {openIndex === index && (
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: '#f9fafb',
                  borderTop: '1px solid #e5e7eb',
                  color: '#374151'
                }}
              >
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


