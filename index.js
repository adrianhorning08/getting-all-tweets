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
