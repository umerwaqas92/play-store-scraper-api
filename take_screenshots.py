from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
import json
import time
import os

# Create screenshots directory
os.makedirs('screenshots', exist_ok=True)

# Setup Chrome options
chrome_options = Options()
chrome_options.add_argument('--headless')
chrome_options.add_argument('--no-sandbox')
chrome_options.add_argument('--disable-dev-shm-usage')
chrome_options.add_argument('--window-size=1400,900')
chrome_options.add_argument('--force-device-scale-factor=2')

# Initialize driver
driver = webdriver.Chrome(options=chrome_options)

# API endpoints to screenshot
endpoints = [
    ('http://localhost:3000/', '01-homepage'),
    ('http://localhost:3000/categories', '02-categories'),
    ('http://localhost:3000/apps/SOCIAL', '03-apps-social'),
    ('http://localhost:3000/search?q=chat', '04-search-chat'),
    ('http://localhost:3000/apps/details?id=com.openai.chatgpt', '05-app-details'),
    ('http://localhost:3000/apps/reviews?id=com.openai.chatgpt&num=5', '06-app-reviews'),
]

# Inject CSS to make JSON pretty in browser
pretty_json_css = """
var style = document.createElement('style');
style.textContent = `
    body { 
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; 
        background: #1e1e1e; 
        color: #d4d4d4;
        padding: 20px;
        margin: 0;
    }
    pre { 
        white-space: pre-wrap; 
        word-wrap: break-word;
        font-size: 13px;
        line-height: 1.5;
    }
    .string { color: #ce9178; }
    .number { color: #b5cea8; }
    .boolean { color: #569cd6; }
    .null { color: #569cd6; }
    .key { color: #9cdcfe; }
`;
document.head.appendChild(style);

// Syntax highlight JSON
function syntaxHighlight(json) {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

var pre = document.querySelector('pre');
if (pre) {
    var json = JSON.parse(pre.textContent);
    pre.innerHTML = syntaxHighlight(JSON.stringify(json, null, 2));
}
"""

for url, name in endpoints:
    print(f"Taking screenshot of {url}...")
    driver.get(url)
    time.sleep(2)
    
    # Inject pretty JSON styling
    driver.execute_script(pretty_json_css)
    time.sleep(1)
    
    # Take screenshot
    filepath = f'screenshots/{name}.png'
    driver.save_screenshot(filepath)
    print(f"  Saved: {filepath}")

driver.quit()
print("\nAll screenshots captured!")
