import puppeteer from "puppeteer"
import { Products, Product } from "../../utils/types" 
import { getProductCategory__funcBody, unitsRegex } from "../../utils/regexes"
import * as constants from "../../utils/constants"

// type will be representing food categories and how much food of that category will be in `products` 
type FoodsAndLimits = {
    category: string, 
    limit: number
} []

// will be storing food categories and the limit (how much food of that category will be in `products`)
const foods: FoodsAndLimits = [
    {
        category: "produce",
        limit: 28
    }, 
    {
        category: "frozen-foods", 
        limit: 28
    },
    {
        category: "nuts", 
        limit: 10
    }, 
    {
        category:  "seafoods",
        limit: 28
    }, 
    {
        category: "canned-goods", 
        limit: 10
    }, 
    {
        category: "dairy-eggs", 
        limit: 28
    }, 
    {
        category: "meat", 
        limit: 28
    }, 
    {
        category: "spices-dry-herbs", 
        limit: 10
    }
]

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
    // will be representing a browser: 
    const browser = await puppeteer.launch({
        headless: false
    })
    // NOTE: 
    // - this value will be used to determine if we should look for the `next` button at all
    // - if the number of products for the current page is less than this number, then we need to just return existing products (we cannot go to the next page)
    const EXPECTED_NUM_OF_PRODUCTS_PER_PAGE = 8
    // TODO: add a cron job logic
    // create a new page
    const page = await browser.newPage()
    try {
        // iterate through each food
        for(const food of foods) {
            // check if we should add more products to the array: 
            if (products.length >= constants.LIMIT_PRODUCT_COUNT) {
                // return products
                return products
            }
            // console.log("Food category: " + food.category)
            // connect to the specified url (watch page number)
            const response = await page.goto(`https://shop.ebeano.ca/${food.category}`, {
                waitUntil: "domcontentloaded"
            })
            // if connection to the page failed (and it is not our API's fault, then send a new request after delay time)
            if (!response || /^5[0-9][0-9]$/.test(response.status().toString())) {
                // return an error
                // TODO: return the cached Product data (firestore)
                throw new Error("Server error. Implement the logic to wait for a bit, and then try to fetch the data again")
            }
            // if connection to the page failed and this is our API's fault, then throw an error
            else if (/^4[0-9][0-9]$/.test(response.status().toString())) {
                // return an error
                // TODO: return the cached Product data (firestore)
                throw new Error("check if a request is valid")
            }
            // we will be incrementing the cound as we are adding food of category x to `products`
            let foodCount = 0
            await addProducts(food, foodCount)
        }

        // return products after all food was added
        return products
    }
    catch (err: any) {
        console.error("Something went wrong (Ebeano Super Market): " + err.message)
        // still return products that have been added: 
        return products
    }  
    // will be executed regardless
    finally {
        // close the browser
        await browser.close()
    }

    // function will be called for each food type
    async function addProducts(food: FoodsAndLimits[number], foodCount: number)  {
        try {
            // get food category and the limit (how much of that food we want to have in `products`)
            const {limit} = food
            // pass a param productTitle, and a function body.
            // This will create a new function which will be accepting 'productTitle'
            const getProductCategory = new Function("productTitle", getProductCategory__funcBody)
            // get the current products
            const currentProducts = await page.$$("div.product-grid div.product-item")
            // iterate through each product
            for (const currentProduct of currentProducts) {
                // get the title 
                const title = await currentProduct.evaluate(el => el.querySelector("h2.product-title a")?.textContent?.trim()) ?? Unavailable.Title
                // console.log(`title: ${title}, count: ${foodCount}`)
                // get the price
                const primaryPrice = await currentProduct.evaluate(el => el.querySelector("span.actual-price")?.textContent?.trim()) ?? Unavailable.PrimaryPrice
                // get units match 
                const unitsMatch = title.match(unitsRegex)
                // get the units
                const units = unitsMatch ? unitsMatch.join(" or ").toLowerCase() : Unavailable.Units
                // 'getProductCategory' will be returning a product category from one of the enum values from 'ProductCategories' 
                const category: ProductCategories = getProductCategory(title)
                if (category === ProductCategories.NoCategory) continue
                // get a new product
                const product: Product = {
                    imageUri: "my image", 
                    title, 
                    primaryPrice, 
                    units, 
                    category, 
                }
                
                // if there is a valid product then push it to the array
                product && products.push(product)
                // increment the count
                foodCount += 1
                // if we reached the limit for the current food category, then just return (stop adding products to the array)
                if (foodCount >= limit) return
            }
            // get the number of products for the current page
            const productsCount = await page.$eval("div.product-grid", div => div.querySelectorAll("div.product-item").length)
            // check if this is the last page (then we don't need to wait for the `next` button)
            const isLastPage = productsCount < EXPECTED_NUM_OF_PRODUCTS_PER_PAGE
            // if this is the last page, then just return
            if (isLastPage) return 
            // wait for the `next` button
            await page.waitForSelector("div.pager ul li.next-page a", { visible: true })
            // click on the `next` button and wait for navigation
            await Promise.all([
                page.click("div.pager ul li.next-page a"), 
                page.waitForNavigation()
            ])
            // call the function again
            await addProducts(food, foodCount)
        }
        catch (err: any) {
            console.error("Execution of `addProducts()` function failed: " + err.message)
        }
    }
}


export default getData