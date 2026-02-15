import os
from playwright.sync_api import sync_playwright, expect

# Define output directory
OUTPUT_DIR = "test-results"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Go to homepage
    print("Navigating to homepage...")
    page.goto("http://localhost:8788")

    # Expect title to contain POAPin
    expect(page).to_have_title("POAPin - Organize, Display and Share Your POAP Collection")

    # Take screenshot of homepage
    homepage_screenshot = os.path.join(OUTPUT_DIR, "homepage.png")
    page.screenshot(path=homepage_screenshot)
    print(f"Homepage screenshot taken: {homepage_screenshot}")

    # Navigate to a specific address (e.g. poap.eth)
    print("Navigating to poap.eth...")
    page.goto("http://localhost:8788/v/poap.eth")

    # Wait for loading or content
    try:
        page.wait_for_selector("text=POAP", timeout=10000)
    except:
        print("Timeout waiting for POAP text on profile page")

    profile_screenshot = os.path.join(OUTPUT_DIR, "profile_page.png")
    page.screenshot(path=profile_screenshot)
    print(f"Profile page screenshot taken: {profile_screenshot}")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
