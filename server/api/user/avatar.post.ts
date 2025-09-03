import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const userId = event.context.user.id;

  try {
    const form = await readMultipartFormData(event);
    
    if (!form || !form.length) {
      throw createError({
        statusCode: 400,
        statusMessage: "No file uploaded"
      });
    }

    const file = form[0];    
    
    if (!file || !file.data || !file.filename) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid file"
      });
    }

    // Vérifier le type de fichier
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type || '')) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid file type. Only JPEG, PNG and WebP are allowed"
      });
    }

    // Vérifier la taille du fichier (limite à 5MB)
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    if (file.data.length > maxSizeInBytes) {
      throw createError({
        statusCode: 400,
        statusMessage: "File too large. Maximum size is 5MB"
      });
    }

    // Convertir en base64 avec le type MIME
    const base64Data = `data:${file.type};base64,${file.data.toString('base64')}`;

    // Mettre à jour l'utilisateur avec l'avatar en base64
    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: base64Data },
    });

    return { avatarUrl: base64Data };

  } catch (error) {
    console.error('Avatar upload error:', error);
    throw createError({
      statusCode: 500,
      statusMessage: "Error uploading avatar"
    });
  } finally {
    await prisma.$disconnect();
  }
});