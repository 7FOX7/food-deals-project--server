/*
url: https://shop.thepeanutmill.com/collections/all?sort_by=title-ascending&filter.p.vendor=ACROPOLIS&filter.p.vendor=AMY%27S&filter.p.vendor=ANNIE%27S+HOMEGROWN&filter.p.vendor=BLUE+DIAMOND&filter.p.vendor=BOB%27S+REDMILL&filter.p.vendor=CAMINO&filter.p.vendor=CHARLIE+BEE&filter.p.vendor=CHAS&filter.p.vendor=DE+LA+TERRE&filter.p.vendor=ECOIDEAS&filter.p.vendor=EDEN&filter.p.vendor=ELMHURST&filter.p.vendor=FOUR+SIGMATIC&filter.p.vendor=GIDDY+YO&filter.p.vendor=GOGO+QUINOA&filter.p.vendor=HARMONY+ORGANIC&filter.p.vendor=HONEY%27S&filter.p.vendor=INARI&filter.p.vendor=KETTLE+BRAND&filter.p.vendor=KONSCIOUS+KITCHEN&filter.p.vendor=KOYO&filter.p.vendor=L%27ANCETRE&filter.p.vendor=LOVE+GOOD+FATS&filter.p.vendor=LUNDBERG+FARM&filter.p.vendor=MAIGA+SHEA+BUTTER&filter.p.vendor=NEW+MOON+KITCHEN&filter.p.vendor=NUTS+TO+YOU&filter.p.vendor=ONE+DEGREE&filter.p.vendor=ORPHEE&filter.p.vendor=PEANUT+MILL&filter.p.vendor=PRANA&filter.p.vendor=PUR+GUM&filter.p.vendor=RAINCOAST+TRADING&filter.p.vendor=ROWE+FARMS&filter.p.vendor=STASH+TEA&filter.p.vendor=SUNFLOWER+KITCHEN&filter.v.price.gte=&filter.v.price.lte=
*/

import puppeteer from "puppeteer"
import { Products, Product } from "../../utils/types" 
import { getProductCategory__funcBody, unitsRegex } from "../../utils/regexes"
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
        headless: false
    })
    // NOTE: 
    // - this value will be used to determine if we should look for the `next` button at all
    // - if the number of products for the current page is less than this number, then we need to just return existing products (we cannot go to the next page)
    const EXPECTED_NUM_OF_PRODUCTS_PER_PAGE = 24
    // TODO: add a cron job logic
    // create a new page
    const page = await browser.newPage()

    const handle = async () => {
        try {
            // connect to the specified url (watch page number)
            const response = await page.goto(`https://shop.thepeanutmill.com/collections/all?sort_by=title-ascending&filter.p.vendor=ACROPOLIS&filter.p.vendor=AMY%27S&filter.p.vendor=ANNIE%27S+HOMEGROWN&filter.p.vendor=BLUE+DIAMOND&filter.p.vendor=BOB%27S+REDMILL&filter.p.vendor=CAMINO&filter.p.vendor=CHARLIE+BEE&filter.p.vendor=CHAS&filter.p.vendor=DE+LA+TERRE&filter.p.vendor=ECOIDEAS&filter.p.vendor=EDEN&filter.p.vendor=ELMHURST&filter.p.vendor=FOUR+SIGMATIC&filter.p.vendor=GIDDY+YO&filter.p.vendor=GOGO+QUINOA&filter.p.vendor=HARMONY+ORGANIC&filter.p.vendor=HONEY%27S&filter.p.vendor=INARI&filter.p.vendor=KETTLE+BRAND&filter.p.vendor=KONSCIOUS+KITCHEN&filter.p.vendor=KOYO&filter.p.vendor=L%27ANCETRE&filter.p.vendor=LOVE+GOOD+FATS&filter.p.vendor=LUNDBERG+FARM&filter.p.vendor=MAIGA+SHEA+BUTTER&filter.p.vendor=NEW+MOON+KITCHEN&filter.p.vendor=NUTS+TO+YOU&filter.p.vendor=ONE+DEGREE&filter.p.vendor=ORPHEE&filter.p.vendor=PEANUT+MILL&filter.p.vendor=PRANA&filter.p.vendor=PUR+GUM&filter.p.vendor=RAINCOAST+TRADING&filter.p.vendor=ROWE+FARMS&filter.p.vendor=STASH+TEA&filter.p.vendor=SUNFLOWER+KITCHEN&filter.v.price.gte=&filter.v.price.lte=`, {
                waitUntil: "load"
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
                return await new Promise<Products>(resolve => setTimeout(() => resolve(handle()), 
                constants.DELAY_BEFORE_NEW_REQUEST))
            }
            // if connection to the page failed and this is our API's fault, then throw an error
            else if (/^4[0-9][0-9]$/.test(response.status().toString())) {
                // return an error
                // TODO: return the cached Product data (firestore)
                throw new Error("check if a request is valid")
            }
            // This will create a new function which will be accepting 'productTitle'
            const getProductCategory = new Function("productTitle", getProductCategory__funcBody)
            // start function execution
            return await addProducts()

            // recursive function we will be calling every time
            // to go to the next page (there are no products left in the current page)
            async function addProducts() {
                try {
                    // wait for the container
                    await page.waitForSelector("div.product-list--collection", { visible: true })
                    // check if we should add more products to the array: 
                    if (products.length >= constants.LIMIT_PRODUCT_COUNT) {
                        // return products
                        return products
                    }
                    // get the current products
                    const currentProducts = await page.$$("div.product-list--collection div.product-item")
                    // iterate through each product
                    for (const currentProduct of currentProducts) {
                        // test if the item is sold out
                        const soldOut = await currentProduct.evaluate(el => /out/gi.test(el.querySelector("button.product-item__action-button")?.textContent ?? ""))
                        // if the item is sold out, then just skip the current product
                        if (soldOut) continue
                        // get the brand name
                        const brand = await currentProduct.evaluate(el => el.querySelector("a.product-item__vendor")?.textContent?.trim() ?? "")
                        // get the title 
                        const title = await currentProduct.evaluate(el => el.querySelector("a.product-item__title")?.textContent?.trim()) ?? Unavailable.Title
                        // merge brand name and title
                        const mergedTitle = `${brand} - ${title}`
                        // get the price
                        const primaryPrice = await currentProduct.evaluate(el => el.querySelector("span.price")?.lastChild?.textContent?.trim()) ?? Unavailable.PrimaryPrice
                        // get units match 
                        const unitsMatch = title.match(unitsRegex)
                        // get the units
                        const units = unitsMatch ? unitsMatch.join(" or ") : Unavailable.Units
                        // 'getProductCategory' will be returning a product category from one of the enum values from 'ProductCategories' 
                        const category: ProductCategories = getProductCategory(title)
                        if (category === ProductCategories.NoCategory) continue
                        // get a new product
                        const product: Product = {
                            imageUri: "my image", 
                            title: mergedTitle, 
                            primaryPrice, 
                            units, 
                            category, 
                        }
                        
                        // if there is a valid product then push it to the array
                        product && products.push(product)
                    }  

                    // wait for the product container
                    await page.waitForSelector("div.product-list--collection", { visible: true })
                    // get the number of products for the current page
                    const productsCount = await page.$eval("div.product-list--collection", div => div.querySelectorAll("div.product-item").length)
                    // check if this is the last page (then we don't need to wait for the `next` button)
                    const isLastPage = productsCount < EXPECTED_NUM_OF_PRODUCTS_PER_PAGE
                    // if this is the last page, then just return existing products
                    if (isLastPage) return products
                    // wait for the `next` button
                    await page.waitForSelector("div.pagination__inner a.pagination__next", { visible: true })
                    // click on the `next` button and wait for navigation
                    await Promise.all([
                        page.click("div.pagination__inner a.pagination__next"), 
                        page.waitForNavigation()
                    ])
                    // wait for a bit, otherwise, there might be duplicates
                    await new Promise(resolve => setTimeout(resolve, 1500))
                    // call the function again
                    return await addProducts()
                }
                catch (err: any) {
                    throw new Error("Recursion failed: " + err.message)
                }  
            }
        }
        catch (err: any) {
            console.error("Something went wrong (Peanut Mill): " + err)
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
    return await handle()
}

export default getData