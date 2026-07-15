import { NextResponse } from "next/server";

const BEARER_TOKEN = "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";

const QUERY_IDS = {
  UserTweets: "Cln4al-N167WNu43m8GrcA",
  Unretweet: "iR79N45VnCE8n6TthC5Dzg",
  DeleteTweet: "vaC6Te9Uclt49OI9_Zfb7w",
  Bookmarks: "h5vBP7W19XzC73-A3s2oWg"
};

export async function POST(req) {
  try {
    const { action, authToken, csrfToken, userId, ...params } = await req.json();

    if (!authToken || !csrfToken) {
      return NextResponse.json(
        { error: "Autenticação ausente (auth_token e ct0 são obrigatórios)." },
        { status: 400 }
      );
    }

    const cookieHeader = `auth_token=${authToken}; ct0=${csrfToken}`;
    const baseHeaders = {
      "Authorization": BEARER_TOKEN,
      "x-csrf-token": csrfToken,
      "Cookie": cookieHeader,
      "Content-Type": "application/json"
    };

    switch (action) {
      case "verify": {
        // Verifica credenciais do Twitter
        const response = await fetch("https://x.com/i/api/1.1/account/verify_credentials.json", {
          headers: baseHeaders
        });
        if (!response.ok) {
          throw new Error(`Erro na API do X (${response.status})`);
        }
        const data = await response.json();
        return NextResponse.json({
          screenName: data.screen_name,
          userId: data.id_str
        });
      }

      case "fetch_bookmarks": {
        const variables = {
          count: 100,
          features: { graphql_is_translatable_rweb_tweet_is_translatable_enabled: true }
        };
        const url = `https://x.com/i/api/graphql/${QUERY_IDS.Bookmarks}/Bookmarks?variables=${encodeURIComponent(JSON.stringify(variables))}`;
        const response = await fetch(url, { headers: baseHeaders });
        if (!response.ok) throw new Error("Erro ao buscar bookmarks");
        const data = await response.json();
        return NextResponse.json(data);
      }

      case "fetch_tweets": {
        const { cursor } = params;
        const variables = {
          userId: userId,
          count: 40,
          includePromotedContent: false,
          withQuickPromoteEligibilityDoubleSpend: true,
          withVoice: true,
          withV2Timeline: true
        };
        if (cursor) variables.cursor = cursor;

        const features = {
          rweb_tipjar_consumption_enabled: true,
          responsive_web_graphql_exclude_directive_enabled: true,
          verified_phone_label_enabled: false,
          creator_subscriptions_tweet_preview_api_enabled: true,
          responsive_web_graphql_timeline_navigation_enabled: true,
          responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
          communities_web_enable_tweet_association: true,
          tweetypie_unmention_optimization_enabled: true,
          responsive_web_edit_tweet_api_enabled: true,
          graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
          view_counts_everywhere_api_enabled: true,
          longform_notetweets_consumption_enabled: true,
          responsive_web_twitter_article_tweet_consumption_enabled: true,
          tweet_awards_web_tipping_enabled: false,
          creator_subscriptions_quote_tweet_preview_enabled: false,
          freedom_of_speech_not_reach_fetch_enabled: true,
          standardized_nudges_misinfo: true,
          tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
          rweb_video_timestamps_enabled: true,
          longform_notetweets_rich_text_read_enabled: true,
          longform_notetweets_inline_expand_respect_name_default: true,
          responsive_web_enhance_cards_and_videos_enabled: false
        };

        const url = `https://x.com/i/api/graphql/${QUERY_IDS.UserTweets}/UserTweets?variables=${encodeURIComponent(JSON.stringify(variables))}&features=${encodeURIComponent(JSON.stringify(features))}`;
        const response = await fetch(url, { headers: baseHeaders });
        if (!response.ok) throw new Error(`Erro na API do X (${response.status})`);
        const data = await response.json();
        return NextResponse.json(data);
      }

      case "unretweet": {
        const { tweetId } = params;
        const variables = { source_tweet_id: tweetId };
        const url = `https://x.com/i/api/graphql/${QUERY_IDS.Unretweet}/Unretweet`;
        const response = await fetch(url, {
          method: "POST",
          headers: baseHeaders,
          body: JSON.stringify({ variables, queryId: QUERY_IDS.Unretweet })
        });
        if (!response.ok) throw new Error("Erro ao desfazer retweet");
        const data = await response.json();
        return NextResponse.json(data);
      }

      case "delete_tweet": {
        const { tweetId } = params;
        const variables = { tweet_id: tweetId };
        const url = `https://x.com/i/api/graphql/${QUERY_IDS.DeleteTweet}/DeleteTweet`;
        const response = await fetch(url, {
          method: "POST",
          headers: baseHeaders,
          body: JSON.stringify({ variables, queryId: QUERY_IDS.DeleteTweet })
        });
        if (!response.ok) throw new Error("Erro ao excluir tweet");
        const data = await response.json();
        return NextResponse.json(data);
      }

      case "fetch_connections": {
        const { type, cursor: connCursor } = params;
        const endpoint = type === "following" ? "friends/list.json" : "followers/list.json";
        const cursorParam = connCursor ? `&cursor=${connCursor}` : "";
        const url = `https://x.com/i/api/1.1/${endpoint}?count=200${cursorParam}`;
        const response = await fetch(url, { headers: baseHeaders });
        if (!response.ok) throw new Error(`Erro ao buscar conexões (${response.status})`);
        const data = await response.json();
        return NextResponse.json(data);
      }

      case "connection_action": {
        const { type, targetScreenName } = params;
        const endpoint = type === "unfollow" ? "friendships/destroy.json" : "friendships/create.json";
        const url = `https://x.com/i/api/1.1/${endpoint}`;
        
        const postHeaders = {
          ...baseHeaders,
          "Content-Type": "application/x-www-form-urlencoded"
        };
        const body = new URLSearchParams();
        body.append("screen_name", targetScreenName);

        const response = await fetch(url, {
          method: "POST",
          headers: postHeaders,
          body: body.toString()
        });

        if (!response.ok) throw new Error(`Erro ao gerenciar amizade (${response.status})`);
        const data = await response.json();
        return NextResponse.json(data);
      }

      default:
        return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
    }
  } catch (err) {
    console.error("Erro no proxy de API do Twitter/X:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
