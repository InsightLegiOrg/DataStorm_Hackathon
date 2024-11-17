# Instructions for Texas

**The location of the github repo:** https://github.com/InsightLegiOrg/DataStorm_Hackathon/tree/texas_Jessica under the Texas folder.

**Tools:** Python

**Site I scraped:** https://statutes.capitol.texas.gov/
The preliminary steps that I had to take before running the code was downloading the most recent chrome driver extension https://googlechromelabs.github.io/chrome-for-testing/#stable and then putting it’s path within the code. 

**How does it work?**

The site that I had had many dropdown menus that enabled the program to have to click to then be able to read the html page that would contain the sections content.

My program used three iterative for loops in order to go through the dropdown menus in order to take the content as well as making sure that it was being taken in sequential order. The program then printed back the titles, chapters, and sections it was able to retrieve.

**Accomplishments:**
The program is able to read the codes, titles, chapters, and section content as it works from top to bottom of the Texas Statutes, with codes, title, chapters, and sections getting retrieved sequentially which makes it easy to then put in the JSON file. It also checks for error cases and ignores SUBTITLES. 

**Issues:**
The program is only able to read the first title, chapter, and section of every code such as EDUCATION CODE or AGRICULTURAL CODE. This is because it only can find the first one everytime the code for-loop iterates. 

It is also not read into a JSON file but instead printed in the console. 

