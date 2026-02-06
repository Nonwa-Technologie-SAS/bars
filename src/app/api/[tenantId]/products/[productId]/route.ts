import { NextRequest, NextResponse } from "next/server";
import { GetProduct } from "@/core/use-cases/products/GetProduct";
import { UpdateProduct } from "@/core/use-cases/products/UpdateProduct";
import { DeleteProduct } from "@/core/use-cases/products/DeleteProduct";
import { PrismaProductRepository } from "@/infrastructure/repositories/PrismaProductRepository";
import { promises as fs } from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string; productId: string } }
) {
  try {
    const { tenantId, productId } = params;
    
    const productRepository = new PrismaProductRepository();
    const getProduct = new GetProduct(productRepository);
    const product = await getProduct.execute(productId, tenantId);

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: product });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { tenantId: string; productId: string } }
) {
  try {
    // Robust fallbacks from URL path when params are undefined in multipart requests
    const urlPath = request.nextUrl.pathname.split("/"); // ["", "api", "{tenantId}", "products", "{productId}"]
    const tenantFromPath = urlPath[2];
    const productIdFromPath = urlPath[4];
    const safeParams = params ?? { tenantId: "", productId: "" };
    const { tenantId: tenantParam, productId: productParam } = safeParams;
    const tenantId = tenantParam || tenantFromPath;
    const productId = productParam || productIdFromPath;
    const contentType = request.headers.get("content-type") || "";

    const productRepository = new PrismaProductRepository();
    const updateProduct = new UpdateProduct(productRepository);
    
    let updatedProduct;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const data: Record<string, unknown> = {};
      if (formData.get("name")) data.name = String(formData.get("name"));
      if (formData.get("description")) data.description = String(formData.get("description"));
      if (formData.get("price")) data.price = Number(formData.get("price"));
      if (formData.get("stockQuantity")) data.stockQuantity = Number(formData.get("stockQuantity"));
      if (formData.get("category")) data.category = String(formData.get("category"));
      if (formData.get("isAvailable")) data.isAvailable = String(formData.get("isAvailable")) === "true";
      if (formData.get("lowStockThreshold")) data.lowStockThreshold = Number(formData.get("lowStockThreshold"));
      if (formData.get("unitOfMeasure")) data.unitOfMeasure = String(formData.get("unitOfMeasure"));

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
        data.imageUrl = `/images/products/${tenantId}/${filename}`;
      }

      updatedProduct = await updateProduct.execute(productId, tenantId, data);
    } else {
      const body = await request.json();
      updatedProduct = await updateProduct.execute(productId, tenantId, body);
    }

    return NextResponse.json({ data: updatedProduct });
  } catch (error: unknown) {
    console.error("Error updating product:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update product";
    if (message === "Product not found") {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { tenantId: string; productId: string } }
) {
  try {
    const { tenantId, productId } = params;

    const productRepository = new PrismaProductRepository();
    const deleteProduct = new DeleteProduct(productRepository);
    
    await deleteProduct.execute(productId, tenantId);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error deleting product:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete product";
    if (message === "Product not found") {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
