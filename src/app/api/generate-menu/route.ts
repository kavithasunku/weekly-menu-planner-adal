import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { buildMenuGenerationPrompt } from "./prompt";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const formData = await req.json();
    const { adults, kids, kidsAges, meals, cuisines, diets, busyDays, cookingTime, notes } = formData;

    const result = await generateObject({
      model: openai("gpt-4o"),
      schema: z.object({
        weeklyMenu: z.array(
          z.object({
            day: z.string(),
            meals: z.array(
              z.object({
                type: z.string(), // e.g., "Breakfast", "Lunch", "Dinner"
                name: z.string(),
                description: z.string(),
                prepTime: z.number(),
                cookTime: z.number(),
                caloriesPerServing: z.number(),
                protein: z.number(),
                carbs: z.number(),
                fat: z.number(),
                ingredients: z.array(
                  z.object({
                    amount: z.string(),
                    item: z.string(),
                  })
                ),
                steps: z.array(z.string()),
              })
            ),
          })
        ),
        groceryList: z.array(
          z.object({
            category: z.string(), // e.g., "Produce", "Dairy", "Proteins"
            items: z.array(
              z.object({
                amount: z.string(),
                item: z.string(),
              })
            ),
          })
        ),
      }),
      prompt: buildMenuGenerationPrompt(formData),
    });

    // Transform the array-based meals back into the object-based structure expected by the frontend
    const transformedMenu = {
      ...result.object,
      weeklyMenu: result.object.weeklyMenu.map((day) => ({
        day: day.day,
        meals: day.meals.reduce((acc: any, meal) => {
          acc[meal.type] = {
            name: meal.name,
            description: meal.description,
            prepTime: meal.prepTime,
            cookTime: meal.cookTime,
            caloriesPerServing: meal.caloriesPerServing,
            protein: meal.protein,
            carbs: meal.carbs,
            fat: meal.fat,
            ingredients: meal.ingredients,
            steps: meal.steps,
          };
          return acc;
        }, {}),
      })),
    };

    return Response.json(transformedMenu);
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    // Return the actual error message for debugging
    return Response.json({ 
      error: "Failed to generate menu", 
      details: error.message || "Unknown error",
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    }, { status: 500 });
  }
}
