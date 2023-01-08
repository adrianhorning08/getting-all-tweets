import fetch from "node-fetch";

async function fetchSearch(handle, from, to, cursor) {
  // until:2022-03-14 since:2022-03-04
  // since === from
  // until === to
  try {
    let url = `https://api.twitter.com/2/search/adaptive.json?include_profile_interstitial_type=1&include_blocking=1&include_blocked_by=1&include_followed_by=1&include_want_retweets=1&include_mute_edge=1&include_can_dm=1&include_can_media_tag=1&include_ext_has_nft_avatar=1&include_ext_is_blue_verified=1&include_ext_verified_type=1&skip_status=1&cards_platform=Web-12&include_cards=1&include_ext_alt_text=true&include_ext_limited_action_results=false&include_quote_count=true&include_reply_count=1&tweet_mode=extended&include_ext_collab_control=true&include_entities=true&include_user_entities=true&include_ext_media_color=true&include_ext_media_availability=true&include_ext_sensitive_media_warning=true&include_ext_trusted_friends_metadata=true&send_error_codes=true&simple_quoted_tweet=true&q=(from%3A${handle})%20until%3A${to}%20since%3A${from}&count=20&query_source=typed_query&pc=1&spelling_corrections=1&include_ext_edit_control=true&ext=mediaStats%2ChighlightedLabel%2ChasNftAvatar%2CvoiceInfo%2CbirdwatchPivot%2Cenrichments%2CsuperFollowMetadata%2CunmentionInfo%2CeditControl%2Ccollab_control%2Cvibe`;
    if (cursor) {
      url = url + `${url}&cursor=${cursor}`;
    }
    const res = await fetch(url, {
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en-CA;q=0.9,en-AU;q=0.8,en;q=0.7",
        authorization:
          "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
        "sec-ch-ua":
          '"Not?A_Brand";v="8", "Chromium";v="108", "Google Chrome";v="108"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "x-csrf-token":
          "ea397805968139f050c08884544c3b9743367d1a37bad77d36824d640e38ed9403f987fce5c43ae064f2fd40ec8db03b0a87d82426c099ca809964d4226fbb20debb46f0c389c98e5740a758a7f17d95",
        "x-twitter-active-user": "yes",
        "x-twitter-auth-type": "OAuth2Session",
        "x-twitter-client-language": "en",
        cookie:
          'guest_id=v1%3A166803171024129386; kdt=ZP5XlOfEjDdHaNLUvRHqcvJAtgXfwdtvxHoggj7a; twid=u%3D4520241209; d_prefs=MjoxLGNvbnNlbnRfdmVyc2lvbjoyLHRleHRfdmVyc2lvbjoxMDAw; des_opt_in=Y; auth_token=3425af932477ea053d33eca4a2cfcbece2df3672; ct0=ea397805968139f050c08884544c3b9743367d1a37bad77d36824d640e38ed9403f987fce5c43ae064f2fd40ec8db03b0a87d82426c099ca809964d4226fbb20debb46f0c389c98e5740a758a7f17d95; guest_id_marketing=v1%3A166803171024129386; guest_id_ads=v1%3A166803171024129386; personalization_id="v1_HgaX+N1Gkx2dLIUvZNoZsA=="',
        Referer: "https://twitter.com/",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
      body: null,
      method: "GET",
    });
    const data = await res.json();
    return data;
  } catch (error) {
    console.log("error at fetchSearch", error.message);
  }
}

function getBottomCursor(data) {
  const bottomOne =
    data?.timeline?.instructions?.[0]?.addEntries?.entries?.find((b) => {
      return b?.content?.operation?.cursor?.cursorType === "Bottom";
    });
  return bottomOne?.content?.operation?.cursor?.value;
}

export const handler = async (event, context) => {
  try {
    const body = JSON.parse(event.body);
    const handle = body.handle;
    const from = body.from;
    const to = body.to;

    // format: YYYY-MM-DD
    // const data = await fetchSearch("blackflaghag", "2021-01-01", "2021-02-01");
    const data = await fetchSearch(handle, from, to);
    const tweets = data?.globalObjects?.tweets;
    const cursor = getBottomCursor(data);
    console.log("cursor", cursor);
    return {
      statusCode: 200,
      body: JSON.stringify({ tweets, cursor }),
    };
  } catch (error) {
    console.log("error at handler", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify(error.message),
    };
  }
};
