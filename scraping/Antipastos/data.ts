import puppeteer from "puppeteer"
import { Products, Product } from "../../utils/types" 
import { getProductCategory__funcBody } from "../../utils/product-categories-regex"
import * as constants from "../../utils/constants"

// default for unavailable product data
enum Unavailable {
    ImageUri = "[COULD NOT GET PRODUCT IMAGE]", 
    Title = "[COULD NOT GET PRODUCT NAME]", 
    PrimaryPrice = "[COULD NOT GET PRODUCT PRIMARY PRICE]", 
    Units = "[COULD NOT GET PRODUCT UNIT DETAILS]"
}

// we will be storing food categories: 
// NOTE: food categories MUST match 'FoodTypes' type from our client app
enum ProductCategories {
    FreshProduce = "Fresh Produce",
    MeatAndSeafood = "Meat & Seafood", 
    DairyAndEggs = "Dairy & Eggs", 
    FrozenAndPrepared = "Frozen & Prepared Foods", 
    BakeryAndBreakfast = "Bakery & Breakfast", 
    SnacksAndSweets = "Snacks & Sweets", 
    PantryAndEssentials = "Pantry & Essentials", 

    // this category will be used as a placeholder for the product 
    // whose food category does not match any of the above (DON'T USE IT IN YOUR client app)
    NoCategory = "[NO CATEGORY]"
}

const getData = async (): Promise<Products> => {
    // will be storing products we will be pushing to the array: 
    const products: Products = []
    // will be storing the number of retries we made 
    // to connect to the page
    let numOfRetries = 0
    // will be representing a browser: 
    const browser = await puppeteer.launch({
        headless: false, 
        slowMo: 25  // set slowmo to at least 25, otherwise it will fail where we need to press the button
    })
    // TODO: add a cron job logic
    // create a new page
    const page = await browser.newPage()
    
    // recursive function we will be calling every time
    // to go to the next page (there are no products left in the current page)
    const addProducts = async (): Promise<Products> => {
        try {
            // connect to the specified url (watch page number)
            const response = await page.goto(`https://www.antipastos.moduurn.com/locations`, {
                waitUntil: "domcontentloaded"
            })
            // if connection to the page failed (and it is not our API's fault, then send a new request after delay time)
            if (!response || /^5[0-9][0-9]$/.test(response.status().toString())) {
                // check if we reached maximum retries, in this case there is no sense to make another request, throw an error
                if (numOfRetries === constants.MAX_RETRIES) {
                    // return an error
                    // TODO: return the cached Product data (firestore)
                    throw new Error("reached maximum retry count. Consider incrementing the delay time, and sure a request is valid")
                }
                // increment the number of retries
                numOfRetries ++
                // try to send a new request for the page after some time
                return await new Promise(resolve => setTimeout(() => resolve(addProducts()), 
                constants.DELAY_BEFORE_NEW_REQUEST))
            }
            // if connection to the page failed and this is our API's fault, then throw an error
            else if (/^4[0-9][0-9]$/.test(response.status().toString())) {
                // return an error
                // TODO: return the cached Product data (firestore)
                throw new Error("check if a request is valid")
            }
            
            // wait for the `continue` button
            await page.waitForSelector('[data-qa=continue]'), 
            // click on the button to close the popup
            await page.click('[data-qa=continue]')
            // wait for login button
            await page.waitForSelector('[data-qa=login-register-button]')
            // click on the login button and wait for the popup with the button `data-qa=email-login] .user-login` to appear
            await Promise.all([
                page.click('[data-qa=login-register-button]'), 
                page.waitForSelector("[data-qa=email-login] .user-login")
            ])
            // click on the `sign in` container
            await page.click('[data-qa=email-login] .user-login')
            // wait for the modal container (email-password for) to appear
            await page.waitForSelector('div.modal-container')
            // type email to the field
            await page.type("#email", constants.EMAIL)
            // type password to the field
            await page.type("#password", "jericka1292065A")
            // click on the submit button and wait till it navigates to another page
            await page.click('[type=submit]')
            // wait for the `Order` button to load
            // NOTE: 
            // - some weird shit is going on. In a nutshell: you want to wait for the modal window to be hidden and the button `Order` to be visible
            await page.waitForSelector("div.modal-container", {
                hidden: true
            })
            await page.waitForSelector("div.location-card button.order-now", {
                visible: true
            })
            // click on the `Order` button
            await page.click("div.location-card button.order-now")
            // wait for the `Continue` button to appear
            await page.waitForSelector("button.continue-green")
            // click on `continue` button
            await Promise.all([
                page.click("button.continue-green"),
                page.waitForNavigation(), 
                // wait for the button of another popup to appear
                await page.waitForSelector("[data-qa=continue]")
            ])
            // press on the button to close the popup
            await page.click("[data-qa=continue]")
            // wait for the element to be hidden (or removed the dom)
            await page.waitForSelector("[data-qa=continue]", {
                hidden: true
            })
            // wait for the selector to become visible
            await page.waitForSelector("nav.minimumDeliveryTypes div:nth-child(2)", {
                visible: true
            })
            // select the second delivery type
            await page.click("nav.minimumDeliveryTypes div:nth-child(2)")
            // click on the 'Menu' link from the container and wait for the navigation
            await Promise.all([
                page.click("[data-qa=Menu]"), 
                page.waitForNavigation(), 
                // wait for the tabs container to appear
                page.waitForSelector("ul.mod-nav-tabs li")
            ]) 
            // get the number of tabs
            // NOTE: 
            // - you can think of it as the number of product categories
            const tabsCount = await page.$$eval("ul.mod-nav-tabs li", tabs => tabs.length)

            // iterate the number of times that matches `tabsCount`
            // NOTE: 
            // - for each iteration: click on the specific tab, wait for the content to load, and extract all the data we need
            for (let i = 1; i < tabsCount; i++) {
                // click on the specific tab, and wait till all the content to load
                await Promise.all([
                    page.click(`ul.mod-nav-tabs li:nth-child(${i})`), 
                    page.waitForNavigation(), 
                    // wait for the item-container to render
                    page.waitForSelector("div.item-container")
                ])
                // get the info of each food in the container
                const currentProducts = await page.$$eval("div.item-container li", (_products, getProductCategory__funcBody) => {
                    // pass a param productTitle, and a function body.
                    // This will create a new function which will be accepting 'productTitle'
                    const getProductCategory = new Function("productTitle", getProductCategory__funcBody)

                    return _products.map(currentProduct => {
                        // get the title of the current product
                        const title = currentProduct.querySelector("div.item-title")?.textContent?.trim() ?? Unavailable.Title
                        // get the price of the current product
                        const primaryPrice = currentProduct.querySelector("div.item-price")?.textContent?.replaceAll("$", "").trim() ?? Unavailable.PrimaryPrice
                        // get unit details (well, this is just description for this store)
                        const units = currentProduct.querySelector("div.item-description-summary")?.textContent?.replace(/\n/g, " ").trim() ?? Unavailable.Units

                        // 'getProductCategory' will be returning a product category from one of the enum values from 'ProductCategories' 
                        let category: ProductCategories = getProductCategory(title)
                        // if product category is 'NoCategory' (meaning this might be NOT a food or a food with a difficult name), then give it a default category
                        if (category === ProductCategories.NoCategory) {
                            // give it a default category
                            category = ProductCategories.PantryAndEssentials
                        }
                        // get a new product
                        const product: Product = {
                            imageUri: "my image", 
                            title, 
                            primaryPrice, 
                            units, 
                            category, 
                        }
                        
                        return product
                    })
                }, getProductCategory__funcBody)

                // add products from the current page to the global products
                products.push(...currentProducts)
            }

            // return products
            return products
        }
        catch (err: any) {
            console.error("Something went wrong (Antipastos): " + err.message)
            // still return products that have been added: 
            return products
        }  
        // will be executed regardless
        finally {
            // close the browser
            await browser.close()
        }
    }

    // start function execution
    return await addProducts()
}


export default getData