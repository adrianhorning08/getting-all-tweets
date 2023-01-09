import fetch from "node-fetch";
import fs from "graceful-fs";
import {
  createCSV,
  emailMyself,
  insertBatchIntoFirestore,
  insertIntoFirestore,
  loopFromOneDateToAnother,
  sleep,
} from "./utils.js";
import axios from "axios";
import AWS from "aws-sdk";
import dotenv from "dotenv";
dotenv.config();

// configure AWS
AWS.config.update({
  region: "us-west-2",
  accessKeyId: process.env.accessKeyId,
  secretAccessKey: process.env.secretAccessKey,
});

async function getUserInfo(handle) {
  const res = await fetch(
    "https://api.twitter.com/graphql/tgMiZwwhWR2sI0KsNsExrA/UserByScreenName?variables=%7B%22screen_name%22%3A%22thesamparr%22%2C%22withSafetyModeUserFields%22%3Atrue%2C%22withSuperFollowsUserFields%22%3Atrue%7D&features=%7B%22responsive_web_twitter_blue_verified_badge_is_enabled%22%3Atrue%2C%22verified_phone_label_enabled%22%3Afalse%2C%22responsive_web_twitter_blue_new_verification_copy_is_enabled%22%3Atrue%2C%22responsive_web_graphql_timeline_navigation_enabled%22%3Atrue%7D",
    {
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en-CA;q=0.9,en-AU;q=0.8,en;q=0.7",
        authorization:
          "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs=1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
        "content-type": "application/json",
        "sec-ch-ua":
          '"Not?A_Brand";v="8", "Chromium";v="108", "Google Chrome";v="108"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "x-twitter-active-user": "yes",
        "x-twitter-auth-type": "OAuth2Session",
        "x-twitter-client-language": "en",
        Referer: "https://twitter.com/",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
      body: null,
      method: "GET",
    }
  );
  const data = await res.json();
  console.log(data.data.user.result);
}

function getTheCursor(response) {
  try {
    const entiresThing = findEntriesThing(response);
    const entryLength = entiresThing.entries.length;
    const lastEntry = entiresThing.entries[entryLength - 1];
    const cursor = lastEntry.content;
    return cursor.value;
  } catch (error) {
    console.log("get at getTheCursor", error.message);
  }
}

function getTheTweetData(tweet) {
  const tweetResult = tweet?.content?.itemContent?.tweet_results?.result;
  const isRetweet = Boolean(tweetResult?.legacy?.retweeted_status_result); // retweeted
  if (!tweetResult) {
    return {};
  }
  const id = tweetResult?.rest_id;
  const date = tweetResult?.legacy?.created_at;
  const text = tweetResult?.legacy?.full_text;
  return {
    id,
    isRetweet,
    text,
    date,
    url: `https://twitter.com/blackflaghag/statuses/${id}`,
  };
}

function getActualTweets(response) {
  try {
    const entiresThing = findEntriesThing(response);
    return entiresThing.entries;
  } catch (error) {
    console.log("get at getActualTweets", error.message);
  }
}

function findEntriesThing(response) {
  try {
    return response.data.user.result.timeline_v2.timeline.instructions.find(
      (d) => d.type === "TimelineAddEntries"
    );
  } catch (error) {
    console.log("get at findEntriesThing", error.message);
  }
}

async function getTweets(handle, from, to, cursor) {
  try {
    const res = await axios({
      method: "post",
      url: "your-api",
      data: {
        handle,
        from,
        to,
        cursor,
      },
    });
    return res.data;
  } catch (error) {
    console.log("error at getTweets: ", error.message);
  }
}

async function updateLambdaFunctionAndSleep() {
  const lambda = new AWS.Lambda();
  console.log("updating the lambda function");
  await lambda
    .updateFunctionConfiguration({
      FunctionName: "twitter-search-api",
      Environment: {
        Variables: {},
      },
    })
    .promise();
  console.log("updated the lambda function successfully");
  console.log("sleeping for 1 second");
  await sleep(1000);
  console.log("sleeping done");
}

(async function () {
  try {
    const handle = "adrian_horning_";
    const allTweets = {};
    const dates = loopFromOneDateToAnother();
    console.log("dates: ", dates[0], dates[dates.length - 1]);

    for (let i = 0; i < dates.length; i++) {
      await updateLambdaFunctionAndSleep();

      const date = dates[i];
      console.log("date: ", date);
      const from = date?.from;
      const to = date?.to;

      try {
        let res = await getTweets(handle, from, to);
        let tweets = res?.tweets;
        console.log("tweets: ", Object.keys(tweets).length);
        // tweets is an object with keys as tweet ids
        // add the tweets to the allTweets object
        Object.keys(tweets).forEach((tweetId) => {
          allTweets[tweetId] = tweets[tweetId];
        });
        const dataTweets = Object.values(tweets);
        await Promise.all(
          dataTweets.map((tweet) => insertIntoFirestore(tweet, "tweets"))
        );
      } catch (error) {
        console.log("error at getTweets: ", error.message);
      }
    }

    // const allTweetsArr = Object.values(allTweets);

    // insert the tweets into the database in batches of 25
    // const batchSize = 25;
    // const batches = [];
    // for (let i = 0; i < allTweetsArr.length; i += batchSize) {
    //   console.log("pushing batch: ", i);
    //   batches.push(allTweetsArr.slice(i, i + batchSize));
    // }

    // for (let i = 0; i < batches.length; i++) {
    //   const batch = batches[i];
    //   console.log("inserting batch: ", i);
    //   await insertBatchIntoFirestore(batch, "tweets");
    // }
    return;
  } catch (error) {
    console.log("error at run ", error.message);
  }
})();
