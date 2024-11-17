#!/usr/bin/env python
# coding: utf-8

# In[3]:


import os
import json
import time
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup
from tqdm import tqdm

# Constants
BASE_URL = "https://codes.ohio.gov"
OUTPUT_DIR = "data/ohio"
RATE_LIMIT = 1  # seconds between requests

# Create output directory
os.makedirs(OUTPUT_DIR, exist_ok=True)

def fetch_url(url):
    """Fetches a URL with error handling and rate limiting."""
    try:
        response = requests.get(url)
        response.raise_for_status()
        time.sleep(RATE_LIMIT)
        return response.text
    except requests.RequestException as e:
        print(f"Error fetching {url}: {e}")
        return None

def parse_titles():
    """Scrape all titles from the main page."""
    url = f"{BASE_URL}/ohio-revised-code"
    html = fetch_url(url)
    if not html:
        return {}

    soup = BeautifulSoup(html, "html.parser")
    titles = {}

    for row in soup.select("table.laws-table tr")[1:]:  # Skip header
        link = row.find("a")
        if link:
            title_id = link["href"].split("/")[-1]
            titles[title_id] = {
                "display_name": link.text.strip(),
                "url": urljoin(BASE_URL, link["href"]),
                "chapters": []
            }
    return titles

def parse_chapters(title):
    """Scrape all chapters under a given title."""
    html = fetch_url(title["url"])
    if not html:
        return []

    soup = BeautifulSoup(html, "html.parser")
    chapters = []

    for row in soup.select("table.laws-table tr")[1:]:  # Skip header row
        link = row.find("a")
        if link:
            # Construct the correct chapter URL
            chapter_id = link["href"].split("/")[-1]  # Extract the chapter identifier
            chapter_url = f"{BASE_URL}/ohio-revised-code/{chapter_id}"  # Correct format
            chapters.append({
                "display_name": link.text.strip(),
                "url": chapter_url,
                "sections": []
            })
    return chapters

def parse_sections(chapter):
    """Scrape all sections under a given chapter."""
    html = fetch_url(chapter["url"])
    if not html:
        return []

    soup = BeautifulSoup(html, "html.parser")
    sections = []

    for row in soup.select("table.laws-table tr")[1:]:  # Skip header
        link = row.find("a")
        if link:
            last_updated = None
            # Extract last updated date if available
            date_elem = soup.find("p", string=lambda s: "Last updated" in s if s else False)
            if date_elem:
                last_updated = date_elem.text.replace("Last updated", "").strip()

            sections.append({
                "display_name": link.text.strip(),
                "url": urljoin(BASE_URL, link["href"]),
                "last_updated": last_updated
            })
    return sections

def scrape_ohio_legislation():
    """Main function to scrape Ohio legislation data."""
    titles = parse_titles()

    with tqdm(total=len(titles), desc="Scraping Titles", unit="title") as pbar_titles:
        for title_id, title in titles.items():
            pbar_titles.set_postfix(title=title["display_name"])
            title["chapters"] = parse_chapters(title)

            with tqdm(total=len(title["chapters"]), desc=f"Chapters in {title['display_name']}", leave=False, unit="chapter") as pbar_chapters:
                for chapter in title["chapters"]:
                    pbar_chapters.set_postfix(chapter=chapter["display_name"])
                    chapter["sections"] = parse_sections(chapter)
                    pbar_chapters.update(1)
            
            pbar_titles.update(1)

    return titles

# Run the scraper and save to JSON
if __name__ == "__main__":
    print("Starting scraper...")
    ohio_legislation = scrape_ohio_legislation()

    # Save to JSON
    output_file = os.path.join(OUTPUT_DIR, "ohio_legislation.json")
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(ohio_legislation, f, indent=4)

    print(f"Data saved to {output_file}")

    


# In[4]:


import os
import json
import time
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup
from tqdm import tqdm

# Constants
BASE_URL = "https://codes.ohio.gov"
OUTPUT_DIR = "data/ohio"
RATE_LIMIT = 1  # seconds between requests

# Create output directory
os.makedirs(OUTPUT_DIR, exist_ok=True)

def fetch_url(url):
    """Fetches a URL with error handling and rate limiting."""
    try:
        response = requests.get(url)
        response.raise_for_status()
        time.sleep(RATE_LIMIT)
        return response.text
    except requests.RequestException as e:
        print(f"Error fetching {url}: {e}")
        return None

def parse_titles():
    """Scrape all titles from the main page."""
    url = f"{BASE_URL}/ohio-revised-code"
    html = fetch_url(url)
    if not html:
        return {}

    soup = BeautifulSoup(html, "html.parser")
    titles = {}

    for row in soup.select("table.laws-table tr")[1:]:  # Skip header
        link = row.find("a")
        if link:
            title_id = link["href"].split("/")[-1]
            titles[title_id] = {
                "display_name": link.text.strip(),
                "url": urljoin(BASE_URL, link["href"]),
                "chapters": []
            }
    return titles

def parse_chapters(title):
    """Scrape all chapters under a given title."""
    html = fetch_url(title["url"])
    if not html:
        return []

    soup = BeautifulSoup(html, "html.parser")
    chapters = []

    for row in soup.select("table.laws-table tr")[1:]:  # Skip header row
        link = row.find("a")
        if link:
            # Construct the correct chapter URL
            chapter_id = link["href"].split("/")[-1]  # Extract the chapter identifier
            chapter_url = f"{BASE_URL}/ohio-revised-code/{chapter_id}"  # Correct format
            chapters.append({
                "display_name": link.text.strip(),
                "url": chapter_url,
                "sections": []
            })
    return chapters

def parse_sections(chapter):
    """Scrape all sections under a given chapter."""
    html = fetch_url(chapter["url"])
    if not html:
        return []

    soup = BeautifulSoup(html, "html.parser")
    sections = []

    for row in soup.select("table.laws-table tr")[1:]:  # Skip header
        link = row.find("a")
        if link:
            # Correct the section URL format
            section_id = link["href"].split("/")[-1]  # Extract the section identifier
            section_url = f"{BASE_URL}/ohio-revised-code/{section_id}"  # Correct format

            last_updated = None
            # Extract last updated date if available
            date_elem = soup.find("p", string=lambda s: "Last updated" in s if s else False)
            if date_elem:
                last_updated = date_elem.text.replace("Last updated", "").strip()

            sections.append({
                "display_name": link.text.strip(),
                "url": section_url,  # Use the corrected URL format
                "last_updated": last_updated
            })
    return sections

def scrape_ohio_legislation():
    """Main function to scrape Ohio legislation data."""
    titles = parse_titles()

    with tqdm(total=len(titles), desc="Scraping Titles", unit="title") as pbar_titles:
        for title_id, title in titles.items():
            pbar_titles.set_postfix(title=title["display_name"])
            title["chapters"] = parse_chapters(title)

            with tqdm(total=len(title["chapters"]), desc=f"Chapters in {title['display_name']}", leave=False, unit="chapter") as pbar_chapters:
                for chapter in title["chapters"]:
                    pbar_chapters.set_postfix(chapter=chapter["display_name"])
                    chapter["sections"] = parse_sections(chapter)
                    pbar_chapters.update(1)
            
            pbar_titles.update(1)

    return titles

# Run the scraper and save to JSON
if __name__ == "__main__":
    print("Starting scraper...")
    ohio_legislation = scrape_ohio_legislation()

    # Save to JSON
    output_file = os.path.join(OUTPUT_DIR, "ohio_legislation.json")
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(ohio_legislation, f, indent=4)

    print(f"Data saved to {output_file}")

