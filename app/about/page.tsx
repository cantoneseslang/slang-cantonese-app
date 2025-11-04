'use client';

import { useEffect, useState } from 'react';
import categoriesData from '@/data/categories.json';

export default function AboutPage() {
  const [totalButtons, setTotalButtons] = useState<number>(0);

  useEffect(() => {
    // カテゴリーデータから全ボタン数を計算
    let count = 0;
    if (Array.isArray(categoriesData)) {
      categoriesData.forEach((category: any) => {
        if (category.words && Array.isArray(category.words)) {
          count += category.words.length;
        }
        if (category.practiceGroups && Array.isArray(category.practiceGroups)) {
          category.practiceGroups.forEach((group: any) => {
            if (group.words && Array.isArray(group.words)) {
              count += group.words.length;
            }
          });
        }
      });
    }
    setTotalButtons(count);
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>カントン語音れんって何？</h1>
      
      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          ボタンを押すだけで発音を確認できます
        </h2>
        <ul style={{ listStyle: 'disc', paddingLeft: '2rem', marginBottom: '2rem' }}>
          <li>ただ発音するだけでなく、学習に役立つ情報を提供します</li>
          <li>シーンに応じた複数表現の提案や検索も可能です</li>
          <li>入力テキストの発音（粤ピン/カタカナ）を再生して確認できます</li>
          <li>noteと連携し、教材となるボタンがどんどん追加されていきます</li>
        </ul>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          ようこそ！
        </h2>
        <p style={{ marginBottom: '1rem' }}>
          広東語初心の方へ！ようこそスラング式カントン語音れんへ！
        </p>
        <p style={{ marginBottom: '1rem' }}>
          スラング先生考案!カントン語音れん☝️（全{totalButtons}ボタン）収録！
        </p>
        <p style={{ marginBottom: '1rem' }}>
          画面中央の広東語ボタンを押すと発音、音声が自動で表示されます
        </p>
        <p style={{ marginBottom: '1rem' }}>
          広東語の漢字の意味・発音を調べたい時は入力欄に広東語を入れて「広東語発音」を押してください
        </p>
        <p style={{ marginBottom: '1rem' }}>
          日本語から広東語の文章・意味・発音を調べたい時は入力欄に日本語を入れて「日訳+広東語発音」を押してください
        </p>
        <p style={{ marginBottom: '1rem' }}>
          ジャンル分け(トータル{categoriesData && Array.isArray(categoriesData) ? categoriesData.length : 0}ジャンル収録)は右側で押して切り替えを行なってください
        </p>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          粤ピンとは
        </h2>
        <p style={{ marginBottom: '1rem' }}>
          香港語言学学会粤語拼音方案、略称粤拼 (えつぴん、Jyutping)。近年香港で最も使用されている香港語言学学会（LSHK）によって制定された数字とアルファベットを用いた声調表記法です。
        </p>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          スラング式カタカナとは
        </h2>
        <p style={{ marginBottom: '1rem' }}>
          広東語未学習者、初心者の日本語話者に容易に発音できる様に制作した独自変換ルールに則った表記法です。
        </p>
        <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
          スラング式カタカナ変換表必要な方はページ最下部のリンクよりダウンロードください(商用/転載は禁止としております)
        </p>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          注意事項
        </h2>
        <ul style={{ listStyle: 'disc', paddingLeft: '2rem' }}>
          <li>多音時の場合、複数声調およびカタカナに()が表示されます。</li>
          <li>変調は考慮されていない発音記号が表示されます。</li>
          <li>広東語特有の表現でgoogle翻訳が正確でない場合があります。</li>
        </ul>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
        <p style={{ fontSize: '0.875rem', color: '#374151' }}>
          この文書に記載されている繁体字は、国際標準の『ISO/IEC 10646-1:2000』および『香港補助文字セット – 2001』（Hong Kong Supplementary Character Set – 2001）に含まれる全ての漢字、合計29,145個を含んでいます。
        </p>
      </div>
    </div>
  );
}

