import puppeteer from "puppeteer";
import { createGameObject, createAllGameObjects } from "./utils.mjs";

const scrape = async (url) => {
  // Launch page and wait for game list
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);
  await page.waitForSelector(".sidearm-schedule-games-container");
  console.log("Success, the schedule is available.");

  // DATE AND TIME
  const datesAndTimes = await page.$$eval(
    ".sidearm-schedule-game-opponent-date > span",
    (options) => options.map((option) => option.textContent)
  );

  const dates = datesAndTimes.filter((date) => {
    if (date.includes("(")) {
      return date;
    }
  });

  const times = datesAndTimes.filter((time) => {
    if (time.includes("a.m.") || time.includes("p.m.")) {
      return time;
    }
  });

  // OPPONENT NAME
  const opponentNames = await page.$$eval(
    ".sidearm-schedule-game-opponent-name > a",
    (options) => options.map((option) => option.textContent)
  );

  //LOCATION
  const locations = await page.$$eval(
    ".sidearm-schedule-game-location > span",
    (options) => options.map((option) => option.textContent)
  );

  console.log(
    createAllGameObjects(
      createGameObject,
      dates,
      times,
      opponentNames,
      locations
    )
  );

  await browser.close();
};

export default scrape;
