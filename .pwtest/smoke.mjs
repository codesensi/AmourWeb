import { chromium } from "playwright-core";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const BASE = "http://localhost:8848";
const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} | ${name} | ${detail}`);
}

const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const page = await browser.newPage();
page.setDefaultTimeout(15000);
const errors = [];
page.on("pageerror", e => errors.push(String(e).slice(0, 150)));

try {
  await page.goto(`${BASE}/#/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  check("未登录访问 / 停留在门户首页", !page.url().includes("login"), page.url());

  const logo = await page.locator(".alogo").first().innerText();
  const slogan = await page.locator(".wenan").first().innerText();
  check("头部注入站点名", logo.includes("爱慕情侣小站"), logo);
  check("头部注入 slogan", slogan.includes("爱晨雾漫过青瓦"), slogan.slice(0, 15));

  const timerText = await page.locator(".time").first().innerText();
  check(
    "恋爱计时器渲染(天/时/分/秒)",
    timerText.includes("这是我们一起走过的") &&
      /天/.test(timerText) &&
      /时/.test(timerText) &&
      /分/.test(timerText) &&
      /秒/.test(timerText),
    timerText.replace(/\n/g, " ")
  );

  const cardCount = await page.locator(".card-wrap .row a").count();
  check("首页 5 张功能卡片", cardCount === 5, `count=${cardCount}`);

  await page.locator(".card-wrap .row a").first().click();
  await page.waitForURL(/#\/little$/, { timeout: 15000 });
  check("点击卡片跳转 /little", true, page.url());

  await page.goto(`${BASE}/#/admin`, { waitUntil: "domcontentloaded" });
  await page.waitForURL(/#\/login/, { timeout: 15000 });
  await page.getByPlaceholder("账号").fill("admin");
  await page.getByPlaceholder("密码").fill("admin123");
  await page.getByPlaceholder("验证码").fill("1234");
  await page.getByRole("button", { name: /登\s*录/ }).click();
  await page.waitForURL(/#\/admin\/welcome/, { timeout: 15000 });
  check("管理端登录后落在 /admin/welcome", true, page.url());
  const bodyText = await page.locator("body").innerText();
  check("管理端页面结构完整", bodyText.includes("系统管理"), "");

  await page.goto(`${BASE}/#/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  check("回到门户首页外壳仍可用", page.url().includes("#/") && !page.url().includes("#/login"), page.url());
  check("全程零 pageErrors", errors.length === 0, errors.join(" ; "));
} catch (e) {
  check("异常中断", false, String(e).slice(0, 300));
} finally {
  await browser.close();
  const pass = results.filter(r => r.ok).length;
  console.log(`\nSUMMARY: ${pass}/${results.length} passed`);
  process.exit(pass === results.length ? 0 : 1);
}
