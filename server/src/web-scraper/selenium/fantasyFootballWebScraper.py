import csv
import requests
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

# Can't use this on firebase as i cant use the servers browser so the webdriver wouldn't work
# therefore this is just ran once on my own machine to get the links, then those links can be scraped weekly on the server

__location__ = os.path.realpath(
    os.path.join(os.getcwd(), os.path.dirname(__file__)))

def test():
    browser = webdriver.Chrome(os.path.join(__location__, 'chromedriver_linux64/chromedriver')) #people call this driver sometimes instead
    browser.get('https://www.premierleague.com/players')

    time.sleep(2)

    cookie = WebDriverWait(browser, 30).until(EC.presence_of_element_located((By.XPATH, "/html/body/section/div/div")))
    cookie.click()

    y = 600
    for timer in range(0,100):
        browser.execute_script("window.scrollTo(0, "+str(y)+")")
        y += 600  
        time.sleep(1)

    browser.execute_script("window.scrollTo(0, 220)") 
    time.sleep(2)

    elems = WebDriverWait(browser, 30).until(EC.presence_of_all_elements_located((By.CLASS_NAME, "playerName")))
    links = [elem.get_attribute('href') for elem in elems]
    links = [elem.replace("overview", "stats?co=1&se=363") for elem in links] 
    
    browser.get(links[1])
    name = WebDriverWait(browser, 30).until(EC.presence_of_element_located((By.XPATH, "//*[@id='mainContent']/section/div[2]/div[3]/h1/div")))
    print(name.text)

    team = WebDriverWait(browser, 30).until(EC.presence_of_element_located((By.XPATH, "//*[@id='mainContent']/div[3]/nav/div/section[1]/div[2]/a")))
    print(team.text)

    printCSV(links)

def printCSV(links):
    fileOpened = open(os.path.join(__location__, "links.csv"), "w")
    wtr = csv.writer((fileOpened), delimiter=',', lineterminator='\n')
    for x in links : wtr.writerow ([x])
    fileOpened.close()

if __name__ == '__main__':
    test()