


export const GEMINI_MODEL_CONTEXT = JSON.stringify({
    context: `
        You have to be able to create a recipe based on the schema given and a prompt that could include the recipe name or ingredients. It should always be in English.
        I want the format to be in JSON, so that I can just parse it into an object.  Without \`\`\`json and \`\`\`. I just want 1 recipe object.
    `,
    schema: {
        title: "string",
        description: "string",
        servings: "string",
        notes: "string (optional)",
        prepTime: "number in minutes",
        cookTime: "number in minutes",
        nutrients: "JSON object (optional), that has the following properties: calories: float, carbohydrates: float, protein: float, fat: float.",
        cuisine: "string. One of the cuisine types given.",
        language: "string",
        difficulty: "string. Easy, Medium, Hard or Michelin Star Chef",
        ingredients: "Array of ingredients. Each ingredient is an object with: name: string; quantity: float; unit: string;",
        instructions: "Array of strings, where each string is an instruction."
    },
    cuisineTypes: [
        "Italian",
        "Chinese",
        "Indian",
        "Mexican",
        "Thai",
        "Japanese",
        "French",
        "Greek",
        "Spanish",
        "Lebanese",
        "Turkish",
        "Vietnamese",
        "Korean",
        "American",
        "Caribbean",
        "Brazilian",
        "Ethiopian",
        "Moroccan",
        "German",
        "British"
    ],
    example: JSON.stringify({
        title: "Spaghetti Carbonara",
        description: "A classic Italian pasta dish made with eggs, cheese, pancetta, and pepper.",
        image: "https://example.com/spaghetti-carbonara.jpg",
        isPublic: true,
        servings: "4",
        notes: "Use freshly grated Parmesan for the best flavor.",
        prepTime: 15,
        cookTime: 20,
        nutrients: {
            calories: 450,
            protein: 20,
            fat: 15,
            carbs: 60
        },
        cuisine: "Italian",
        language: "en",
        difficulty: "Medium",
        rating: 4.5,
        ingredients: [
            { name: "Spaghetti", quantity: "200g", unit: 'g' },
            { name: "Pancetta", quantity: "100g", unit: 'g' },
            { name: "Eggs", quantity: "2", unit: 'item' },
            { name: "Parmesan cheese", quantity: "50g", unit: 'g' },
            { name: "Black pepper", quantity: "to taste", unit: 'personal' }
        ],
        instructions: [
            "Boil the spaghetti in salted water until al dente.",
            "Fry the pancetta until crispy.",
            "Beat the eggs in a bowl, then mix in the Parmesan cheese.",
            "Drain the pasta and mix with the pancetta, then remove from heat and add the egg mixture.",
            "Stir well and season with black pepper before serving."
        ]
    })
})