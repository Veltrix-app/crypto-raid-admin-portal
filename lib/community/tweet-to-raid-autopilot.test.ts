import test from "node:test";
import assert from "node:assert/strict";
import {
  buildManualTweetToRaidPost,
  normalizeTweetToRaidUsername,
  parseTweetToRaidHashtags,
  parseTweetToRaidPostUrl,
} from "./tweet-to-raid-autopilot";

test("normalizeTweetToRaidUsername strips at signs and lowercases handles", () => {
  assert.equal(normalizeTweetToRaidUsername("  @@VYNTRO_App  "), "vyntro_app");
});

test("parseTweetToRaidHashtags accepts comma, space and hash formats", () => {
  assert.deepEqual(
    parseTweetToRaidHashtags(" #VYNTRO, Raid  #VYNTRO  launch_day "),
    ["vyntro", "raid", "launch_day"]
  );
});

test("parseTweetToRaidPostUrl extracts usernames and post ids from X urls", () => {
  assert.deepEqual(parseTweetToRaidPostUrl("https://x.com/Vyntro/status/12345?s=20"), {
    postId: "12345",
    username: "vyntro",
    url: "https://x.com/Vyntro/status/12345?s=20",
  });
  assert.deepEqual(parseTweetToRaidPostUrl("https://twitter.com/Vyntro_App/status/98765"), {
    postId: "98765",
    username: "vyntro_app",
    url: "https://twitter.com/Vyntro_App/status/98765",
  });
});

test("buildManualTweetToRaidPost turns portal input into the bot job post shape", () => {
  assert.deepEqual(
    buildManualTweetToRaidPost({
      tweetUrl: "https://x.com/Vyntro/status/12345?s=20",
      fallbackUsername: "@fallback",
      text: "Launch raid is live #VYNTRO",
      mediaUrlsText: "https://cdn.example.com/a.png\nhttps://cdn.example.com/b.png",
    }),
    {
      id: "12345",
      username: "vyntro",
      text: "Launch raid is live #VYNTRO",
      url: "https://x.com/Vyntro/status/12345?s=20",
      mediaUrls: ["https://cdn.example.com/a.png", "https://cdn.example.com/b.png"],
      isReply: false,
      isRepost: false,
    }
  );
});
