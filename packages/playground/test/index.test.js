const { toMatchImageSnapshot } = require("jest-image-snapshot");
const { sampleNames } =  require("../src/samples");
const { themeNames } = require("../src/themes");
expect.extend({ toMatchImageSnapshot });

const url = "http://localhost:8080";

describe("test", () => {
  beforeAll(async () => {
    await page.goto(url);
    await page.setViewport({ width: 1280, height: 1280 });
  });

  it("full page", async () => {
    const image = await page.screenshot({ fullPage: true });
    expect(image).toMatchImageSnapshot();
  });
  
  async function sampleTest(themeName, sampleName) {
    const tab = await page.$x(`//a[contains(text(), '${sampleName}')]`);
    await tab[0].click();
    await page.select("#rjsf_themeSelector", themeName);
    const frame = await page.$("iframe");
    const image = await page.screenshot({
      clip: await frame.boundingBox()
    });
    expect(image).toMatchImageSnapshot();
  }

  for (let themeName of themeNames) {
    for (let sampleName of sampleNames) {
      it(`${themeName} ${sampleName}`, async () => {
        await sampleTest(themeName, sampleName);
      });
    }
  }
});

