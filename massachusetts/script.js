const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs/promises");
const puppeteer = require("puppeteer");

// Base URL of the website
const baseUrl = "https://malegislature.gov";

// Target URL (main page)
const targetUrl = `${baseUrl}/Laws/GeneralLaws`;

async function saveToFile(filename, data) {
  try {
    await fs.writeFile(filename, JSON.stringify(data, null, 2));
    console.log(`Data successfully saved to ${filename}`);
  } catch (error) {
    console.error(`Error saving data to ${filename}:`, error.message);
  }
}

async function fetchParts() {
  try {
    console.log(`Fetching content from: ${targetUrl}`);
    const response = await axios.get(targetUrl);
    const $ = cheerio.load(response.data);

    const parts = [];
    $("ul.generalLawsList > li > a").each((index, element) => {
      const href = $(element).attr("href");
      const partTitle = $(element).find("span.partTitle").text().trim();

      if (href) {
        const fullUrl = href.startsWith("/") ? `${baseUrl}${href}` : href;
        parts.push({
          url: fullUrl,
          title: partTitle,
        });
      }
    });

    console.log("Extracted Parts:");
    console.log(parts);

    const allTitles = [];
    for (const part of parts) {
      const titles = await fetchTitleInfo(part.url);
      allTitles.push(...titles);
    }

    // Save titles to title.json
    await saveToFile("title.json", allTitles);

    // Fetch chapters for all titles
    const allChapters = await fetchChapters(allTitles);

    // Save chapters to chapter.json
    await saveToFile("chapter.json", allChapters);

    // Fetch chapters for all titles
    const allSections = await fetchSections(allChapters);

    // Save sections to sections.json
    await saveToFile("section.json", allSections);


  } catch (error) {
    console.error("Error fetching or processing parts:", error.message);
  }
}

async function fetchTitleInfo(partUrl) {
  try {
    console.log(`Fetching title information from: ${partUrl}`);
    const response = await axios.get(partUrl);

    const $ = cheerio.load(response.data);
    const partMatch = partUrl.match(/Part([IVX]+)/i);
    const partNumber = partMatch ? partMatch[1] : null;

    if (!partNumber) {
      console.error(`Unable to extract part number from URL: ${partUrl}`);
      return [];
    }

    const titles = [];
    $("#accordion .panel").each((index, panel) => {
      const displayName = $(panel).find(".glTitle.panel-title a").first().text().trim();
      const titleNumber = $(panel).find(".glTitle.panel-title a").first().text().trim().replace("Title ", "").trim();
      const description = $(panel).find(".panel-title").eq(1).text().trim();

      const correctUrl = `https://malegislature.gov/Laws/GeneralLaws/Part${partNumber}/Title${titleNumber}`;
      titles.push({
        display_name: displayName,
        title_number: titleNumber,
        description: description,
        url: correctUrl,
      });
    });

    console.log("Extracted Titles:");
    console.log(titles);
    return titles;
  } catch (error) {
    console.error(`Error fetching title information from ${partUrl}:`, error.message);
    return [];
  }
}

async function fetchChapters(titles) {
    try {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
  
      const allChapters = []; 
  
      for (const title of titles) {
        const { url: titleUrl, display_name: titleName, description: titleDescription } = title;
        console.log(`Fetching chapters from: ${titleUrl}`);
  
        await page.goto(titleUrl, { waitUntil: "networkidle2" });

        await page.waitForSelector("ul.generalLawsList");
  
        const chapters = await page.evaluate(() => {
          const chapterElements = document.querySelectorAll("ul.generalLawsList > li > a");
          const chapters = [];
          chapterElements.forEach((element) => {
            const chapterUrl = element.href;
            const displayname = element.querySelector("span.chapter")?.textContent.trim();
            const chapterNumber = element.querySelector("span.chapter")?.textContent.trim().replace("Chapter ", "");
            const chapterTitle = element.querySelector("span.chapterTitle")?.textContent.trim();
            chapters.push({
              display_name: displayname,
              chapter_number: chapterNumber,
              //chapter_title: chapterTitle,
              chapter_url: chapterUrl,
            });
          });
          return chapters;
        });
        chapters.forEach((chapter) => {
          allChapters.push({
            ...chapter
          });
        });
      }
  
      await browser.close();
      console.log("Extracted Chapters:");
      console.log(allChapters);
  
      return allChapters;
    } catch (error) {
      console.error("Error fetching chapters with Puppeteer:", error.message);
    }
  }
  


  async function fetchSections(chapters, concurrency = 10) {
    const browser = await puppeteer.launch({ headless: true });
    const allSections = {};
    const chapterQueue = [...chapters]; // Clone chapters array for processing
  
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms)); // Delay to prevent overload
  
    const processChapter = async (chapter) => {
      const page = await browser.newPage();
      try {
        const { chapter_url: chapterUrl, chapter_number: chapterNumber } = chapter;
        console.log(`Fetching sections from: ${chapterUrl}`);
  
        await page.goto(chapterUrl, { waitUntil: "networkidle2" });
        await page.waitForSelector("ul.generalLawsList");
  
        // Fetch section metadata
        const sections = await page.evaluate(() => {
          const sectionElements = document.querySelectorAll("ul.generalLawsList > li > a");
          const sections = [];
          sectionElements.forEach((element) => {
            const sectionUrl = element.href;
            const sectionNumber = element.querySelector("span.section")?.textContent.trim().replace("Section ", "");
            const sectionTitle = element.querySelector("span.sectionTitle")?.textContent.trim();
            sections.push({
              display_name: `Section ${sectionNumber}`,
              section_number: sectionNumber,
              section_title: sectionTitle,
              url: sectionUrl,
            });
          });
          return sections;
        });
  
        // Fetch content for each section
        for (const section of sections) {
          try {
            console.log(`Fetching content for Section ${section.section_number}: ${section.url}`);
            await page.goto(section.url, { waitUntil: "networkidle2" });
  
            // Wait for content element to load
            await page.waitForSelector("p", { timeout: 30000 });
  
            // Extract content
            const content = await page.evaluate(() => {
            const paragraphs = Array.from(document.querySelectorAll("p"));

              const contentElement = paragraphs.find(p => p.textContent.trim().startsWith("Section"));
              
              return contentElement ? contentElement.textContent.trim() : "Content not available";
            });
  
            // Add content to the section
            section.content = content;
            console.log(`Extracted content for Section ${section.section_number}`);
          } catch (error) {
            console.error(`Error fetching content for Section ${section.section_number}:`, error.message);
            section.content = "Failed to fetch content";
          }
  
          // Add section to allSections
          const sectionId = `chapter${chapterNumber}_section${section.section_number}`;
          allSections[sectionId] = section;
  
          await delay(2000); 
        }
      } catch (error) {
        console.error(`Error processing chapter at ${chapter.chapter_url}:`, error.message);
      } finally {
        await page.close();
      }
    };
  
    // Run multiple pages in parallel
    const workers = Array.from({ length: concurrency }).map(async () => {
      while (chapterQueue.length > 0) {
        const chapter = chapterQueue.shift();
        if (chapter) {
          await processChapter(chapter);
        }
      }
    });
  
    await Promise.all(workers); // Wait for all workers to complete
    await browser.close();
  
    return { sections: allSections };
  }
  

fetchParts();
