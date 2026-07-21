from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select, WebDriverWait


driver = webdriver.Chrome()
wait = WebDriverWait(driver, 10)

try:
	driver.get("https:/gig-work.me/login")

	wait.until(EC.presence_of_element_located((By.NAME, "email"))).send_keys(
		"sabinrai@gmail.com"
	)
	driver.find_element(By.NAME, "password").send_keys("test@9824")
	driver.find_element(By.XPATH, "//button[contains(., 'Sign In')]").click()

	wait.until(EC.url_contains("/customer/dashboard"))

	driver.get("http://gig-work.me/customer/search-workers")

	category_select = wait.until(
		EC.presence_of_element_located((By.NAME, "category"))
	)
	Select(category_select).select_by_visible_text("Electrician")

	radius_input = driver.find_element(By.NAME, "radius")
	radius_input.clear()
	radius_input.send_keys("10")

	driver.find_element(By.XPATH, "//button[contains(., 'Search Workers')]").click()

	wait.until(EC.url_contains("searched=1"))
	wait.until(EC.url_contains("radius=10"))

	print("Worker search successful")
finally:
	driver.quit()