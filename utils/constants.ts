import {ProductData} from "./types"
// will be representing the amount of products we want to store in the array
// NOTE: the final product count might differ depending on how many products 
// there are in the page: 
export const LIMIT_PRODUCT_COUNT = 170
// will be representing a delay time before sending a new request for the page if we get `500` status code (server error)
// NOTE: we'll be using it if we could not connect to the page because of the server error
// or could not get a response in the first place: 
export const DELAY_BEFORE_NEW_REQUEST = 120000
// will be representing the max number of retries to connect to the server 
export const MAX_RETRIES = 3
// will be storing the name of each store we are going to iterate through
// and for each store call the function and add the product to the firestore
export const STORE_NAMES: (keyof ProductData)[] = [
    "Walmart",  
    "No Frills - Supermarket",   
    "Dollarama",   
    "Busy Bee Food Mart",   
    "Outlet Collection at Niagara - Pepper Palace",   
    "Your Deli",   
    "Plaza Fiesta Latin Groceries & Cafe",   
    "Ryan's No Frills",   
    "Antipastos",   
    "Giant Tiger",   
    "Zest Mart",   
    "FreshCo",   
    "Food Basics",  
    "Metro Lakeshore",   
    "La Paisana Latin Groceries",   
    "Al Noor",   
    "Sobeys",   
    "B & R European Deli",   
    "Roman Cheese",   
    "Dinh Dinh Asian Foods",   
    "Independent Grocery Store - Hendriks",   
    "Yogibear's Jellystone Park Camp Resort- Ice Cream/Convenience Store",   
    "Commisso's Fresh Food",   
    "Farm Boy",   
    "Thai Binh Asian Food",   
    "The Red Barn Farm Market and Bakery",   
    "Independent Grocery store - Phil's",   
    "Charlie Asian Grocery Inc.",   
    "Patty's Delights Peruvian Culinary",   
    "Gallagher's",   
    "Raja Grocers",   
    "Peanut Mill",   
    "Joe's Your Independent Grocer",   
    "The Indian Valley",   
    "Real Canadian Superstore",   
    "Bodner's Market",   
    "Food Basket",   
    "The Healthy Cupboard",   
    "Costco Wholesale",   
    "Brandon's No Frills",   
    "Pupo's Food Market",   
    "The New Food Box",   
    "Kim's Variety",   
    "Bombay Mart",   
    "Polonia European Market & Deli",   
    "Eastern Food Market",   
    "Foodland",   
    "Lococo's",   
    "Zehrs",   
    "Walmart Supercentre",   
    "Avondale",   
    "Vineland Foodland - Supermarket",   
    "Pistachio's",   
    "Jim's No Frills",   
    "Metro",   
    "Mark's No Frills",   
    "Chippawa Foodland",   
    "Wholesale Club",   
    "Ebeano Super Market",  
]
// will be storing email that we use when entering our credentials
export const EMAIL = "li5estock1234@gmail.com"