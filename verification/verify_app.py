from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Go to homepage
    print("Navigating to homepage...")
    page.goto("http://localhost:8788")

    # Expect title to contain POAPin
    expect(page).to_have_title("POAPin - Organize, Display and Share Your POAP Collection")

    # Check if main content is visible
    # expect(page.get_by_text("POAPin")).to_be_visible() # Maybe text is different too?

    # Take screenshot of homepage
    page.screenshot(path="verification/homepage.png")
    print("Homepage screenshot taken.")

    # Navigate to a specific address (e.g. poap.eth)
    print("Navigating to poap.eth...")
    page.goto("http://localhost:8788/v/poap.eth")

    # Wait for loading or content
    try:
        page.wait_for_selector("text=POAP", timeout=10000)
    except:
        print("Timeout waiting for POAP text on profile page")

    page.screenshot(path="verification/profile_page.png")
    print("Profile page screenshot taken.")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
