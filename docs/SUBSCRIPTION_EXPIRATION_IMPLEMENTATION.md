# サブスクリプション有効期限管理の実装方法

## 概要

指定した期日にユーザーを自動的にブロンズ（無料会員）に戻す機能を実装します。

## 実装手順

### 1. データベースマイグレーションの実行

`docs/subscription-expiration-migration.sql` をSupabaseのSQL Editorで実行してください。

これにより以下が追加されます：
- `subscription_expires_at` カラム（サブスクリプションの有効期限）
- 期限切れチェック用のインデックス
- 期限切れユーザーを自動的にブロンズに戻す関数

### 2. 環境変数の設定

Vercelの環境変数に以下を追加してください：

```
CRON_SECRET=your-secret-key-here  # ランダムな文字列（例: openssl rand -hex 32）
```

### 3. サブスクリプション購入時の有効期限設定

サブスクリプション購入時に有効期限を設定するAPIエンドポイントを作成します。

例：`app/api/subscription/update-expiration/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, expires_at } = body; // expires_atはISO形式の日時文字列

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: 'Supabase credentials not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // usersテーブルのsubscription_expires_atを更新
    const { error } = await supabase
      .from('users')
      .update({
        subscription_expires_at: expires_at,
        membership_type: 'subscription',
        updated_at: new Date().toISOString()
      })
      .eq('id', user_id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update subscription expiration', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

### 4. Stripe Webhookでの自動更新（推奨）

StripeのWebhookを使用して、サブスクリプション購入時に自動的に有効期限を設定することを推奨します。

例：`app/api/webhooks/stripe/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const plan = session.metadata?.plan; // 'subscription' or 'lifetime'

      if (userId && plan === 'subscription') {
        // 有効期限を設定（例：1ヶ月後）
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        // /api/subscription/update-expiration を呼び出し
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/subscription/update-expiration`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            expires_at: expiresAt.toISOString()
          })
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Webhook error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    );
  }
}
```

### 5. 動作確認

#### 手動テスト

1. SupabaseのSQL Editorで以下を実行して、期限切れユーザーを手動でダウングレードできます：

```sql
SELECT public.manual_downgrade_expired_subscriptions();
```

#### Cron Jobのテスト

1. VercelのダッシュボードでCron Jobsが正しく設定されているか確認
2. 手動でCron Jobを実行してテスト：
   ```bash
   curl -X GET "https://your-domain.com/api/cron/check-subscription-expiration" \
     -H "Authorization: Bearer your-cron-secret"
   ```

## 設定可能な期間

- **月額サブスクリプション**: 購入日から1ヶ月後
- **年額サブスクリプション**: 購入日から1年後
- **カスタム期間**: 任意の期間を設定可能

## 注意事項

1. **ゴールド会員（lifetime）**: 有効期限は設定されません（永続的）
2. **ブロンズ会員（free）**: 有効期限は設定されません
3. **シルバー会員（subscription）**: 有効期限が設定され、期限切れで自動的にブロンズに戻ります

## トラブルシューティング

### Cron Jobが実行されない場合

1. `vercel.json`が正しくデプロイされているか確認
2. VercelのダッシュボードでCron Jobsの状態を確認
3. 環境変数`CRON_SECRET`が正しく設定されているか確認

### 期限切れユーザーがダウングレードされない場合

1. `subscription_expires_at`が正しく設定されているか確認
2. タイムゾーンの問題がないか確認（UTCで保存されているか）
3. ログを確認してエラーがないか確認



