import axios, { all } from "axios";
import * as cheerio from "cheerio";
import dotenv from "dotenv";
import _ from "lodash";
import fs from 'fs';
dotenv.config();



/**
 * 
 * @returns 
 */
async function scrapeTitles() 
{
  const titleData = [] // Make an array to store the data

  try 
  {
    // Step 1: Fetch the HTML of the page
    const { data } = await axios.get('https://statutes.capitol.texas.gov/');
    
    // Step 2: Load the HTML into Cheerio
    const $ = cheerio.load(data);

    const tables = $('table');
    
    let targetTable = null;

    // Step 4: Extract links from each row in the target table
    targetTable.find('td').each((i, row) => 
    {
      const linkElement = $(row).find('a[href]');
      if (linkElement.length) 
      {
        const link = linkElement.attr('href');
        const titleName = linkElement.text();
        // Print the link (assuming relative links, update base URL accordingly)
        const fullLink = new URL(link, 'https://codes.ohio.gov/').href;

        const parts = titleName.split('|').map(part => part.trim()); // Trim spaces for each part
        const numberSplit = parts[0].split(' '); // Splits "Chapter 1" into ["Chapter", "1"]

        if(parts[1] == undefined)
        {
          numberSplit[1] = '0';
          parts[1] = parts[0];
        }
        
        titleData.push({
          titleNum: numberSplit[1],
          titleName: parts[1],
          url: fullLink,
          chapters: []
        });
      }
    });
   
  } 
  catch (error) 
  {
    console.error('Error scraping table links:', error.message);
  }

  for(const title of titleData)
  {
    await scrapeChapters(title);
  }

  fs.writeFileSync('data/ohio_another_run.json', JSON.stringify(titleData, null, 2));
}


/**
 * 
 * @returns 
 */
async function scrapeChapters(title) 
{
  const chapterData = [] // Make an array to store the data

  try
  {
    const { data } = await axios.get(title.url);

    // Step 2: Load the HTML into Cheerio
    const $ = cheerio.load(data);

    const tables = $('table');
    
    let targetTable = null;

    tables.each((i, table) => 
    {
      // If the table has a TH of 'Title' then it is the wanted table 
      if ($(table).find('th:contains("Chapter")').length > 0) 
      {
        targetTable = $(table);
      }
    });

    // All tables habe been searched and the target has not been found
    if (!targetTable) 
    {
      console.log('Could not find the target table.');
      return;
    }
    
    // Step 4: Extract links from each row in the target table
    targetTable.find('tr').each((index, row) => 
    {
      const linkElement = $(row).find('a[href]');
      if (linkElement.length) 
      {
        const link = linkElement.attr('href');
        const chapterName = linkElement.text();
        // Print the link (assuming relative links, update base URL accordingly)
        const fullLink = new URL(link, 'https://codes.ohio.gov/ohio-revised-code/').href;

        const parts = chapterName.split('|').map(part => part.trim()); // Trim spaces for each part
        const numberSplit = parts[0].split(' '); // Splits "Chapter 1" into ["Chapter", "1"]

        if(parts[1] == undefined)
        {
          numberSplit[1] = '0';
          parts[1] = parts[0];
        }

        chapterData.push({
          chapterNum: numberSplit[1],
          chapterName: parts[1],
          url: fullLink,
          sections: []
        });
      }
    });
  }
  catch (error) 
  {
    console.error('Error scraping table links:', error.message);
  }

  for(const chapter of chapterData)
  {
    await scrapeSections(chapter);
    title.chapters.push(chapter);
  }
}
 


/**
 * 
 * @returns 
 */
async function scrapeSections(chapter) 
{
  const sectionData = [] // Make an array to store the data

  try
  {
    const { data } = await axios.get(chapter.url);

    // Step 2: Load the HTML into Cheerio
    const $ = cheerio.load(data);

    const tables = $('table');
    
    let targetTable = null;

    tables.each((i, table) => 
    {
      // If the table has a TH of 'Title' then it is the wanted table 
      if ($(table).find('th:contains("Section")').length > 0) 
      {
        targetTable = $(table);
      }
    });

    // All tables habe been searched and the target has not been found
    if (!targetTable) 
    {
      console.log('Could not find the target table.');
      return;
    }
    
    // Step 4: Extract links from each row in the target table
    targetTable.find('tr').each((index, row) => 
    {
      const linkElement = $(row).find('a[href]');
      if (linkElement.length) 
      {
        const link = linkElement.attr('href');
        const sectionName = linkElement.text();
        // Print the link (assuming relative links, update base URL accordingly)
        const fullLink = new URL(link, 'https://codes.ohio.gov/ohio-revised-code/').href;

        const parts = sectionName.split('|').map(part => part.trim()); // Trim spaces for each part
        const numberSplit = parts[0].split(' '); // Splits "Chapter 1" into ["Chapter", "1"]

        if(parts[1] == undefined)
        {
          numberSplit[1] = '0';
          parts[1] = parts[0];
        }
        
        const splitName = parts[1].split('.');

        sectionData.push({
          sectionNum: numberSplit[1],
          sectionName: splitName[0],
          url: fullLink,
          text: ""
        });
      }
    });
  }
  catch (error) 
  {
    console.error('Error scraping table links:', error.message);
  }

  for(const section of sectionData)
  {
    section.text = await getText(section.url);
    chapter.sections.push(section);
    console.log(`${section.sectionNum} ${section.sectionName} text collected.`)
  }
}  


async function getText(url)
{
  try 
  {
    // Step 1: Fetch the HTML content of the page
    const { data } = await axios.get(url);

    //console.log(data);  
    // Step 2: Load the HTML into cheerio
    const $ = cheerio.load(data);

    // Step 3: Select the section with the class "laws-body"
    //onst lawsBody = $('.laws-body');

    /*if(lawsBody.length === 0) 
    {
      console.log('No section found with class "laws-body".');
      return;
    }*/

    // Step 4: Find all paragraph elements within the "laws-body" section
    const listItems = $('body').find('p').not('.center');

    const re = /Sec\. \d+\.\s+([A-Z\s;]+)\./g;
    let allParagraphText = ""; // String to hold all paragraphs
    let sectionNum = "";
    let sectionName = "";
  
    const sectionInfoArray = [];

    // Step 5: Extract and print each paragraph
    listItems.each((i, items) => {
      const paragraphText = $(items).text().trim();

      const sectionInfo = paragraphText.match(re);

      //console.log(sectionInfo);
      if(sectionInfo != null)
      {
        //console.log(sectionInfo[0]);
        const removeSectionInfo = paragraphText.replace(sectionInfo, "");
        const infoSplit = sectionInfo[0].match(/Sec\. \d+\. (.+)/);

        sectionNum = infoSplit[0].match(/Sec\. \d+\./)[0].match(/\d+/)[0];
        //console.log(sectionNum);
        sectionName = infoSplit[1].trim();
        allParagraphText += removeSectionInfo.trim() + " ";
      }      
      else
      {
        allParagraphText += paragraphText.trim() + " "; // Append each paragraph text, followed by a newline
      }
    });

    sectionInfoArray.push({
      sectionNum: sectionNum,
      sectionName: sectionName,
      text: allParagraphText
    });
    
    return sectionInfoArray;
  } 
  catch (error) 
  {
    //console.error(`Error fetching or parsing the URL: ${error.message}`);
    //console.log(url);
  }
}


const constitutionTexts = [];
let j = 0;
for(let i = 1; i < 18; i++)
{
  j = 1;
  while(j != 0)
  {
    const section = await getText(`https://statutes.capitol.texas.gov/Docs/CN/htm/CN.${i}/CN.${i}.${j}.htm`);

    //console.log(section[0]);
    if(section != undefined)
    {
      //console.log(section[0].sectionName);

      
      // FIGURE OUT WHY IT IS INDEX 0 OF THE SECTION. WHY IS IT A 2D ARRAY
      constitutionTexts.push({
        articleNum: i.toString(),
        sectionNum: section[0].sectionNum,
        sectionName: section[0].sectionName,
        text: section[0].text
      });
      j++;
    }
    else
    {
      j = 0;
    }
  }
}

//console.table(constitutionTexts);
fs.writeFileSync('data/texas_const_test.json', JSON.stringify(constitutionTexts, null, 2));


// Call the scraper function
//scrapeTitles();