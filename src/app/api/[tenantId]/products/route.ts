import { NextRequest, NextResponse } from "next/server";
import { GetProducts } from "@/core/use-cases/GetProducts";
import { CreateProduct } from "@/core/use-cases/products/CreateProducts";
import { PrismaProductRepository } from "@/infrastructure/repositories/PrismaProductRepository";
import { promises as fs } from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;
    console.log(tenantId);
    const searchParams = request.nextUrl.searchParams;
    const availableOnly = searchParams.get("availableOnly") === "true";
    const query = searchParams.get("query") || undefined;
    const category = searchParams.get("category") || undefined;

    const productRepository = new PrismaProductRepository();
    const getProducts = new GetProducts(productRepository);
    const products = await getProducts.execute(tenantId, { availableOnly, query, category });



    return NextResponse.json({ data: products, message: "Products fetched successfully", success: true }); // Unified response format with 'data'
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const urlPath = request.nextUrl.pathname.split("/");
    const tenantFromPath = urlPath[2];
    const { tenantId: tenantParam } = await params;
    const tenantId = tenantParam || tenantFromPath;
    const contentType = request.headers.get("content-type") || "";

    const productRepository = new PrismaProductRepository();
    const createProduct = new CreateProduct(productRepository);

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const name = String(formData.get("name") || "");
      const description = formData.get("description") ? String(formData.get("description")) : undefined;
      const price = Number(formData.get("price") || 0);
      const stockQuantity = Number(formData.get("stockQuantity") || 0);
      const lowStockThreshold = Number(formData.get("lowStockThreshold") || 5);
      const unitOfMeasure = formData.get("unitOfMeasure")
        ? String(formData.get("unitOfMeasure"))
        : "unit";
      const category = formData.get("category") ? String(formData.get("category")) : undefined;
      const isAvailable = formData.get("isAvailable") ? String(formData.get("isAvailable")) === "true" : true;

      let imageUrl: string | undefined = undefined;
      const image = formData.get("image") as File | null;
      if (image) {
        const arrayBuffer = await image.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const ext = path.extname(image.name) || ".png";
        const baseName = path.basename(image.name, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
        const filename = `${baseName}-${Date.now()}${ext}`;
        const dir = path.join(process.cwd(), "public", "images", "products", tenantId);
        await fs.mkdir(dir, { recursive: true });
        const filePath = path.join(dir, filename);
        await fs.writeFile(filePath, buffer);
        imageUrl = `/images/products/${tenantId}/${filename}`;
      }

      const result = await createProduct.execute({
        name,
        description,
        price,
        stockQuantity,
        lowStockThreshold,
        unitOfMeasure,
        category,
        isAvailable,
        imageUrl,
        tenantId,
      });

      return NextResponse.json(result);
    } else {
      const body = await request.json();
      const result = await createProduct.execute({
        ...body,
        tenantId,
        isAvailable: body.isAvailable ?? true,
        lowStockThreshold: body.lowStockThreshold ?? 5,
        unitOfMeasure: body.unitOfMeasure ?? "unit",
      });
      return NextResponse.json(result);
    }
  } catch (error: unknown) {
    console.error("Error creating product:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
