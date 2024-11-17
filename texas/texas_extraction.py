import pandas as pd
from bs4 import BeautifulSoup
from urllib.request import Request, urlopen
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
import time

baseurl = "https://statutes.capitol.texas.gov/"

options = Options()
options.headless = True

# Path to chromedriver. Install as per the instructions: https://googlechromelabs.github.io/chrome-for-testing/#stable
service = Service(executable_path='C:\\Users\\Owner\\Downloads\\chromedriver-win64\\chromedriver-win64\\chromedriver.exe')

driver = webdriver.Chrome(service=service, options=options)

driver.get(baseurl)

time.sleep(4)

codeNames = []
titleNames = []
chapterNames = []
sectionNames = []

# Find the 'Texas Statutes' link and click it
driver.find_element(By.XPATH, "//a[text()='Texas Statutes']").click()
time.sleep(2)

# Wait for the page to load and ensure elements are present
WebDriverWait(driver, 10).until(
    EC.presence_of_all_elements_located((By.CSS_SELECTOR, "a.parentNode.treeNode"))
)

# Now attempt to find the 'CODE' elements
dropdown_options = driver.find_elements(By.XPATH, "//a[contains(text(), 'CODE')]")

# Check if dropdown_options is empty
if not dropdown_options:
    print("No 'CODE' elements found on the page after resetting the browser.")
else:
    # Proceed if 'CODE' elements are found
    for i in range(len(dropdown_options)):  # For each CODE
        # Re-fetch dropdown_options to prevent stale elements
        dropdown_options = driver.find_elements(By.XPATH, "//a[contains(text(), 'CODE')]")
        
        # Ensure we still have valid options
        if i >= len(dropdown_options):
            print(f"Index {i} is out of range. Skipping to next.")
            continue  # Skip if index is out of range
        
        # Access the current CODE by index
        option = dropdown_options[i]
        print(f"Accessing CODE: {option.text}")

        # Add the code name and click the option
        codeNames.append(option.text)
        option.click()
        time.sleep(2)

        # Refetch the title dropdown options after clicking the CODE
        title_dropdown_options = driver.find_elements(By.XPATH, "//a[contains(text(), 'TITLE')]")

        if title_dropdown_options:
            for title in range(len(title_dropdown_options)):
                # Check if the index is valid and re-fetch the elements
                title_dropdown_options = driver.find_elements(By.XPATH, "//a[contains(text(), 'TITLE')]")
                if title < len(title_dropdown_options):
                    title_element = title_dropdown_options[title]
                    titleNames.append(title_element.text)
                    print(title_element.text)
                    time.sleep(2)

                    # Find the chapters for this title
                    chapter_dropdown_options = driver.find_elements(By.XPATH, "//a[contains(text(), 'CHAPTER')]")

                    if chapter_dropdown_options:
                        for c in range(len(chapter_dropdown_options)):
                            chapter_dropdown_options = driver.find_elements(By.XPATH, "//a[contains(text(), 'CHAPTER')]")
                            if c < len(chapter_dropdown_options):
                                chapter = chapter_dropdown_options[c]
                                chapterNames.append(chapter.text)
                                print(chapter.text)

                                # Find all elements with the class "HTMLicon"
                                htmlicon_elements = driver.find_elements(By.CLASS_NAME, "HTMLicon")
                                if htmlicon_elements:
                                    htmlicon = htmlicon_elements[0]  # Access the first element
                                    href = htmlicon.get_attribute("href")
                                    if href:
                                        sectionNames.append(href)
                                        print(href)

                                        # Navigate to the href link
                                        driver.get(href)
                                        print(f"Navigated to: {href}")

                                        # Wait for the page to load
                                        WebDriverWait(driver, 10).until(
                                            EC.presence_of_element_located((By.TAG_NAME, "body"))
                                        )

                                        # Extract the page's HTML source
                                        html_content = driver.page_source
                                        soup = BeautifulSoup(html_content, 'html.parser')
                                        page_text = soup.get_text(strip=True)
                                        print("Page Text:", page_text)

                                        # Navigate back to the previous page
                                        driver.back()

                                        # Re-fetch elements after navigating back
                                        htmlicon_elements = driver.find_elements(By.CLASS_NAME, "HTMLicon")
    
        driver.find_element(By.XPATH, "//a[text()='Texas Statutes']").click()
        time.sleep(2) 
