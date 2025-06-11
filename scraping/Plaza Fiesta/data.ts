import puppeteer from "puppeteer"
import { Products, Product } from "../../utils/types" 
import { getProductCategory__funcBody } from "../../utils/product-categories-regex"
import * as constants from "../../utils/constants"

// will be searching through each of this food
const foods = [
    "Hot Sauce Tapatio", 
    "Salsa de Guacamole Herdez", 
    "Salsa Cholula", 
    "Valentina Hot Sauce", 
    "Dried Arbol Chili Peppers", 
    "Dried Ancho Chili Peppers", 
    "Bijol Colouring and Seasoning", 
    "Tajin Seasoning", 
    "Yuca Harina Goya", 
    "Bunoelina Mix Colombiana", 
    "Natilla Mix Colombiana", 
    "Mazamorra Colombiana", 
    "Yuca Harina Colombiana", 
    "Maizena Corn Starch", 
    "Harina Churros", 
    "Corn Flour Tamales Maseca", 
    "Corn Flour Blanca Maseca", 
    "Chocomilk Drink", 
    "Milo Drink", 
    "Chocolate Abuelita", 
    "Chocolate Abuelita Powder", 
    "Corona Flash", 
    "La Lechera Condensed Milk", 
    "Piloncillo Artesanal", 
    "Conchita", 
    "Emilia yellow potato", 
    "Emilia Arracacha", 
    "Chirilagua Rio Grande", 
    "Plantains Big Banana", 
    "Yuca Bites", 
    "Saltin Noel",
    "Maria Gamesa", 
    "Polvorones Marinela", 
    "Barritas Marinela", 
    "Refried Beans Ducal", 
    "La costena", 
    "Juanitas", 
    "Poblano Peppers", 
    "Mole Xiqueno", 
    "White Hominy Goya", 
    "Takis", 
    "Cafe Sello Rojo Espresso"
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
    // will be storing the number of retries we made 
    // to connect to the page
    let numOfRetries = 0
    // will be representing a browser: 
    const browser = await puppeteer.launch({
        headless: false
    })
    // TODO: add a cron job logic
    // create a new page
    const page = await browser.newPage()
    
    // recursive function we will be calling every time
    // to go to the next page (there are no products left in the current page)
    const addProducts = async (): Promise<Products> => {
        try {
            // connect to the specified url (watch page number)
            const response = await page.goto(`https://shoplatinfoods.ca/search`, {
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
            // wait for selector
            await page.waitForSelector('form.search-bar--page input.input-group-field')
            // click on the search input container
            await page.click('form.search-bar--page input.input-group-field')
            // wait for the input container
            await page.waitForSelector("div.dfd-searchbox-main")
            // This will create a new function which will be accepting 'productTitle'
            const getProductCategory = new Function("productTitle", getProductCategory__funcBody)
            // Iterate through each food
            for (const food of foods) {
                // type the name of a food to the search input
                // NOTE: 
                // - set the delay of at least 25 ms, otherwise, the products will not 
                // have enough time to load, and you will get a mess
                await page.type("div.dfd-searchbox-main input", food, { delay: 25 })
                // get the text content of the container
                const container = await page.$eval("div.dfd-card-content", div => div.outerHTML)
                // if there is no a container, this means there is no product, just skip the current product
                if (!container) continue
                // get the title of the first product that match input
                const title = await page.$eval("div.dfd-card-title", div => div.textContent?.trim()) ?? Unavailable.Title
                // get the title of the first product that match input
                const primaryPrice = await page.$eval("span.dfd-card-price", span => span.textContent?.replaceAll("$", "").trim()) ?? Unavailable.PrimaryPrice
                // units will be empty this time
                const units = ""
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
                // add product to the products
                products.push(product)
                // clear the input field
                await page.$eval("div.dfd-searchbox-main input", input => input.value = "")
            }

            return products
        }
        catch (err: any) {
            console.error("Something went wrong (Plaza Fiesta Latin Grocery and Cafe): " + err.message)
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