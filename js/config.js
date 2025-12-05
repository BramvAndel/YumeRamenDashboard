const SERVER_URL = 'http://localhost:3000/';

// Toggle Show Mode (true = use mock data, false = use API data)
const showMode = false;

let currentMeals = [];

// Mock Data
const mockOrders = [
    { 
        OrderID: 1, 
        UserID: 123, 
        Status: 'ordered',
        Ordered_at: new Date().toISOString(),
        Paid: true,
        items: [
            { dishID: 1, name: 'Shoyu Ramen', price: 12.50, quantity: 1, ingredients: 'Soy sauce broth, pork, egg, bamboo shoots' },
            { dishID: 5, name: 'Extra Egg', price: 2.00, quantity: 1, ingredients: 'Boiled egg' }
        ]
    },
    { 
        OrderID: 2, 
        UserID: 456, 
        Status: 'processing',
        Ordered_at: new Date(Date.now() - 3600000).toISOString(),
        Paid: true,
        items: [
            { dishID: 2, name: 'Miso Ramen', price: 13.00, quantity: 1, ingredients: 'Miso broth, corn, butter, pork' },
            { dishID: 3, name: 'Gyoza', price: 6.00, quantity: 1, ingredients: 'Pork dumplings' },
            { dishID: 6, name: 'Green Tea', price: 3.00, quantity: 1, ingredients: 'Green tea leaves' }
        ]
    },
    { 
        OrderID: 99, 
        UserID: 789, 
        Status: 'completed',
        Ordered_at: new Date(Date.now() - 7200000).toISOString(),
        Paid: true,
        items: [
            { dishID: 4, name: 'Spicy Ramen', price: 14.00, quantity: 1, ingredients: 'Spicy broth, minced pork, chili oil' },
            { dishID: 7, name: 'Coke', price: 2.50, quantity: 1, ingredients: 'Soda' },
            { dishID: 5, name: 'Extra Egg', price: 2.25, quantity: 1, ingredients: 'Boiled egg' }
        ]
    }
];

const mockMeals = [
    { DishID: 1, Name: 'Shoyu Ramen', Price: 12.50, Image: 'https://via.placeholder.com/150', Ingredients: 'Soy sauce broth' },
    { DishID: 2, Name: 'Miso Ramen', Price: 13.00, Image: 'https://via.placeholder.com/150', Ingredients: 'Miso broth' },
    { DishID: 3, Name: 'Gyoza', Price: 6.00, Image: 'https://via.placeholder.com/150', Ingredients: 'Pork dumplings' }
];
