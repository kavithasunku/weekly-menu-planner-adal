import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { groceryList } = await req.json();

    if (!process.env.INSTACART_API_KEY) {
      return NextResponse.json(
        { error: "Instacart API key not configured" },
        { status: 500 }
      );
    }

    // Flatten our categorized grocery list into the format Instacart expects
    // We send the combined amount and item name, Instacart's AI handles the parsing
    const ingredients = groceryList.flatMap((category: any) =>
      category.items.map((item: any) => ({
        name: `${item.amount} ${item.item}`.trim(),
      }))
    );

    const payload = {
      title: `MenuMagic Weekly Groceries`,
      instructions: ["Enjoy your weekly meals powered by MenuMagic!"],
      ingredients: ingredients,
    };

    const response = await fetch("https://connect.instacart.com/idp/v1/products/recipe", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.INSTACART_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Instacart API error:", errorText);
      return NextResponse.json(
        { error: "Failed to generate Instacart shopping list" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ url: data.products_link_url });
  } catch (error) {
    console.error("Instacart route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
