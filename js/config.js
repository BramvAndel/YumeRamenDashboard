const SERVER_URL = "https://yume-api.bram-jesse.sd-lab.nl/";

// Cookie Helpers
function setCookie(name, value, days) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

function eraseCookie(name) {
  document.cookie = name + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
}

// Auto-refresh interval in milliseconds (e.g., 30000 = 30 seconds)
const REFRESH_INTERVAL = 30000;

// Toggle Show Mode (true = use mock data, false = use API data)
const showMode = false;

let currentMeals = [];

// Mock Data
const mockOrders = [
  {
    OrderID: 1,
    UserID: 123,
    Status: "ordered",
    Ordered_at: new Date().toISOString(),
    Paid: true,
    items: [
      {
        dishID: 1,
        name: "Shoyu Ramen",
        price: 12.5,
        quantity: 1,
        ingredients: "Soy sauce broth, pork, egg, bamboo shoots",
      },
      {
        dishID: 5,
        name: "Extra Egg",
        price: 2.0,
        quantity: 1,
        ingredients: "Boiled egg",
      },
    ],
  },
  {
    OrderID: 2,
    UserID: 456,
    Status: "processing",
    Ordered_at: new Date(Date.now() - 3600000).toISOString(),
    Paid: true,
    items: [
      {
        dishID: 2,
        name: "Miso Ramen",
        price: 13.0,
        quantity: 1,
        ingredients: "Miso broth, corn, butter, pork",
      },
      {
        dishID: 3,
        name: "Gyoza",
        price: 6.0,
        quantity: 1,
        ingredients: "Pork dumplings",
      },
      {
        dishID: 6,
        name: "Green Tea",
        price: 3.0,
        quantity: 1,
        ingredients: "Green tea leaves",
      },
    ],
  },
  {
    OrderID: 99,
    UserID: 789,
    Status: "completed",
    Ordered_at: new Date(Date.now() - 7200000).toISOString(),
    Paid: true,
    items: [
      {
        dishID: 4,
        name: "Spicy Ramen",
        price: 14.0,
        quantity: 1,
        ingredients: "Spicy broth, minced pork, chili oil",
      },
      { dishID: 7, name: "Coke", price: 2.5, quantity: 1, ingredients: "Soda" },
      {
        dishID: 5,
        name: "Extra Egg",
        price: 2.25,
        quantity: 1,
        ingredients: "Boiled egg",
      },
    ],
  },
];

const mockMeals = [
  {
    DishID: 1,
    Name: "Shoyu Ramen",
    Price: 12.5,
    Image: "https://via.placeholder.com/150",
    Ingredients: "Soy sauce broth",
  },
  {
    DishID: 2,
    Name: "Miso Ramen",
    Price: 13.0,
    Image: "https://via.placeholder.com/150",
    Ingredients: "Miso broth",
  },
  {
    DishID: 3,
    Name: "Gyoza",
    Price: 6.0,
    Image: "https://via.placeholder.com/150",
    Ingredients: "Pork dumplings",
  },
];
