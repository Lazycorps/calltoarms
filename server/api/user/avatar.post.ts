import { PrismaClient } from "@prisma/client";
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

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

    // Générer un nom unique pour le fichier
    const fileExtension = file.filename.split('.').pop();
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;
    
    // Créer le dossier uploads/avatars s'il n'existe pas
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'avatars');
    await mkdir(uploadsDir, { recursive: true });
    
    // Sauvegarder le fichier
    const filePath = join(uploadsDir, uniqueFilename);
    await writeFile(filePath, file.data);
    
    // URL relative pour la base de données
    const avatarUrl = `/uploads/avatars/${uniqueFilename}`;

    // Mettre à jour le profil avec la nouvelle URL d'avatar
    const profile = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    return { avatarUrl };

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